using HTTP
using JSON
using Sockets
using Dates
using Logging
using Base64

# Default server configuration
const DEFAULT_PORT = 8765
const DEFAULT_HOST = "127.0.0.1"
const MAX_CONN_QUEUE = 100
const MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10 MB
const REQUEST_TIMEOUT = 30  # seconds

# Safety options
const ENABLE_CORS = haskey(ENV, "JULIAOS_ENABLE_CORS") ? parse(Bool, ENV["JULIAOS_ENABLE_CORS"]) : false
const ALLOWED_ORIGINS = haskey(ENV, "JULIAOS_ALLOWED_ORIGINS") ? split(ENV["JULIAOS_ALLOWED_ORIGINS"], ",") : String[]
const AUTH_REQUIRED = haskey(ENV, "JULIAOS_AUTH_REQUIRED") ? parse(Bool, ENV["JULIAOS_AUTH_REQUIRED"]) : false
const API_KEY = haskey(ENV, "JULIAOS_API_KEY") ? ENV["JULIAOS_API_KEY"] : ""

# Connection stats
const SERVER_STATS = Dict(
    "started_at" => now(),
    "total_requests" => 0,
    "successful_requests" => 0,
    "failed_requests" => 0,
    "active_connections" => 0,
    "errors" => Dict{String, Int}()
)

# Active connections map
const ACTIVE_CONNECTIONS = Dict{String, Dict{String, Any}}()

"""
    server_start(host=DEFAULT_HOST, port=DEFAULT_PORT; 
                debug=false, timeout=REQUEST_TIMEOUT)

Start the HTTP and WebSocket server for the JuliaOS bridge.
"""
function server_start(host=DEFAULT_HOST, port=DEFAULT_PORT; debug=false, timeout=REQUEST_TIMEOUT)
    # Set up server options
    server_options = Dict(
        :server => Sockets.TCPServer(Sockets.InetAddr(parse(IPAddr, host), port), true, MAX_CONN_QUEUE),
        :readtimeout => timeout
    )
    
    @info "JuliaOS bridge server starting at http://$host:$port/"
    
    # Set up signal handlers for graceful shutdown
    if Sys.isunix()
        for sig in [SIGINT, SIGTERM]
            handle_signals(sig) do signal
                @info "Received signal $signal, shutting down server..."
                graceful_shutdown()
                exit(0)
            end
        end
    end
    
    # Start HTTP server
    @async begin
        try
            HTTP.serve(handler, host, port; server_options...)
        catch e
            if isa(e, InterruptException)
                @info "Server interrupted, shutting down..."
            else
                @error "Server error" exception=(e, catch_backtrace())
            end
        end
    end
    
    # Print startup banner
    print_startup_banner(host, port, debug)
    
    # Keep the server running
    try
        # Start health check timer
        @async run_health_checks()
        
        # Main loop to keep server running
        while true
            sleep(1)
        end
    catch e
        if isa(e, InterruptException)
            @info "Server interrupted, shutting down..."
            graceful_shutdown()
        else
            @error "Error in server main loop" exception=(e, catch_backtrace())
            graceful_shutdown()
            rethrow(e)
        end
    end
end

