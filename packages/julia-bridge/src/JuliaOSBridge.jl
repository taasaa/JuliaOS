module JuliaOSBridge

using JSON
using Dates
using Statistics
using Random
using HTTP
using DataFrames
using Distributions
using LinearAlgebra

# Disable precompilation to avoid method extension issues
__precompile__(false)

# Simple Base Type Definitions
struct MarketDataPoint
    timestamp::DateTime
    price::Float64
    volume::Float64
    liquidity::Float64
    indicators::Dict{String, Float64}
end

# Include module files
include("MarketData.jl")
include("Swarm.jl")
include("SwarmManager.jl")

# Export types and functions
export MarketDataPoint, fetch_market_data, calculate_indicators, connect_websocket
export calculate_macd, calculate_ema, calculate_rsi, calculate_bollinger_bands, calculate_vwap
export SwarmConfig, Particle, Swarm, create_swarm, optimize_swarm
export start_swarm!, stop_swarm!, save_swarm, load_swarm, generate_signals
export execute_trade, calculate_fitness, update_velocity!, update_position!
export calculate_sharpe_ratio, calculate_max_drawdown, update_performance_metrics!
export handle_command, register_command

# Dictionary of registered command handlers
const COMMANDS = Dict{String, Function}()

"""
    handle_command(command::String, data::Dict)

Handle a command from the TypeScript bridge.
"""
function handle_command(command::String, data::Dict)
    if haskey(COMMANDS, command)
        try
            # Call the registered handler for this command
            return COMMANDS[command](data)
        catch e
            # Return error
            return Dict(
                "success" => false,
                "error" => Dict(
                    "message" => "Error executing command: $(sprint(showerror, e))",
                    "stack" => string(stacktrace(catch_backtrace()))
                )
            )
        end
    else
        # Unknown command
        return Dict(
            "success" => false,
            "error" => Dict(
                "message" => "Unknown command: $command"
            )
        )
    end
end

"""
    register_command(command::String, handler::Function)

Register a handler for a command.
"""
function register_command(command::String, handler::Function)
    COMMANDS[command] = handler
    return true
end

"""
    execute_julia_code(data::Dict)

Execute arbitrary Julia code.
"""
function execute_julia_code(data::Dict)
    code = get(data, "code", "")
    
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
        "success" => true,
        "result" => json_result
    )
end

"""
    ping(data::Dict)

Simple ping command to test connection.
"""
function ping(data::Dict)
    return Dict(
        "success" => true,
        "result" => Dict(
            "message" => "pong",
            "timestamp" => string(Dates.now())
        )
    )
end

# Register default command handlers
function __init__()
    register_command("execute_code", execute_julia_code)
    register_command("ping", ping)
    
    # Register SwarmManager commands if available
    if isdefined(Main, :SwarmManager)
        # SwarmManager module exists
        @eval begin
            using Main.SwarmManager
            
            # Import SwarmManager functions
            function create_swarm_command(data::Dict)
                # Create SwarmConfig from command data
                config = SwarmManager.SwarmConfig(
                    get(data, "id", string(uuid4())),
                    get(data, "name", "Unnamed Swarm"),
                    get(data, "size", 30),
                    Symbol(get(data, "algorithm", "pso")),
                    get(data, "parameters", Dict())
                )
                
                # Create and start the swarm
                swarm = SwarmManager.create_swarm(config)
                SwarmManager.start_swarm!(swarm)
                
                return Dict(
                    "success" => true,
                    "result" => Dict(
                        "swarmId" => swarm.id,
                        "status" => "running"
                    )
                )
            end
            
            function stop_swarm_command(data::Dict)
                swarm_id = get(data, "swarmId", "")
                
                # Find and stop the swarm
                swarm = SwarmManager.get_swarm(swarm_id)
                if swarm === nothing
                    return Dict(
                        "success" => false,
                        "error" => Dict(
                            "message" => "Swarm not found: $swarm_id"
                        )
                    )
                end
                
                SwarmManager.stop_swarm!(swarm)
                
                return Dict(
                    "success" => true,
                    "result" => Dict(
                        "swarmId" => swarm_id,
                        "status" => "stopped"
                    )
                )
            end
            
            function optimize_swarm_command(data::Dict)
                swarm_id = get(data, "swarmId", "")
                market_data = get(data, "marketData", [])
                trading_pairs = get(data, "tradingPairs", String[])
                risk_parameters = get(data, "riskParameters", Dict())
                
                # Find the swarm
                swarm = SwarmManager.get_swarm(swarm_id)
                if swarm === nothing
                    return Dict(
                        "success" => false,
                        "error" => Dict(
                            "message" => "Swarm not found: $swarm_id"
                        )
                    )
                end
                
                # Convert market data to appropriate format
                formatted_market_data = Main.MarketData.from_json(market_data)
                
                # Run optimization
                signal = SwarmManager.optimize(swarm, formatted_market_data, trading_pairs, risk_parameters)
                
                return Dict(
                    "success" => true,
                    "result" => signal
                )
            end
            
            function get_swarm_status_command(data::Dict)
                swarm_id = get(data, "swarmId", "")
                
                # Find the swarm
                swarm = SwarmManager.get_swarm(swarm_id)
                if swarm === nothing
                    return Dict(
                        "success" => false,
                        "error" => Dict(
                            "message" => "Swarm not found: $swarm_id"
                        )
                    )
                end
                
                # Get swarm status
                status = SwarmManager.get_status(swarm)
                
                return Dict(
                    "success" => true,
                    "result" => status
                )
            end
            
            register_command("start_swarm", create_swarm_command)
            register_command("stop_swarm", stop_swarm_command)
            register_command("optimize_swarm", optimize_swarm_command)
            register_command("get_swarm_status", get_swarm_status_command)
        end
    end
end

end # module 