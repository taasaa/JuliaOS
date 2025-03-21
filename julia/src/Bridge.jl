module Bridge

using JSON
using Dates
using HTTP

export send_command, receive_data, register_callback, start_bridge, stop_bridge
export get_wallet_balance, get_token_approvals, execute_trade

const BRIDGE_ENDPOINT = "http://localhost:3000/julia-bridge"
const BRIDGE_WS_ENDPOINT = "ws://localhost:3000/julia-bridge-ws"

# Holds active connections to the bridge
mutable struct BridgeConnection
    http_client::Union{Nothing, HTTP.Client}
    ws_client::Union{Nothing, WebSockets.WebSocket}
    is_connected::Bool
    callbacks::Dict{String, Function}
    
    BridgeConnection() = new(nothing, nothing, false, Dict{String, Function}())
end

# Global connection instance
const CONNECTION = BridgeConnection()

"""
    start_bridge(config_path::String="")

Start a connection to the JS/TS bridge service.
Optionally specify a config file path.
"""
function start_bridge(config_path::String="")
    if CONNECTION.is_connected
        @warn "Bridge already connected"
        return true
    end
    
    config = Dict{String, Any}()
    if !isempty(config_path) && isfile(config_path)
        config = JSON.parse(read(config_path, String))
    end
    
    try
        # Initialize HTTP client
        CONNECTION.http_client = HTTP.Client()
        
        # Test connection
        response = HTTP.post(
            "$BRIDGE_ENDPOINT/ping",
            ["Content-Type" => "application/json"],
            JSON.json(Dict("message" => "ping"))
        )
        
        if response.status == 200
            CONNECTION.is_connected = true
            
            # Start WebSocket in separate task
            @async begin
                try
                    WebSockets.open("$BRIDGE_WS_ENDPOINT") do ws
                        CONNECTION.ws_client = ws
                        while CONNECTION.is_connected
                            data = WebSockets.receive(ws)
                            handle_ws_message(data)
                        end
                    end
                catch e
                    @error "WebSocket error: $e"
                    CONNECTION.is_connected = false
                end
            end
            
            return true
        else
            @error "Bridge connection failed with status $(response.status)"
            return false
        end
    catch e
        @error "Failed to connect to bridge: $e"
        CONNECTION.is_connected = false
        return false
    end
end

"""
    stop_bridge()

Stop the connection to the JS/TS bridge service.
"""
function stop_bridge()
    if !CONNECTION.is_connected
        @warn "Bridge not connected"
        return true
    end
    
    try
        CONNECTION.is_connected = false
        
        # Close WebSocket if active
        if CONNECTION.ws_client !== nothing
            WebSockets.close(CONNECTION.ws_client)
            CONNECTION.ws_client = nothing
        end
        
        # Close HTTP client
        if CONNECTION.http_client !== nothing
            CONNECTION.http_client = nothing
        end
        
        return true
    catch e
        @error "Failed to disconnect from bridge: $e"
        return false
    end
end

"""
    send_command(command::String, params::Dict{String,Any})

Send a command to the JS/TS bridge service.
"""
function send_command(command::String, params::Dict{String,Any})
    if !CONNECTION.is_connected
        @error "Bridge not connected"
        return nothing
    end
    
    try
        payload = Dict(
            "command" => command,
            "params" => params,
            "timestamp" => Dates.now()
        )
        
        response = HTTP.post(
            "$BRIDGE_ENDPOINT/command",
            ["Content-Type" => "application/json"],
            JSON.json(payload)
        )
        
        if response.status == 200
            return JSON.parse(String(response.body))
        else
            @error "Command failed with status $(response.status)"
            return nothing
        end
    catch e
        @error "Failed to send command: $e"
        return nothing
    end
end

"""
    receive_data(data_type::String, params::Dict{String,Any}=Dict{String,Any}())

Request data from the JS/TS bridge service.
"""
function receive_data(data_type::String, params::Dict{String,Any}=Dict{String,Any}())
    if !CONNECTION.is_connected
        @error "Bridge not connected"
        return nothing
    end
    
    try
        payload = Dict(
            "data_type" => data_type,
            "params" => params,
            "timestamp" => Dates.now()
        )
        
        response = HTTP.post(
            "$BRIDGE_ENDPOINT/data",
            ["Content-Type" => "application/json"],
            JSON.json(payload)
        )
        
        if response.status == 200
            return JSON.parse(String(response.body))
        else
            @error "Data request failed with status $(response.status)"
            return nothing
        end
    catch e
        @error "Failed to receive data: $e"
        return nothing
    end
end

"""
    register_callback(event::String, callback::Function)

Register a callback function for a specific event.
"""
function register_callback(event::String, callback::Function)
    CONNECTION.callbacks[event] = callback
    return true
end

"""
    handle_ws_message(data::String)

Internal function to handle WebSocket messages.
"""
function handle_ws_message(data::String)
    try
        message = JSON.parse(data)
        
        if haskey(message, "event") && haskey(CONNECTION.callbacks, message["event"])
            # Call the registered callback
            CONNECTION.callbacks[message["event"]](message)
        end
    catch e
        @error "Failed to handle WebSocket message: $e"
    end
end

# Blockchain and trading specific functions

"""
    get_wallet_balance(chain::String, address::String, token::String="native")

Get the balance of a wallet on a specific chain.
"""
function get_wallet_balance(chain::String, address::String, token::String="native")
    return receive_data("wallet_balance", Dict(
        "chain" => chain,
        "address" => address,
        "token" => token
    ))
end

"""
    get_token_approvals(chain::String, address::String, token::String, spender::String)

Get the token approvals for a specific spender address.
"""
function get_token_approvals(chain::String, address::String, token::String, spender::String)
    return receive_data("token_approvals", Dict(
        "chain" => chain,
        "address" => address,
        "token" => token,
        "spender" => spender
    ))
end

"""
    execute_trade(dex::String, chain::String, params::Dict{String,Any})

Execute a trade on a specific DEX.
"""
function execute_trade(dex::String, chain::String, params::Dict{String,Any})
    return send_command("execute_trade", Dict(
        "dex" => dex,
        "chain" => chain,
        "params" => params
    ))
end

end # module 