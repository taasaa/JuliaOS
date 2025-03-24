# Swarm management functionality for JuliaBridge

using Random
using Statistics
using JSON
using Dates

export SwarmConfig, Particle, Swarm, create_swarm, start_swarm!, stop_swarm!, save_swarm, load_swarm, generate_signals, execute_trade, calculate_fitness, update_velocity!, update_position!, calculate_sharpe_ratio, calculate_max_drawdown, update_performance_metrics!

struct SwarmConfig
    name::String
    size::Int
    algorithm::String
    trading_pairs::Vector{String}
    parameters::Dict{String, Float64}
end

struct Particle
    position::Vector{Float64}  # Trading parameters
    velocity::Vector{Float64}
    best_position::Vector{Float64}
    best_fitness::Float64
    portfolio::Dict{String, Float64}
    trades::Vector{Dict{String, Any}}
end

struct Swarm
    config::SwarmConfig
    particles::Vector{Particle}
    global_best_position::Vector{Float64}
    global_best_fitness::Float64
    iteration::Int
    is_running::Bool
    market_data::Dict{String, Vector{MarketDataPoint}}
    performance_metrics::Dict{String, Float64}
end

function create_swarm(config::SwarmConfig)
    particles = Vector{Particle}()
    
    # Initialize particles with random positions and velocities
    for _ in 1:config.size
        # Position: [entry_threshold, exit_threshold, stop_loss, take_profit]
        position = rand(4)
        velocity = rand(4) .* 0.1  # Initial velocity
        
        # Initialize portfolio with USDC
        portfolio = Dict("USDC" => 10000.0)
        
        push!(particles, Particle(
            position,
            velocity,
            copy(position),
            Inf,
            portfolio,
            Vector{Dict{String, Any}}()
        ))
    end
    
    # Initialize market data storage
    market_data = Dict(pair => Vector{MarketDataPoint}() for pair in config.trading_pairs)
    
    # Initialize performance metrics
    performance_metrics = Dict(
        "total_return" => 0.0,
        "sharpe_ratio" => 0.0,
        "max_drawdown" => 0.0,
        "win_rate" => 0.0
    )
    
    return Swarm(
        config,
        particles,
        zeros(4),  # Initial global best position
        Inf,       # Initial global best fitness
        0,         # Initial iteration
        false,     # Not running initially
        market_data,
        performance_metrics
    )
end

function update_velocity!(particle::Particle, swarm::Swarm)
    inertia = get(swarm.config.parameters, "inertia", 0.8)
    cognitive_weight = get(swarm.config.parameters, "cognitiveWeight", 1.5)
    social_weight = get(swarm.config.parameters, "socialWeight", 1.5)
    
    # Update velocity using PSO formula
    for i in 1:length(particle.velocity)
        r1, r2 = rand(), rand()
        cognitive_velocity = cognitive_weight * r1 * (particle.best_position[i] - particle.position[i])
        social_velocity = social_weight * r2 * (swarm.global_best_position[i] - particle.position[i])
        
        particle.velocity[i] = inertia * particle.velocity[i] + cognitive_velocity + social_velocity
    end
end

function update_position!(particle::Particle)
    # Update position
    particle.position .+= particle.velocity
    
    # Ensure parameters stay within valid ranges
    particle.position[1] = clamp(particle.position[1], 0.0, 1.0)  # Entry threshold
    particle.position[2] = clamp(particle.position[2], 0.0, 1.0)  # Exit threshold
    particle.position[3] = max(0.0, particle.position[3])        # Stop loss
    particle.position[4] = max(0.0, particle.position[4])        # Take profit
end

function calculate_fitness(particle::Particle, market_data::Dict{String, Vector{MarketDataPoint}})
    # Calculate returns based on trading history
    returns = Float64[]
    for trade in particle.trades
        if haskey(trade, "return")
            push!(returns, trade["return"])
        end
    end
    
    if isempty(returns)
        return Inf
    end
    
    # Calculate Sharpe ratio (assuming risk-free rate of 0)
    sharpe = calculate_sharpe_ratio(returns)
    
    # Calculate maximum drawdown
    max_dd = calculate_max_drawdown(returns)
    
    # Combined fitness score (lower is better)
    return -sharpe + max_dd
