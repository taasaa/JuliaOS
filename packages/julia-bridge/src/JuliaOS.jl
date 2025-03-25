module JuliaOS

using Dates
using Statistics
using Random
using LinearAlgebra
using HTTP
using JSON
using DataFrames
using Distributions
using Logging

# Include submodules
include("JuliaOSBridge.jl")
include("MarketData.jl")
include("SwarmManager.jl")

# Re-export submodules
export MarketData, SwarmManager

# Re-export specific types and functions from MarketData
export MarketDataPoint, fetch_market_data, calculate_indicators, connect_websocket

# Re-export specific types and functions from SwarmManager
export SwarmConfig, Particle, Swarm
export create_swarm, start_swarm!, stop_swarm!, save_swarm, load_swarm
export generate_signals, execute_trade, calculate_fitness
export update_velocity!, update_position!, calculate_sharpe_ratio
export calculate_max_drawdown, update_performance_metrics!

# Constants for configuration
const DEFAULT_PORT = 8765
const DEFAULT_HOST = "127.0.0.1"
const LOG_LEVEL = haskey(ENV, "JULIA_LOG_LEVEL") ? ENV["JULIA_LOG_LEVEL"] : "Info"
const DATA_DIR = haskey(ENV, "JULIAOS_DATA_DIR") ? ENV["JULIAOS_DATA_DIR"] : joinpath(pwd(), "data")
const LOG_DIR = haskey(ENV, "JULIAOS_LOG_DIR") ? ENV["JULIAOS_LOG_DIR"] : joinpath(pwd(), "logs")

# Initialize module
function __init__()
    try
        # Setup logging
        setup_logging()
        
        @info "Julia initialized and ready to receive commands"
        
        # Register signal handlers for clean shutdown
        if Sys.isunix()
            ccall(:signal, Cvoid, (Cint, Ptr{Cvoid}), 2, cglobal(:jl_exit_on_sigint, Ptr{Cvoid}))
        end
        
        # Check for required directories
        if !isdir(DATA_DIR)
            mkdir(DATA_DIR)
            @info "Created data directory: $DATA_DIR"
        end
        
        if !isdir(LOG_DIR)
            mkdir(LOG_DIR)
            @info "Created log directory: $LOG_DIR"
        end
        
        # Initialize SwarmManager
        SwarmManager.initialize()
        
    catch e
        println("ERROR: Failed to initialize JuliaOS: $(sprint(showerror, e, catch_backtrace()))")
        exit(1)
    end
end

"""
    setup_logging()

Set up logging for JuliaOS.
"""
function setup_logging()
    log_file = joinpath(LOG_DIR, "juliaos_$(Dates.format(now(), "yyyy-mm-dd_HH-MM-SS")).log")
    
    log_level = get_log_level(LOG_LEVEL)
    
    # Create log directory if it doesn't exist
    if !isdir(dirname(log_file))
        mkpath(dirname(log_file))
    end
    
    # Create a combined logger that writes to both console and file
    file_logger = SimpleLogger(open(log_file, "a"), log_level)
    console_logger = ConsoleLogger(stderr, log_level)
    
    # Compose loggers into a single logger
    combined_logger = TeeLogger(console_logger, file_logger)
    
    # Set the global logger
    global_logger(combined_logger)
    
    @info "Logging initialized at level $(log_level) to $(log_file)"
end

"""
    get_log_level(level_str::String)::LogLevel

Convert a string log level to a LogLevel.
"""
function get_log_level(level_str::String)::LogLevel
    level_map = Dict(
        "Debug" => Logging.Debug,
        "Info" => Logging.Info,
        "Warn" => Logging.Warn,
        "Error" => Logging.Error
    )
    
    return get(level_map, level_str, Logging.Info)
end

"""
    start_server(host=DEFAULT_HOST, port=DEFAULT_PORT; 
                debug=false, timeout=30)

Start the JuliaOS bridge server.
"""
function start_server(host=DEFAULT_HOST, port=DEFAULT_PORT; debug=false, timeout=30)
    try
        @info "Starting JuliaOS bridge server at http://$host:$port/"
        
        # Include the server module
        include("server.jl")
        
        # Start the server
        server_start(host, port, debug=debug, timeout=timeout)
    catch e
        @error "Failed to start server" exception=(e, catch_backtrace())
        exit(1)
    end
end

# Graceful shutdown handler
function handle_shutdown()
    @info "Shutting down JuliaOS..."
    
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
    
    @info "JuliaOS shutdown complete"
end

# Main entry point when run directly
if abspath(PROGRAM_FILE) == @__FILE__
    @info "Starting JuliaOS in standalone mode"
    
    # Parse command-line arguments
    port = DEFAULT_PORT
    host = DEFAULT_HOST
    debug = false
    timeout = 30
    
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
    
    try
        # Set up shutdown handler
        atexit(handle_shutdown)
        
        # Start the server
        start_server(host, port, debug=debug, timeout=timeout)
    catch e
        @error "Error in JuliaOS main" exception=(e, catch_backtrace())
        exit(1)
    end
end

end # module 