module JuliaOS

using Dates
using Statistics
using Random
using LinearAlgebra
using HTTP
using JSON
using DataFrames
using Distributions

# Include submodules
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

# Initialize module
function __init__()
    # Any initialization code can go here
end

end # module 