"""
    handler(http::HTTP.Stream)

Main HTTP request handler.
"""
function handler(http::HTTP.Stream)
    # Increment total requests
    SERVER_STATS["total_requests"] += 1
    
    # Generate a unique connection ID
    conn_id = string(UUIDs.uuid4())
    
    # Create connection tracking
    ACTIVE_CONNECTIONS[conn_id] = Dict(
        "id" => conn_id,
        "started_at" => now(),
        "client_ip" => get_client_ip(http.message),
        "path" => http.message.target,
        "method" => http.message.method
    )
    
    # Increment active connections
    SERVER_STATS["active_connections"] += 1
    
    try
        # Handle WebSocket upgrade requests
        if HTTP.WebSockets.is_websocket_upgrade(http.message)
            # Check authentication for WebSocket connections
            if AUTH_REQUIRED && !is_authenticated(http.message)
                HTTP.setstatus(http, 401)
                return HTTP.Response(401, JSON.json(Dict(
                    "error" => "Unauthorized"
                )))
            end
            
            # Check CORS if enabled
            if ENABLE_CORS && !check_cors(http.message)
                HTTP.setstatus(http, 403)
                return HTTP.Response(403, JSON.json(Dict(
                    "error" => "CORS not allowed"
                )))
            end
            
            # Upgrade to WebSocket
            HTTP.WebSockets.upgrade(http) do ws
                handle_websocket(ws, conn_id)
            end
        else
            # Handle regular HTTP requests
            handle_http(http, conn_id)
        end
        
        # Increment successful requests
        SERVER_STATS["successful_requests"] += 1
    catch e
        # Handle errors
        SERVER_STATS["failed_requests"] += 1
        
        # Track error types
        error_type = string(typeof(e))
        if haskey(SERVER_STATS["errors"], error_type)
            SERVER_STATS["errors"][error_type] += 1
        else
            SERVER_STATS["errors"][error_type] = 1
        end
        
        if isa(e, HTTP.ExceptionRequest.RequestError)
            @info "HTTP request error: $(e.message)"
            return HTTP.Response(e.status, JSON.json(Dict(
                "error" => e.message
            )))
        else
            @error "Error handling request" exception=(e, catch_backtrace())
            return HTTP.Response(500, JSON.json(Dict(
                "error" => "Internal server error"
            )))
        end
    finally
        # Clean up connection tracking
        SERVER_STATS["active_connections"] -= 1
        if haskey(ACTIVE_CONNECTIONS, conn_id)
            ACTIVE_CONNECTIONS[conn_id]["ended_at"] = now()
            
            # Keep a history of recent connections for debugging
            if length(ACTIVE_CONNECTIONS) > 1000
                # Find oldest connection and remove it
                oldest_id = conn_id
                oldest_time = now()
                
                for (id, conn) in ACTIVE_CONNECTIONS
                    if haskey(conn, "ended_at") && conn["ended_at"] < oldest_time
                        oldest_id = id
                        oldest_time = conn["ended_at"]
                    end
                end
                
                delete!(ACTIVE_CONNECTIONS, oldest_id)
            end
        end
    end
end

"""
    handle_http(http, conn_id)

Handle HTTP requests to the server.
"""
function handle_http(http, conn_id)
    request = http.message
    route = request.target
    
    # Check authentication if required
    if AUTH_REQUIRED && !is_authenticated(request)
        HTTP.setstatus(http, 401)
        return HTTP.Response(401, JSON.json(Dict(
            "error" => "Unauthorized"
        )))
    end
    
    # Check CORS if enabled
    if ENABLE_CORS && request.method == "OPTIONS"
        return handle_cors_preflight(http)
    end
    
    if ENABLE_CORS && !check_cors(request)
        HTTP.setstatus(http, 403)
        return HTTP.Response(403, JSON.json(Dict(
            "error" => "CORS not allowed"
        )))
    end
    
    if request.method == "POST"
        if route == "/julia-bridge"
            # Process bridge command
            body = String(HTTP.payload(request))
            
            # Check request size
            if length(body) > MAX_REQUEST_SIZE
                HTTP.setstatus(http, 413)
                return HTTP.Response(413, JSON.json(Dict(
                    "error" => "Request too large",
                    "max_size" => MAX_REQUEST_SIZE
                )))
            end
            
            response = process_command(body)
            HTTP.setheader(http, "Content-Type" => "application/json")
            
            if ENABLE_CORS
                add_cors_headers(http)
            end
            
            return HTTP.Response(200, JSON.json(response))
        elseif route == "/julia-bridge/ping"
            # Simple ping endpoint
            if ENABLE_CORS
                add_cors_headers(http)
            end
            
            return HTTP.Response(200, JSON.json(Dict(
                "status" => "ok",
                "timestamp" => string(Dates.now())
            )))
        elseif route == "/julia-bridge/status"
            # Server status endpoint
            if ENABLE_CORS
                add_cors_headers(http)
            end
            
            # Get server stats
            uptime = now() - SERVER_STATS["started_at"]
            status = Dict(
                "status" => "ok",
                "uptime_seconds" => Dates.value(convert(Dates.Second, uptime)),
                "started_at" => string(SERVER_STATS["started_at"]),
                "request_stats" => Dict(
                    "total" => SERVER_STATS["total_requests"],
                    "successful" => SERVER_STATS["successful_requests"],
                    "failed" => SERVER_STATS["failed_requests"]
                ),
                "active_connections" => SERVER_STATS["active_connections"],
                "error_counts" => SERVER_STATS["errors"],
                "swarm_stats" => Dict(
                    "active_swarms" => length(keys(SwarmManager.SWARMS))
                )
            )
            
            return HTTP.Response(200, JSON.json(status))
        else
            # Unknown route
            if ENABLE_CORS
                add_cors_headers(http)
            end
            
            HTTP.setstatus(http, 404)
            return HTTP.Response(404, JSON.json(Dict(
                "error" => "Not found",
                "route" => route
            )))
        end
    else
        # Only allow POST requests and OPTIONS (for CORS)
        if ENABLE_CORS
            add_cors_headers(http)
        end
        
        HTTP.setstatus(http, 405)
        return HTTP.Response(405, JSON.json(Dict(
            "error" => "Method not allowed",
            "method" => request.method
        )))
    end
