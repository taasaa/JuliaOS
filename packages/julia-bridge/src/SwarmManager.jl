module SwarmManager

using Random
using Statistics
using JSON
using Dates
using DataFrames
using Distributions
using LinearAlgebra
using Logging

export SwarmConfig, Particle, Swarm
export initialize, create_swarm, start_swarm!, stop_swarm!, get_swarm, get_status
export save_swarm, load_swarm, optimize
export generate_signals, calculate_fitness, execute_trade
export update_velocity!, update_position!, calculate_sharpe_ratio
export calculate_max_drawdown, update_performance_metrics!

# Global registry of active swarms with lock for thread safety
const SWARMS = Dict{String, Any}()
const SWARMS_LOCK = ReentrantLock()

# Performance metrics and stats
const SWARM_STATS = Dict(
    "total_created" => 0,
    "total_optimizations" => 0,
    "optimization_times" => Float64[],
    "active_swarms" => 0,
    "errors" => Dict{String, Int}()
)

# Constants for optimization
const MAX_PARTICLES = 1000
const MAX_DIMENSIONS = 100
const MAX_ITERATIONS = 1000

"""
    SwarmConfig

Configuration for a swarm.
"""
struct SwarmConfig
    id::String
    name::String
    size::Int
    algorithm::Symbol
    parameters::Dict{String, Any}
    
    function SwarmConfig(id::String, name::String, size::Int, algorithm::Symbol, parameters::Dict=Dict())
        # Validate and set defaults
        if size < 1
            @warn "Invalid swarm size $size, using default of 10"
            size = 10
        elseif size > MAX_PARTICLES
            @warn "Swarm size $size exceeds maximum of $MAX_PARTICLES, capping"
            size = MAX_PARTICLES
        end
        
        if !in(algorithm, [:pso, :aco, :abc, :firefly])
            @warn "Unknown algorithm $algorithm, using default PSO"
            algorithm = :pso
        end
        
        # Set default parameters if not provided
        default_params = Dict(
            "maxPositionSize" => 1.0,
            "stopLoss" => 0.05,
            "takeProfit" => 0.1,
            "maxDrawdown" => 0.2,
            "inertia" => 0.7,
            "cognitiveWeight" => 1.5,
            "socialWeight" => 1.5,
            "maxIterations" => 100
        )
        
        for (key, value) in default_params
            if !haskey(parameters, key)
                parameters[key] = value
            end
        end
        
        # Validate parameter values
        if haskey(parameters, "maxIterations") && parameters["maxIterations"] > MAX_ITERATIONS
            @warn "maxIterations $(parameters["maxIterations"]) exceeds maximum of $MAX_ITERATIONS, capping"
            parameters["maxIterations"] = MAX_ITERATIONS
        end
        
        new(id, name, size, algorithm, parameters)
    end
end

"""
    Particle

A particle in a Particle Swarm Optimization (PSO) algorithm.
"""
mutable struct Particle
    id::String
    position::Vector{Float64}
    velocity::Vector{Float64}
    best_position::Vector{Float64}
    best_fitness::Float64
    current_fitness::Float64
    
    function Particle(id::String, dimensions::Int)
        if dimensions > MAX_DIMENSIONS
            @warn "Dimensions $dimensions exceeds maximum of $MAX_DIMENSIONS, capping"
            dimensions = MAX_DIMENSIONS
        end
        
        # Initialize with random position and velocity
        position = rand(dimensions)
        velocity = randn(dimensions) * 0.1
        
        new(id, position, velocity, copy(position), -Inf, -Inf)
    end
end

"""
    Swarm

A swarm of particles for optimization.
"""
mutable struct Swarm
    id::String
    name::String
    config::SwarmConfig
    particles::Vector{Particle}
    dimensions::Int
    global_best_position::Vector{Float64}
    global_best_fitness::Float64
    iteration::Int
    is_running::Bool
    last_updated::Float64
    metrics::Dict{String, Any}
    
    function Swarm(config::SwarmConfig, dimensions::Int=10)
        if dimensions > MAX_DIMENSIONS
            @warn "Dimensions $dimensions exceeds maximum of $MAX_DIMENSIONS, capping"
            dimensions = MAX_DIMENSIONS
        end
        
        particles = [Particle(string(i), dimensions) for i in 1:config.size]
        
        metrics = Dict{String, Any}(
            "created_at" => now(),
            "optimization_count" => 0,
            "last_optimization_duration" => 0.0,
            "avg_optimization_duration" => 0.0,
            "optimization_durations" => Float64[],
            "convergence_iterations" => Int[]
        )
        
        new(
            config.id,
            config.name,
            config,
            particles,
            dimensions,
            zeros(dimensions),
            -Inf,
            0,
            false,
            time(),
            metrics
        )
    end
