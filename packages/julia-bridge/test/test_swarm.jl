using Test
using JuliaOS
using Dates
using Statistics
using Random
using LinearAlgebra

# Test data
test_prices = [100.0, 98.0, 96.0, 94.0, 92.0, 90.0, 88.0, 86.0, 84.0, 82.0]  # Downward trend for RSI < 30
test_volumes = [1000.0, 1200.0, 1100.0, 1300.0, 1200.0, 1400.0, 1300.0, 1500.0, 1400.0, 1600.0]

# Create test market data
test_market_data = Vector{JuliaOS.MarketData.MarketDataPoint}()
for i in 1:length(test_prices)
    push!(test_market_data, JuliaOS.MarketData.MarketDataPoint(
        now(),
        test_prices[i],
        test_volumes[i],
        10000.0,
        Dict{String, Float64}()
    ))
end

# Test swarm configuration
test_config = JuliaOS.SwarmManager.SwarmConfig(
    "test_swarm",
    10,  # Small swarm size for testing
    "pso",
    ["ETH/USDC"],
    Dict(
        "inertia" => 0.8,
        "cognitiveWeight" => 1.5,
        "socialWeight" => 1.5,
        "maxIterations" => 100
    )
)

# Test swarm creation
@testset "Swarm Creation" begin
    swarm = JuliaOS.SwarmManager.create_swarm(test_config)
    
    @test length(swarm.particles) == test_config.size
    @test swarm.iteration == 0
    @test !swarm.is_running
    @test swarm.global_best_fitness == Inf
    
    # Test particle initialization
    for particle in swarm.particles
        @test length(particle.position) == 4  # 4 parameters per trading pair
        @test length(particle.velocity) == 4
        @test particle.best_fitness == Inf
        @test haskey(particle.portfolio, "USDC")
        @test particle.portfolio["USDC"] == 10000.0
        @test isempty(particle.trades)
    end
end

# Test technical indicators
@testset "Technical Indicators" begin
    indicators = JuliaOS.MarketData.calculate_indicators(test_prices, test_volumes)
    
    @test haskey(indicators, "sma_20")
    @test haskey(indicators, "sma_50")
    @test haskey(indicators, "rsi")
    @test haskey(indicators, "macd")
    @test haskey(indicators, "bb_upper")
    @test haskey(indicators, "bb_middle")
    @test haskey(indicators, "bb_lower")
    @test haskey(indicators, "vwap")
end

# Test trading signals
@testset "Trading Signals" begin
    # Test parameters: entry, exit, stop loss, take profit
    params = [0.2, 0.8, 5.0, 10.0]  # Lower entry threshold to trigger buy signals
    signals = JuliaOS.SwarmManager.generate_signals(params, test_market_data)
    
    @test !isempty(signals)
    for signal in signals
        @test haskey(signal, "action")
        @test haskey(signal, "price")
        @test haskey(signal, "amount")
        @test haskey(signal, "stop_loss")
        @test haskey(signal, "take_profit")
    end
end

# Test trade execution
@testset "Trade Execution" begin
    swarm = JuliaOS.SwarmManager.create_swarm(test_config)
    particle = swarm.particles[1]
    
    # Test buy signal
    buy_signal = Dict(
        "action" => "buy",
        "price" => 100.0,
        "amount" => 1.0,
        "stop_loss" => 95.0,
        "take_profit" => 110.0,
        "pair" => "ETH/USDC"
    )
    
    result = JuliaOS.SwarmManager.execute_trade(particle, buy_signal, test_market_data[1])
    @test result["success"]
    @test particle.portfolio["USDC"] < 10000.0
    @test haskey(particle.portfolio, "ETH/USDC")
    @test length(particle.trades) == 1
    
    # Test sell signal
    sell_signal = Dict(
        "action" => "sell",
        "price" => 110.0,
        "amount" => 1.0,
        "stop_loss" => 115.0,
        "take_profit" => 100.0,
        "pair" => "ETH/USDC"
    )
    
    result = JuliaOS.SwarmManager.execute_trade(particle, sell_signal, test_market_data[end])
    @test result["success"]
    @test particle.portfolio["USDC"] > 10000.0
    @test length(particle.trades) == 2
end

# Test performance metrics
@testset "Performance Metrics" begin
    returns = [0.01, -0.005, 0.02, 0.015, -0.01]
    
    sharpe = JuliaOS.SwarmManager.calculate_sharpe_ratio(returns)
    @test sharpe > 0
    
    max_dd = JuliaOS.SwarmManager.calculate_max_drawdown(returns)
    @test max_dd >= 0
    @test max_dd <= 1
end

# Test swarm optimization
@testset "Swarm Optimization" begin
    swarm = JuliaOS.SwarmManager.create_swarm(test_config)
    
    # Start optimization
    @test !swarm.is_running
    JuliaOS.SwarmManager.start_swarm!(swarm)
    @test swarm.is_running
    
    # Run for a few iterations
    for i in 1:5
        # Update market data
        for pair in swarm.config.trading_pairs
            data = JuliaOS.MarketData.fetch_market_data("uniswap", pair)
            if data !== nothing
                push!(swarm.market_data[pair], data)
                if length(swarm.market_data[pair]) > 100
                    popfirst!(swarm.market_data[pair])
                end
            end
        end
        
        # Update particles
        for particle in swarm.particles
            JuliaOS.SwarmManager.update_velocity!(particle, swarm)
            JuliaOS.SwarmManager.update_position!(particle)
            fitness = JuliaOS.SwarmManager.calculate_fitness(particle, swarm.market_data)
            
            if fitness < particle.best_fitness
                particle.best_position = copy(particle.position)
                particle.best_fitness = fitness
                
                if fitness < swarm.global_best_fitness
                    swarm.global_best_position = copy(particle.position)
                    swarm.global_best_fitness = fitness
                end
            end
        end
        
        JuliaOS.SwarmManager.update_performance_metrics!(swarm)
    end
    
    # Stop optimization
    JuliaOS.SwarmManager.stop_swarm!(swarm)
    @test !swarm.is_running
    
    # Verify performance metrics
    @test haskey(swarm.performance_metrics, "total_return")
    @test haskey(swarm.performance_metrics, "sharpe_ratio")
    @test haskey(swarm.performance_metrics, "max_drawdown")
    @test haskey(swarm.performance_metrics, "win_rate")
end

# Test swarm state persistence
@testset "Swarm State Persistence" begin
    swarm = JuliaOS.SwarmManager.create_swarm(test_config)
    
    # Save state
    JuliaOS.SwarmManager.save_swarm(swarm, "test_swarm.json")
    @test isfile("test_swarm.json")
    
    # Load state
    loaded_swarm = JuliaOS.SwarmManager.load_swarm("test_swarm.json")
    @test loaded_swarm.config.name == swarm.config.name
    @test loaded_swarm.config.size == swarm.config.size
    @test loaded_swarm.config.algorithm == swarm.config.algorithm
    
    # Clean up
    rm("test_swarm.json")
    @test !isfile("test_swarm.json")
end 