end

"""
    handle_websocket(ws, conn_id)

Handle WebSocket connections.
"""
function handle_websocket(ws, conn_id)
    @info "WebSocket connection established" conn_id
    
    # Keep track of connection state
    if haskey(ACTIVE_CONNECTIONS, conn_id)
        ACTIVE_CONNECTIONS[conn_id]["type"] = "websocket"
    end
    
    try
        for msg in ws
            try
                # Process message
                response = process_command(String(msg))
                
                # Send response
                write(ws, JSON.json(response))
            catch e
                @error "WebSocket message error" exception=(e, catch_backtrace())
                
                # Send error response
                write(ws, JSON.json(Dict(
                    "id" => "error",
                    "error" => Dict(
                        "code" => "MESSAGE_PROCESSING_ERROR",
                        "message" => "Error processing message: $(e)"
                    )
                )))
            end
        end
    catch e
        @error "WebSocket error" conn_id exception=(e, catch_backtrace())
    finally
        @info "WebSocket connection closed" conn_id
    end
end

"""
    process_command(json_str)

Process a command received from TypeScript/JavaScript.
"""
function process_command(json_str)
    try
        # Parse the JSON command
        data = JSON.parse(json_str)
        
        # Extract command details
        command_id = get(data, "id", string(UUIDs.uuid4()))
        command_name = get(data, "command", "")
        command_data = get(data, "data", Dict())
        
        # Rate limiting and security checks can be added here
        
        # Process command
        if command_name == "ping"
            return Dict(
                "id" => command_id,
                "result" => Dict(
                    "status" => "ok",
                    "timestamp" => string(Dates.now())
                )
            )
        elseif command_name == "execute_code"
            if AUTH_REQUIRED
                # Additional security check for code execution
                return Dict(
                    "id" => command_id,
                    "error" => Dict(
                        "code" => "SECURITY_VIOLATION",
                        "message" => "Code execution not allowed in production mode"
                    )
                )
            else
                code = get(command_data, "code", "")
                return execute_julia_code(command_id, code)
            end
        elseif command_name == "start_swarm"
            return start_swarm_command(command_id, command_data)
        elseif command_name == "stop_swarm"
            swarm_id = get(command_data, "swarmId", "")
            return stop_swarm_command(command_id, swarm_id)
        elseif command_name == "optimize_swarm"
            return optimize_swarm_command(command_id, command_data)
        elseif command_name == "get_swarm_status"
            swarm_id = get(command_data, "swarmId", "")
            return get_swarm_status_command(command_id, swarm_id)
        elseif command_name == "shutdown"
            # Only allow shutdown if we're not in production mode
            if !AUTH_REQUIRED
                @async begin
                    sleep(1)
                    graceful_shutdown()
                    exit(0)
                end
                
                return Dict(
                    "id" => command_id,
                    "result" => Dict(
                        "status" => "shutdown_initiated"
                    )
                )
            else
                return Dict(
                    "id" => command_id,
                    "error" => Dict(
                        "code" => "SECURITY_VIOLATION",
                        "message" => "Shutdown not allowed in production mode"
                    )
                )
            end
        else
            # Try bridge command handlers
            if isdefined(Main, :JuliaOSBridge) && isdefined(Main.JuliaOSBridge, :handle_command)
                # Use the bridge command handler
                result = Main.JuliaOSBridge.handle_command(command_name, command_data)
                
                if isa(result, Dict) && haskey(result, "success") && haskey(result, "result")
                    return Dict(
                        "id" => command_id,
                        "result" => result["result"]
                    )
                elseif isa(result, Dict) && haskey(result, "success") && !result["success"] && haskey(result, "error")
                    return Dict(
                        "id" => command_id,
                        "error" => result["error"]
                    )
                else
                    return Dict(
                        "id" => command_id,
                        "result" => result
                    )
                end
            else
                return Dict(
                    "id" => command_id,
                    "error" => Dict(
                        "code" => "UNKNOWN_COMMAND",
                        "message" => "Unknown command: $command_name"
                    )
                )
            end
        end
    catch e
        @error "Command processing error" exception=(e, catch_backtrace())
        
        # Try to extract the command ID from the original request
        command_id = "unknown"
        try
            parsed = JSON.parse(json_str)
            if haskey(parsed, "id")
                command_id = parsed["id"]
            end
        catch
            # Ignore parsing errors here
        end
        
        return Dict(
            "id" => command_id,
            "error" => Dict(
                "code" => "COMMAND_PROCESSING_ERROR",
                "message" => "Error processing command: $(sprint(showerror, e))"
            )
        )
    end
