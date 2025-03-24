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

end # module 