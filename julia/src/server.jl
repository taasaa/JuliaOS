using JuliaOS
using HTTP
using WebSockets
using JSON
using Logging

# Global state
const SERVER_STATE = Dict(
    "active_connections" => Set{WebSocket}(),
    "active_swarms" => Dict{String, Any}(),
    "last_health_check" => nothing
)

# API endpoints
function handle_http_request(req::HTTP.Request)
    try
        if req.method == "GET" && req.target == "/health"
            return HTTP.Response(200, JSON.json(JuliaOS.check_system_health()))
        elseif req.method == "POST" && req.target == "/swarm/create"
            body = JSON.parse(String(req.body))
            swarm_id = string(UUIDs.uuid4())
            
            # Create new swarm
            n_agents = get(body, "n_agents", JuliaOS.CONFIG["default_swarm_size"])
            agents, emergent, task_allocator, learner = create_advanced_swarm(n_agents)
            
            SERVER_STATE["active_swarms"][swarm_id] = Dict(
                "agents" => agents,
                "emergent" => emergent,
                "task_allocator" => task_allocator,
                "learner" => learner,
                "created_at" => now()
            )
            
            return HTTP.Response(200, JSON.json(Dict("swarm_id" => swarm_id)))
        elseif req.method == "GET" && startswith(req.target, "/swarm/")
            swarm_id = split(req.target, "/")[3]
            if haskey(SERVER_STATE["active_swarms"], swarm_id)
                return HTTP.Response(200, JSON.json(SERVER_STATE["active_swarms"][swarm_id]))
            else
                return HTTP.Response(404, JSON.json(Dict("error" => "Swarm not found")))
            end
        else
            return HTTP.Response(404, JSON.json(Dict("error" => "Endpoint not found")))
        end
    catch e
        @error "Error handling HTTP request" exception=(e, catch_backtrace())
        return HTTP.Response(500, JSON.json(Dict("error" => string(e))))
    end
end

# WebSocket message handler
function handle_ws_message(ws::WebSocket, message::String)
    try
        data = JSON.parse(message)
        msg_type = get(data, "type", "")
        
        if msg_type == "subscribe_swarm"
            swarm_id = get(data, "swarm_id")
            if haskey(SERVER_STATE["active_swarms"], swarm_id)
                # Start sending swarm updates to this client
                @async begin
                    while isopen(ws)
                        swarm_data = SERVER_STATE["active_swarms"][swarm_id]
                        send(ws, JSON.json(Dict(
                            "type" => "swarm_update",
                            "data" => swarm_data
                        )))
                        sleep(JuliaOS.CONFIG["update_interval"])
                    end
                end
            else
                send(ws, JSON.json(Dict(
                    "type" => "error",
                    "message" => "Swarm not found"
                )))
            end
        elseif msg_type == "control_swarm"
            swarm_id = get(data, "swarm_id")
            action = get(data, "action", "")
            
            if haskey(SERVER_STATE["active_swarms"], swarm_id)
                swarm = SERVER_STATE["active_swarms"][swarm_id]
                
                if action == "pause"
                    # Implement pause logic
                    send(ws, JSON.json(Dict("type" => "status", "message" => "Swarm paused")))
                elseif action == "resume"
                    # Implement resume logic
                    send(ws, JSON.json(Dict("type" => "status", "message" => "Swarm resumed")))
                else
                    send(ws, JSON.json(Dict(
                        "type" => "error",
                        "message" => "Unknown action"
                    )))
                end
            else
                send(ws, JSON.json(Dict(
                    "type" => "error",
                    "message" => "Swarm not found"
                )))
            end
        else
            send(ws, JSON.json(Dict(
                "type" => "error",
                "message" => "Unknown message type"
            )))
        end
    catch e
        @error "Error handling WebSocket message" exception=(e, catch_backtrace())
        send(ws, JSON.json(Dict(
            "type" => "error",
            "message" => string(e)
        )))
    end
end

# WebSocket connection handler
function handle_ws_connection(ws::WebSocket)
    try
        push!(SERVER_STATE["active_connections"], ws)
        @info "New WebSocket connection established"
        
        while isopen(ws)
            message = receive(ws)
            handle_ws_message(ws, message)
        end
    catch e
        @error "WebSocket connection error" exception=(e, catch_backtrace())
    finally
        delete!(SERVER_STATE["active_connections"], ws)
        @info "WebSocket connection closed"
    end
end

# Start server
function start_server(host="127.0.0.1", port=8080)
    # Create HTTP server
    http_server = HTTP.serve(handle_http_request, host, port)
    
    # Create WebSocket server
    ws_server = WebSockets.listen(host, port + 1) do ws
        handle_ws_connection(ws)
    end
    
    @info "Server started" host=host http_port=port ws_port=port+1
    
    # Start health check loop
    @async begin
        while true
            SERVER_STATE["last_health_check"] = JuliaOS.check_system_health()
            sleep(60)  # Check every minute
        end
    end
    
    return http_server, ws_server
end

# Run server if this file is executed directly
if abspath(PROGRAM_FILE) == @__FILE__
    http_server, ws_server = start_server()
    
    # Keep the main thread alive
    while true
        sleep(1)
    end
end 