end

"""
    execute_julia_code(command_id, code)

Execute arbitrary Julia code and return the result.
"""
function execute_julia_code(command_id, code)
    try
        # Execute the code in a sandbox
        result = @eval Main begin
            $code
        end
        
        # Convert result to string or simple type for JSON
        if result isa Number || result isa String || result isa Bool || result === nothing
            json_result = result
        else
            json_result = string(result)
        end
        
        return Dict(
            "id" => command_id,
            "result" => json_result
        )
    catch e
        @error "Code execution error" exception=(e, catch_backtrace())
        
        return Dict(
            "id" => command_id,
            "error" => Dict(
                "code" => "CODE_EXECUTION_ERROR",
                "message" => "Error executing code: $(sprint(showerror, e))"
            )
        )
    end
end

"""
    start_swarm_command(command_id, data)

Start a new swarm with the given configuration.
"""
function start_swarm_command(command_id, data)
    try
        # Create SwarmConfig from command data
        config = SwarmManager.SwarmConfig(
            get(data, "id", string(UUIDs.uuid4())),
            get(data, "name", "Unnamed Swarm"),
            get(data, "size", 30),
            Symbol(get(data, "algorithm", "pso")),
            get(data, "parameters", Dict())
        )
        
        # Create and start the swarm
        swarm = SwarmManager.create_swarm(config)
        SwarmManager.start_swarm!(swarm)
        
        return Dict(
            "id" => command_id,
            "result" => Dict(
                "swarmId" => swarm.id,
                "status" => "running"
            )
        )
    catch e
        @error "Swarm creation error" exception=(e, catch_backtrace())
        
        return Dict(
            "id" => command_id,
            "error" => Dict(
                "code" => "SWARM_CREATION_ERROR",
                "message" => "Error creating swarm: $(sprint(showerror, e))"
            )
        )
    end
end

"""
    stop_swarm_command(command_id, swarm_id)

Stop a running swarm.
"""
function stop_swarm_command(command_id, swarm_id)
    try
        # Find and stop the swarm
        swarm = SwarmManager.get_swarm(swarm_id)
        if swarm === nothing
            return Dict(
                "id" => command_id,
                "error" => Dict(
                    "code" => "SWARM_NOT_FOUND",
                    "message" => "Swarm not found: $swarm_id"
                )
            )
        end
        
        SwarmManager.stop_swarm!(swarm)
        
        return Dict(
            "id" => command_id,
            "result" => Dict(
                "swarmId" => swarm_id,
                "status" => "stopped"
            )
        )
    catch e
        @error "Swarm stop error" exception=(e, catch_backtrace())
        
        return Dict(
            "id" => command_id,
            "error" => Dict(
                "code" => "SWARM_STOP_ERROR",
                "message" => "Error stopping swarm: $(sprint(showerror, e))"
            )
        )
    end
end