end

"""
    initialize()

Initialize the SwarmManager module.
"""
function initialize()
    # Clear any existing swarms
    lock(SWARMS_LOCK) do
        empty!(SWARMS)
    end
    
    # Reset statistics
    SWARM_STATS["total_created"] = 0
    SWARM_STATS["total_optimizations"] = 0
    SWARM_STATS["optimization_times"] = Float64[]
    SWARM_STATS["active_swarms"] = 0
    SWARM_STATS["errors"] = Dict{String, Int}()
    
    @info "SwarmManager initialized"
    return true
end

"""
    create_swarm(config::SwarmConfig, dimensions::Int=10)

Create a new swarm with the given configuration.
"""
function create_swarm(config::SwarmConfig, dimensions::Int=10)
    try
        # Create swarm
        swarm = Swarm(config, dimensions)
        
        # Register swarm with lock for thread safety
        lock(SWARMS_LOCK) do
            SWARMS[swarm.id] = swarm
            SWARM_STATS["total_created"] += 1
            SWARM_STATS["active_swarms"] += 1
        end
        
        @info "Created swarm: $(swarm.id) ($(swarm.name))"
        return swarm
    catch e
        error_type = string(typeof(e))
        
        # Track error
        if haskey(SWARM_STATS["errors"], error_type)
            SWARM_STATS["errors"][error_type] += 1
        else
            SWARM_STATS["errors"][error_type] = 1
        end
        
        @error "Error creating swarm" exception=(e, catch_backtrace())
        rethrow(e)
    end
end

"""
    start_swarm!(swarm::Swarm)

Start a swarm optimization process.
"""
function start_swarm!(swarm::Swarm)
    if swarm.is_running
        @info "Swarm $(swarm.id) is already running"
        return false
    end
    
    swarm.is_running = true
    swarm.last_updated = time()
    
    @info "Started swarm: $(swarm.id)"
    return true
end

"""
    stop_swarm!(swarm::Swarm)

Stop a running swarm.
"""
function stop_swarm!(swarm::Swarm)
    if !swarm.is_running
        @info "Swarm $(swarm.id) is not running"
        return false
    end
    
    swarm.is_running = false
    
    @info "Stopped swarm: $(swarm.id)"
    return true
end

"""
    get_swarm(id::String)

Get a swarm by ID with thread safety.
"""
function get_swarm(id::String)
    lock(SWARMS_LOCK) do
        return get(SWARMS, id, nothing)
    end
end

"""
    get_status(swarm::Swarm)

Get the status of a swarm including metrics.
"""
function get_status(swarm::Swarm)
    uptime = 0.0
    if haskey(swarm.metrics, "created_at")
        uptime = Dates.value(convert(Dates.Second, now() - swarm.metrics["created_at"]))
    end
    
    # Calculate average optimization duration if available
    avg_duration = 0.0
    if length(swarm.metrics["optimization_durations"]) > 0
        avg_duration = mean(swarm.metrics["optimization_durations"])
    end
    
    return Dict(
        "id" => swarm.id,
        "name" => swarm.name,
        "size" => length(swarm.particles),
        "algorithm" => string(swarm.config.algorithm),
        "isRunning" => swarm.is_running,
        "iteration" => swarm.iteration,
        "bestFitness" => swarm.global_best_fitness,
        "lastUpdated" => swarm.last_updated,
        "metrics" => Dict(
            "createdAt" => string(swarm.metrics["created_at"]),
            "uptime" => uptime,
            "optimizationCount" => swarm.metrics["optimization_count"],
            "lastOptimizationDuration" => swarm.metrics["last_optimization_duration"],
            "avgOptimizationDuration" => avg_duration
        )
    )
end