end

function generate_signals(params::Vector{Float64}, market_data::Vector{MarketDataPoint})
    signals = Vector{Dict{String, Any}}()
    
    if length(market_data) < 2
        return signals
    end
    
    # Extract parameters
    entry_threshold = params[1]  # Normalized threshold for entry (0-1)
    exit_threshold = params[2]   # Normalized threshold for exit (0-1)
    stop_loss = params[3]        # Percentage for stop loss
    take_profit = params[4]      # Percentage for take profit
    
    current_price = market_data[end].price
    prices = [d.price for d in market_data]
    volumes = [d.volume for d in market_data]
    indicators = MarketData.calculate_indicators(prices, volumes)
    
    # Calculate normalized price position within Bollinger Bands
    bb_position = (current_price - indicators["bb_lower"]) / (indicators["bb_upper"] - indicators["bb_lower"])
    
    # Generate buy signal
    if bb_position < entry_threshold || indicators["rsi"] < 30
        push!(signals, Dict(
            "action" => "buy",
            "price" => current_price,
            "amount" => 1.0,
            "stop_loss" => current_price * (1 - stop_loss/100),
            "take_profit" => current_price * (1 + take_profit/100),
            "indicators" => indicators,
            "pair" => "ETH/USDC"  # Add trading pair
        ))
    end
    
    # Generate sell signal
    if bb_position > exit_threshold || indicators["rsi"] > 70
        push!(signals, Dict(
            "action" => "sell",
            "price" => current_price,
            "amount" => 1.0,
            "stop_loss" => current_price * (1 + stop_loss/100),
            "take_profit" => current_price * (1 - take_profit/100),
            "indicators" => indicators,
            "pair" => "ETH/USDC"  # Add trading pair
        ))
    end
    
    return signals
end

function execute_trade(particle::Particle, signal::Dict{String, Any}, market_data::MarketDataPoint)
    result = Dict{String, Any}("success" => false)
    
    try
        if signal["action"] == "buy"
            # Check if we have enough USDC
            cost = signal["price"] * signal["amount"]
            if particle.portfolio["USDC"] >= cost
                # Execute buy
                particle.portfolio["USDC"] -= cost
                if !haskey(particle.portfolio, signal["pair"])
                    particle.portfolio[signal["pair"]] = 0.0
                end
                particle.portfolio[signal["pair"]] += signal["amount"]
                
                # Record trade
                push!(particle.trades, Dict(
                    "action" => "buy",
                    "price" => signal["price"],
                    "amount" => signal["amount"],
                    "timestamp" => market_data.timestamp,
                    "stop_loss" => signal["stop_loss"],
                    "take_profit" => signal["take_profit"]
                ))
                
                result["success"] = true
            end
        elseif signal["action"] == "sell"
            # Check if we have enough tokens
            if haskey(particle.portfolio, signal["pair"]) && 
               particle.portfolio[signal["pair"]] >= signal["amount"]
                # Execute sell
                revenue = signal["price"] * signal["amount"]
                particle.portfolio["USDC"] += revenue
                particle.portfolio[signal["pair"]] -= signal["amount"]
                
                # Calculate return
                last_buy = nothing
                for trade in reverse(particle.trades)
                    if trade["action"] == "buy" && trade["pair"] == signal["pair"]
                        last_buy = trade
                        break
                    end
                end
                
                if last_buy !== nothing
                    trade_return = (signal["price"] - last_buy["price"]) / last_buy["price"]
                    push!(particle.trades, Dict(
                        "action" => "sell",
                        "price" => signal["price"],
                        "amount" => signal["amount"],
                        "timestamp" => market_data.timestamp,
                        "return" => trade_return,
                        "stop_loss" => signal["stop_loss"],
                        "take_profit" => signal["take_profit"]
                    ))
                end
                
                result["success"] = true
            end
        end
    catch e
        @warn "Error executing trade: $e"
    end
    
    return result
end