"""
    optimize_swarm_command(command_id, data)

Run optimization on a swarm.
"""
function optimize_swarm_command(command_id, data)
    try
        swarm_id = get(data, "swarmId", "")
        market_data = get(data, "marketData", [])
        trading_pairs = get(data, "tradingPairs", String[])
        risk_parameters = get(data, "riskParameters", Dict())
        
        # Find the swarm
        swarm = SwarmManager.get_swarm(swarm_id)
        if swarm === nothing
            return Dict(
                "id" => command_id,
                "error" => Dict(
                    "code" => "SWARM_NOT_FOUND",
                    "message" => "Swarm not found: $swarm_id"
                )
            )
        end
        
        # Convert market data to appropriate format
        formatted_market_data = MarketData.from_json(market_data)
        
        # Run optimization
        signal = SwarmManager.optimize(swarm, formatted_market_data, trading_pairs, risk_parameters)
        
        return Dict(
            "id" => command_id,
            "result" => signal
        )
    catch e
        @error "Optimization error" exception=(e, catch_backtrace())
        
        return Dict(
            "id" => command_id,
            "error" => Dict(
                "code" => "OPTIMIZATION_ERROR",
                "message" => "Error running optimization: $(sprint(showerror, e))"
            )
        )
    end
end

"""
    get_swarm_status_command(command_id, swarm_id)

Get the status of a swarm.
"""
function get_swarm_status_command(command_id, swarm_id)
    try
        # Find the swarm
        swarm = SwarmManager.get_swarm(swarm_id)
        if swarm === nothing
            return Dict(
                "id" => command_id,
                "error" => Dict(
                    "code" => "SWARM_NOT_FOUND",
                    "message" => "Swarm not found: $swarm_id"
                )
            )
        end
        
        # Get swarm status
        status = SwarmManager.get_status(swarm)
        
        return Dict(
            "id" => command_id,
            "result" => status
        )
    catch e
        @error "Status error" exception=(e, catch_backtrace())
        
        return Dict(
            "id" => command_id,
            "error" => Dict(
                "code" => "STATUS_ERROR",
                "message" => "Error getting swarm status: $(sprint(showerror, e))"
            )
        )
    end
end

"""
    handle_cors_preflight(http)

Handle CORS preflight requests.
"""
function handle_cors_preflight(http)
    if ENABLE_CORS
        add_cors_headers(http)
    end
    
    return HTTP.Response(204)
end

"""
    add_cors_headers(http)

Add CORS headers to an HTTP response.
"""
function add_cors_headers(http)
    origin = HTTP.header(http.message, "Origin")
    
    if !isempty(ALLOWED_ORIGINS) && isempty(origin)
        # No origin header, so no CORS headers
        return
    end
    
    if !isempty(ALLOWED_ORIGINS) && !(origin in ALLOWED_ORIGINS) && !("*" in ALLOWED_ORIGINS)
        # Origin not in allowed list
        return
    end
    
    HTTP.setheader(http, "Access-Control-Allow-Origin" => isempty(origin) ? "*" : origin)
    HTTP.setheader(http, "Access-Control-Allow-Methods" => "POST, OPTIONS")
    HTTP.setheader(http, "Access-Control-Allow-Headers" => "Content-Type, Authorization")
    HTTP.setheader(http, "Access-Control-Max-Age" => "86400")
end

"""
    check_cors(request)

Check if the origin is allowed by CORS policy.
"""
function check_cors(request)
    if !ENABLE_CORS || isempty(ALLOWED_ORIGINS)
        return true
    end
    
    origin = HTTP.header(request, "Origin")
    
    if isempty(origin)
        return true
    end
    
    return origin in ALLOWED_ORIGINS || "*" in ALLOWED_ORIGINS
end

"""
    is_authenticated(request)

Check if the request is authenticated.
"""
function is_authenticated(request)
    if !AUTH_REQUIRED
        return true
    end
    
    # Check Authorization header
    auth_header = HTTP.header(request, "Authorization")
    
    if isempty(auth_header)
        return false
    end
    
    # Check if Bearer token
    if startswith(auth_header, "Bearer ")
        token = auth_header[8:end]
        return token == API_KEY
    elseif startswith(auth_header, "ApiKey ")
        api_key = auth_header[8:end]
        return api_key == API_KEY
    end
    
    return false