"""
    save_swarm(swarm::Swarm, filename::String)

Save a swarm to a file.
"""
function save_swarm(swarm::Swarm, filename::String)
    try
        # Create a serializable version of the swarm
        data = Dict(
            "id" => swarm.id,
            "name" => swarm.name,
            "config" => Dict(
                "size" => swarm.config.size,
                "algorithm" => string(swarm.config.algorithm),
                "parameters" => swarm.config.parameters
            ),
            "dimensions" => swarm.dimensions,
            "globalBestPosition" => swarm.global_best_position,
            "globalBestFitness" => swarm.global_best_fitness,
            "iteration" => swarm.iteration,
            "isRunning" => swarm.is_running,
            "lastUpdated" => swarm.last_updated,
            "metrics" => Dict(
                "createdAt" => string(swarm.metrics["created_at"]),
                "optimizationCount" => swarm.metrics["optimization_count"],
                "lastOptimizationDuration" => swarm.metrics["last_optimization_duration"],
                "optimizationDurations" => swarm.metrics["optimization_durations"],
                "convergenceIterations" => swarm.metrics["convergence_iterations"]
            )
        )
        
        # Save to file with better error handling
        try
            open(filename, "w") do io
                JSON.print(io, data)
            end
        catch e
            @error "Error writing to file $filename" exception=(e, catch_backtrace())
            
            # Try to save to a backup location
            backup_file = filename * ".backup"
            @warn "Attempting to save to backup file $backup_file"
            
            open(backup_file, "w") do io
                JSON.print(io, data)
            end
        end
        
        @info "Saved swarm $(swarm.id) to $filename"
        return true
    catch e
        @error "Error saving swarm to file" exception=(e, catch_backtrace())
        return false
    end
end

"""
    load_swarm(filename::String)

Load a swarm from a file.
"""
function load_swarm(filename::String)
    try
        # Load from file
        data = JSON.parsefile(filename)
        
        # Create config
        config = SwarmConfig(
            data["id"],
            data["name"],
            data["config"]["size"],
            Symbol(data["config"]["algorithm"]),
            data["config"]["parameters"]
        )
        
        # Create swarm
        swarm = create_swarm(config, data["dimensions"])
        
        # Set swarm properties
        swarm.global_best_position = data["globalBestPosition"]
        swarm.global_best_fitness = data["globalBestFitness"]
        swarm.iteration = data["iteration"]
        swarm.is_running = data["isRunning"]
        swarm.last_updated = data["lastUpdated"]
        
        # Load metrics if available
        if haskey(data, "metrics")
            metrics = data["metrics"]
            
            if haskey(metrics, "createdAt")
                swarm.metrics["created_at"] = DateTime(metrics["createdAt"])
            end
            
            if haskey(metrics, "optimizationCount")
                swarm.metrics["optimization_count"] = metrics["optimizationCount"]
            end
            
            if haskey(metrics, "lastOptimizationDuration")
                swarm.metrics["last_optimization_duration"] = metrics["lastOptimizationDuration"]
            end
            
            if haskey(metrics, "optimizationDurations")
                swarm.metrics["optimization_durations"] = metrics["optimizationDurations"]
            end
            
            if haskey(metrics, "convergenceIterations")
                swarm.metrics["convergence_iterations"] = metrics["convergenceIterations"]
            end
        end
        
        @info "Loaded swarm $(swarm.id) from $filename"
        return swarm
    catch e
        @error "Error loading swarm from file $filename" exception=(e, catch_backtrace())
        rethrow(e)
    end
end

"""
    update_velocity!(particle::Particle, global_best_position::Vector{Float64}, inertia::Float64, cognitive_weight::Float64, social_weight::Float64)

Update the velocity of a particle in PSO.
"""
function update_velocity!(particle::Particle, global_best_position::Vector{Float64}, inertia::Float64, cognitive_weight::Float64, social_weight::Float64)
    # Standard PSO velocity update equation
    cognitive = cognitive_weight * rand() * (particle.best_position - particle.position)
    social = social_weight * rand() * (global_best_position - particle.position)
    
    particle.velocity = inertia * particle.velocity + cognitive + social
    
    # Limit velocity to avoid exploding
    max_velocity = 0.5
    particle.velocity = clamp.(particle.velocity, -max_velocity, max_velocity)
    
    return particle.velocity
end