function calculate_sharpe_ratio(returns::Vector{Float64})
    if length(returns) < 2
        return 0.0
    end
    
    # Assuming daily returns and risk-free rate of 0
    excess_returns = returns
    return mean(excess_returns) / std(excess_returns)
end

function calculate_max_drawdown(returns::Vector{Float64})
    if isempty(returns)
        return 0.0
    end
    
    cumulative = cumsum(returns)
    running_max = maximum(cumulative)
    drawdowns = (running_max - cumulative) / running_max
    
    return maximum(drawdowns)
end

function update_performance_metrics!(swarm::Swarm)
    all_returns = Float64[]
    for particle in swarm.particles
        for trade in particle.trades
            if haskey(trade, "return")
                push!(all_returns, trade["return"])
            end
        end
    end
    
    if !isempty(all_returns)
        swarm.performance_metrics["total_return"] = sum(all_returns)
        swarm.performance_metrics["sharpe_ratio"] = calculate_sharpe_ratio(all_returns)
        swarm.performance_metrics["max_drawdown"] = calculate_max_drawdown(all_returns)
        swarm.performance_metrics["win_rate"] = count(r -> r > 0, all_returns) / length(all_returns)
    end
end

function start_swarm!(swarm::Swarm)
    if swarm.is_running
        @warn "Swarm is already running"
        return
    end
    
    swarm.is_running = true
    max_iterations = get(swarm.config.parameters, "maxIterations", 100)
    
    while swarm.is_running && swarm.iteration < max_iterations
        # Update market data
        for pair in swarm.config.trading_pairs
            data = MarketData.fetch_market_data("uniswap", pair)
            if data !== nothing
                push!(swarm.market_data[pair], data)
                if length(swarm.market_data[pair]) > 100
                    popfirst!(swarm.market_data[pair])
                end
            end
        end
        
        # Update particles
        for particle in swarm.particles
            update_velocity!(particle, swarm)
            update_position!(particle)
            
            # Generate and execute trades
            for pair in swarm.config.trading_pairs
                if haskey(swarm.market_data, pair) && !isempty(swarm.market_data[pair])
                    signals = generate_signals(particle.position, swarm.market_data[pair])
                    for signal in signals
                        execute_trade(particle, signal, swarm.market_data[pair][end])
                    end
                end
            end
            
            # Update particle fitness
            fitness = calculate_fitness(particle, swarm.market_data)
            if fitness < particle.best_fitness
                particle.best_position = copy(particle.position)
                particle.best_fitness = fitness
                
                if fitness < swarm.global_best_fitness
                    swarm.global_best_position = copy(particle.position)
                    swarm.global_best_fitness = fitness
                end
            end
        end
        
        update_performance_metrics!(swarm)
        swarm.iteration += 1
        
        # Log progress
        if swarm.iteration % 10 == 0
            @info "Iteration $(swarm.iteration), Best Fitness: $(swarm.global_best_fitness)"
        end
    end
end

function stop_swarm!(swarm::Swarm)
    swarm.is_running = false
end

function save_swarm(swarm::Swarm, filename::String)
    data = Dict(
        "config" => Dict(
            "name" => swarm.config.name,
            "size" => swarm.config.size,
            "algorithm" => swarm.config.algorithm,
            "trading_pairs" => swarm.config.trading_pairs,
            "parameters" => swarm.config.parameters
        ),
        "global_best_position" => swarm.global_best_position,
        "global_best_fitness" => swarm.global_best_fitness,
        "iteration" => swarm.iteration,
        "performance_metrics" => swarm.performance_metrics
    )
    
    open(filename, "w") do f
        JSON.print(f, data)
    end
end

function load_swarm(filename::String)
    data = JSON.parsefile(filename)
    
    config = SwarmConfig(
        data["config"]["name"],
        data["config"]["size"],
        data["config"]["algorithm"],
        data["config"]["trading_pairs"],
        data["config"]["parameters"]
    )
    
    swarm = create_swarm(config)
    swarm.global_best_position = data["global_best_position"]
    swarm.global_best_fitness = data["global_best_fitness"]
    swarm.iteration = data["iteration"]
    swarm.performance_metrics = data["performance_metrics"]
    
    return swarm
end 