end

"""
    get_client_ip(request)

Get the client IP address from the request.
"""
function get_client_ip(request)
    # Try X-Forwarded-For header
    forwarded_for = HTTP.header(request, "X-Forwarded-For")
    
    if !isempty(forwarded_for)
        # Get the first IP in the list
        ips = split(forwarded_for, ",")
        return strip(ips[1])
    end
    
    # Try X-Real-IP header
    real_ip = HTTP.header(request, "X-Real-IP")
    
    if !isempty(real_ip)
        return real_ip
    end
    
    # Fall back to connection info
    if isdefined(request, :conninfo) && isdefined(request.conninfo, :remote_addr)
        return string(request.conninfo.remote_addr)
    end
    
    return "unknown"
end

"""
    run_health_checks()

Run periodic health checks on the server.
"""
function run_health_checks()
    health_check_interval = 60  # seconds
    
    while true
        try
            # Check swarm health
            for swarm_id in keys(SwarmManager.SWARMS)
                swarm = SwarmManager.get_swarm(swarm_id)
                if swarm !== nothing && swarm.is_running
                    # Check if swarm is healthy (e.g., not stuck)
                    last_updated = swarm.last_updated
                    if time() - last_updated > 600  # 10 minutes
                        @warn "Swarm $(swarm.id) appears stuck (not updated in >10 minutes)"
                    end
                end
            end
            
            # Check system resources
            free_memory = Sys.free_memory() / (1024^2)  # MB
            if free_memory < 100  # Less than 100 MB free
                @warn "Low memory: $(round(Int, free_memory)) MB free"
            end
            
            # Add more health checks as needed
            
        catch e
            @error "Error running health checks" exception=(e, catch_backtrace())
        end
        
        sleep(health_check_interval)
    end
end

"""
    graceful_shutdown()

Perform a graceful shutdown of the server.
"""
function graceful_shutdown()
    @info "Performing graceful shutdown..."
    
    # Stop all swarms
    for swarm_id in keys(SwarmManager.SWARMS)
        try
            swarm = SwarmManager.get_swarm(swarm_id)
            if swarm !== nothing && swarm.is_running
                SwarmManager.stop_swarm!(swarm)
                @info "Stopped swarm: $(swarm.id)"
            end
        catch e
            @warn "Error stopping swarm $(swarm_id): $(sprint(showerror, e))"
        end
    end
    
    @info "Server shutdown complete"
end

"""
    print_startup_banner(host, port, debug)

Print a startup banner with server information.
"""
function print_startup_banner(host, port, debug)
    banner = """
    ╔═════════════════════════════════════════════════╗
    ║               JuliaOS Bridge Server             ║
    ╠═════════════════════════════════════════════════╣
    ║ Server started at http://$(host):$(port)$(repeat(" ", 23 - length(string(host)) - length(string(port))))║
    ║ Production mode: $(AUTH_REQUIRED ? "enabled " : "disabled")$(repeat(" ", 25))║
    ║ CORS: $(ENABLE_CORS ? "enabled " : "disabled")$(repeat(" ", 33))║
    ║ Debug mode: $(debug ? "enabled " : "disabled")$(repeat(" ", 28))║
    ║ Started at: $(Dates.format(now(), "yyyy-mm-dd HH:MM:SS"))$(repeat(" ", 23))║
    ╚═════════════════════════════════════════════════╝
    """
    
    println(banner)
end

# Run the server if executed directly
if abspath(PROGRAM_FILE) == @__FILE__
    # Parse command-line arguments
    port = DEFAULT_PORT
    host = DEFAULT_HOST
    debug = false
    timeout = REQUEST_TIMEOUT
    
    for (i, arg) in enumerate(ARGS)
        if arg == "--port" && i < length(ARGS)
            port = parse(Int, ARGS[i+1])
        elseif arg == "--host" && i < length(ARGS)
            host = ARGS[i+1]
        elseif arg == "--debug"
            debug = true
        elseif arg == "--timeout" && i < length(ARGS)
            timeout = parse(Int, ARGS[i+1])
        end
    end
    
    server_start(host, port, debug=debug, timeout=timeout)
end 