"""
    update_position!(particle::Particle)

Update the position of a particle in PSO.
"""
function update_position!(particle::Particle)
    particle.position += particle.velocity
    
    # Clamp position to [0, 1]
    particle.position = clamp.(particle.position, 0.0, 1.0)
    
    return particle.position
end

"""
    calculate_fitness(position::Vector{Float64}, market_data::DataFrame, trading_pairs::Vector{String}, risk_parameters::Dict)

Calculate the fitness (performance) of a position.
"""
function calculate_fitness(position::Vector{Float64}, market_data::DataFrame, trading_pairs::Vector{String}, risk_parameters::Dict)
    # This is a simplified fitness function
    # In reality, this would be much more complex and would simulate trading
    
    # Early return for empty market data
    if isempty(market_data) || nrow(market_data) < 2
        @warn "Insufficient market data for fitness calculation"
        return -Inf
    end
    
    # Validate trading pairs
    if isempty(trading_pairs)
        @warn "No trading pairs provided for fitness calculation"
        return -Inf
    end
    
    # Convert position to trading signals and weights
    n_assets = length(trading_pairs)
    
    # Handle dimension mismatch
    if length(position) < n_assets
        @warn "Position vector length ($(length(position))) is less than number of trading pairs ($n_assets)"
        # Pad with zeros
        asset_weights = vcat(position, zeros(n_assets - length(position)))
    else
        asset_weights = position[1:n_assets]
    end
    
    # Normalize weights to sum to 1
    if sum(asset_weights) > 0
        asset_weights = asset_weights / sum(asset_weights)
    else
        # All zero weights - return poor fitness
        return -0.1
    end
    
    # Calculate returns based on position
    returns = Vector{Float64}()
    
    # Loop through each time step with error handling
    try
        for i in 2:nrow(market_data)
            # Calculate weighted return across assets
            daily_return = 0.0
            
            for (j, pair) in enumerate(trading_pairs)
                # Get price change
                if haskey(market_data[i], Symbol(pair)) && 
                   haskey(market_data[i-1], Symbol(pair)) && 
                   !isnan(market_data[i, Symbol(pair)]) && 
                   !isnan(market_data[i-1, Symbol(pair)]) && 
                   market_data[i-1, Symbol(pair)] > 0
                    
                    price_change = market_data[i, Symbol(pair)] / market_data[i-1, Symbol(pair)] - 1
                    daily_return += asset_weights[j] * price_change
                end
            end
            
            push!(returns, daily_return)
        end
    catch e
        @error "Error calculating returns" exception=(e, catch_backtrace())
        return -Inf
    end
    
    # Convert to array
    returns = Float64.(returns)
    
    # Calculate performance metrics
    if length(returns) > 0
        # Calculate Sharpe ratio
        sharpe = calculate_sharpe_ratio(returns)
        
        # Calculate maximum drawdown
        drawdown = calculate_max_drawdown(returns)
        
        # Calculate total return
        total_return = prod(1 .+ returns) - 1
        
        # Penalize for exceeding maximum drawdown
        max_allowed_drawdown = get(risk_parameters, "maxDrawdown", 0.2)
        if drawdown > max_allowed_drawdown
            # Severe penalty for exceeding maximum drawdown
            total_return *= (1.0 - (drawdown - max_allowed_drawdown) * 5)
        end
        
        # Fitness is a combination of Sharpe ratio and total return
        # Weight can be adjusted based on risk preference
        sharpe_weight = get(risk_parameters, "sharpeWeight", 0.3)
        return_weight = 1.0 - sharpe_weight
        
        fitness = sharpe_weight * sharpe + return_weight * total_return
        
        return fitness
    else
        return -Inf
    end
end

"""
    calculate_sharpe_ratio(returns::Vector{Float64}, risk_free_rate::Float64=0.0)

Calculate the Sharpe ratio of a series of returns.
"""
function calculate_sharpe_ratio(returns::Vector{Float64}, risk_free_rate::Float64=0.0)
    if length(returns) < 2 || all(returns .== 0)
        return 0.0
    end
    
    # Annualize assuming daily returns (252 trading days)
    trading_days_per_year = 252
    
    mean_return = mean(returns) * trading_days_per_year
    std_return = std(returns) * sqrt(trading_days_per_year)
    
    if std_return == 0
        return 0.0
    end
    
    return (mean_return - risk_free_rate) / std_return
end

"""
    calculate_max_drawdown(returns::Vector{Float64})

Calculate the maximum drawdown of a series of returns.
"""
function calculate_max_drawdown(returns::Vector{Float64})
    if length(returns) < 2
        return 0.0
    end
    
    # Calculate cumulative returns
    cum_returns = cumprod(1 .+ returns)
    
    # Calculate drawdowns
    max_so_far = cum_returns[1]
    drawdowns = zeros(length(cum_returns))
    
    for i in 2:length(cum_returns)
        max_so_far = max(max_so_far, cum_returns[i])
        drawdowns[i] = (max_so_far - cum_returns[i]) / max_so_far
    end
    
    return maximum(drawdowns)
end

"""
    optimize(swarm::Swarm, market_data::DataFrame, trading_pairs::Vector{String}, risk_parameters::Dict, max_iterations::Int=100)

Run optimization on a swarm and generate trading signals.
"""
function optimize(swarm::Swarm, market_data::DataFrame, trading_pairs::Vector{String}, risk_parameters::Dict, max_iterations::Int=100)
    # Start timer for performance tracking
    start_time = time()
    
    if !swarm.is_running
        start_swarm!(swarm)
    end
    
    # Update swarm metrics
    swarm.metrics["optimization_count"] += 1
    SWARM_STATS["total_optimizations"] += 1
    
    # Get parameters from swarm config
    params = swarm.config.parameters
    inertia = get(params, "inertia", 0.7)
    cognitive_weight = get(params, "cognitiveWeight", 1.5)
    social_weight = get(params, "socialWeight", 1.5)
    
    # Limit iterations to config value or maximum
    max_iterations = min(
        get(params, "maxIterations", max_iterations),
        MAX_ITERATIONS
    )
    
    # Set up convergence tracking
    convergence_threshold = get(params, "convergenceThreshold", 1e-5)
    early_stopping_count = get(params, "earlyStoppingCount", 5)
    convergence_count = 0
    prev_best_fitness = swarm.global_best_fitness
    
    # Run optimization for max_iterations or until convergence
    for iter in 1:max_iterations
        swarm.iteration += 1
        
        # Calculate fitness for all particles in parallel if possible
        # This uses threading for performance if available
        Threads.@threads for i in 1:length(swarm.particles)
            particle = swarm.particles[i]
            # Calculate fitness for current position
            particle.current_fitness = calculate_fitness(
                particle.position, 
                market_data, 
                trading_pairs,
                risk_parameters
            )
            
            # Update personal best
            if particle.current_fitness > particle.best_fitness
                particle.best_fitness = particle.current_fitness
                particle.best_position = copy(particle.position)
                
                # Update global best with thread safety
                lock(SWARMS_LOCK) do
                    if particle.best_fitness > swarm.global_best_fitness
                        swarm.global_best_fitness = particle.best_fitness
                        swarm.global_best_position = copy(particle.best_position)
                    end
                end
            end
        end
        
        # Update all particles
        for particle in swarm.particles
            # Update velocity and position
            update_velocity!(particle, swarm.global_best_position, inertia, cognitive_weight, social_weight)
            update_position!(particle)
        end
        
        # Check for convergence
        if iter > 10
            # Calculate variance of fitness values
            fitness_values = [p.current_fitness for p in swarm.particles]
            fitness_variance = var(fitness_values)
            
            # Check if best fitness hasn't improved
            if abs(swarm.global_best_fitness - prev_best_fitness) < convergence_threshold
                convergence_count += 1
            else
                convergence_count = 0
                prev_best_fitness = swarm.global_best_fitness
            end
            
            # Early stopping if fitness variance is small or no improvement for several iterations
            if fitness_variance < convergence_threshold || convergence_count >= early_stopping_count
                @info "Swarm $(swarm.id) converged after $iter iterations"
                
                # Track convergence iteration for metrics
                push!(swarm.metrics["convergence_iterations"], iter)
                
                break
            end
        end
    end
    
    # Generate trading signals based on best position
    signals = generate_signals(swarm.global_best_position, trading_pairs, risk_parameters)
    
    # Update timestamp
    swarm.last_updated = time()
    
    # Update metrics
    elapsed_time = time() - start_time
    swarm.metrics["last_optimization_duration"] = elapsed_time
    push!(swarm.metrics["optimization_durations"], elapsed_time)
    push!(SWARM_STATS["optimization_times"], elapsed_time)
    
    @info "Optimization completed for swarm $(swarm.id) in $(round(elapsed_time, digits=3)) seconds"
    
    return signals
end

"""
    generate_signals(position::Vector{Float64}, trading_pairs::Vector{String}, risk_parameters::Dict)

Generate trading signals from an optimized position.
"""
function generate_signals(position::Vector{Float64}, trading_pairs::Vector{String}, risk_parameters::Dict)
    # Convert position to trading signals
    n_assets = length(trading_pairs)
    
    # Handle dimension mismatch
    if length(position) < n_assets
        @warn "Position vector length ($(length(position))) is less than number of trading pairs ($n_assets)"
        # Pad with zeros
        asset_weights = vcat(position, zeros(n_assets - length(position)))
    else
        asset_weights = position[1:n_assets]
    end
    
    # Normalize weights
    if sum(asset_weights) > 0
        asset_weights = asset_weights / sum(asset_weights)
    end
    
    # Generate signals for each trading pair
    signals = Dict{String, Dict{String, Any}}()
    
    for (i, pair) in enumerate(trading_pairs)
        weight = asset_weights[i]
        
        # Determine action based on weight
        action = weight > 0.1 ? "buy" : (weight < 0.05 ? "sell" : "hold")
        
        # Calculate amount based on maximum position size
        max_position = get(risk_parameters, "maxPositionSize", 1.0)
        amount = weight * max_position
        
        # Calculate confidence based on weight and global metrics
        confidence = min(weight * 2, 0.99)
        
        # Determine risk parameters
        stop_loss = get(risk_parameters, "stopLoss", 0.05)
        take_profit = get(risk_parameters, "takeProfit", 0.1)
        
        # Create signal
        signals[pair] = Dict(
            "action" => action,
            "amount" => amount,
            "confidence" => confidence,
            "timestamp" => string(Dates.now()),
            "stopLoss" => stop_loss,
            "takeProfit" => take_profit,
            "reasoning" => "Optimized by swarm algorithm with confidence $(round(Int, confidence * 100))%"
        )
    end
    
    return signals
end

"""
    execute_trade(signal::Dict{String, Any}, market_data::Any)

Execute a trade based on a signal.
"""
function execute_trade(signal::Dict{String, Any}, market_data::Any)
    # In a production environment, this would connect to an exchange API
    # and execute the actual trade
    
    # For now, we just log the trade
    @info "Executing trade: $(signal["action"]) $(signal["amount"]) $(get(signal, "pair", "unknown")) at $(now())"
    
    # Return simulated trade result
    return Dict(
        "success" => true,
        "txId" => string(UUIDs.uuid4()),
        "timestamp" => string(now()),
        "action" => signal["action"],
        "amount" => signal["amount"],
        "price" => market_data isa Dict ? get(market_data, "price", 0.0) : 0.0,
        "fee" => 0.001 * signal["amount"] * (market_data isa Dict ? get(market_data, "price", 0.0) : 0.0)
    )
end

"""
    update_performance_metrics!(swarm::Swarm, market_data::DataFrame)

Update performance metrics for a swarm based on recent market data.
"""
function update_performance_metrics!(swarm::Swarm, market_data::DataFrame)
    # This would update various performance metrics of the swarm
    # For now, we'll just update the timestamp
    swarm.last_updated = time()
    
    return true
end

"""
    get_stats()

Get statistics about the SwarmManager.
"""
function get_stats()
    stats = Dict(
        "active_swarms" => SWARM_STATS["active_swarms"],
        "total_created" => SWARM_STATS["total_created"],
        "total_optimizations" => SWARM_STATS["total_optimizations"]
    )
    
    # Calculate average optimization time if available
    if !isempty(SWARM_STATS["optimization_times"])
        stats["avg_optimization_time"] = mean(SWARM_STATS["optimization_times"])
        stats["max_optimization_time"] = maximum(SWARM_STATS["optimization_times"])
        stats["min_optimization_time"] = minimum(SWARM_STATS["optimization_times"])
    end
    
    # Include error counts
    stats["errors"] = SWARM_STATS["errors"]
    
    return stats
end

# Module initialization
function __init__()
    # Initialize locks and other resources
    @info "SwarmManager module loaded"
end

end # module