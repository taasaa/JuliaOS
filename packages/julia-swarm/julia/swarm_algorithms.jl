module SwarmAlgorithms

using Random
using LinearAlgebra
using Statistics

export SwarmAlgorithm, SwarmConfig
export ParticleSwarmOptimization, AntColonyOptimization, ArtificialBeeColony, FireflyAlgorithm
export initialize!, update!, evaluate_fitness!, get_best_position, get_best_fitness
export create_algorithm

# ====================== Abstract Types ======================
"""
    SwarmAlgorithm

Abstract type for all swarm intelligence algorithms.
"""
abstract type SwarmAlgorithm end

"""
    SwarmConfig

Configuration parameters for swarm algorithms.
"""
struct SwarmConfig
    algorithm::String
    size::Int
    dimension::Int
    bounds::Vector{Tuple{Float64, Float64}}
    parameters::Dict{String, Any}
end

# ====================== Particle Swarm Optimization ======================
"""
    ParticleSwarmOptimization

Implementation of Particle Swarm Optimization.
"""
mutable struct ParticleSwarmOptimization <: SwarmAlgorithm
    swarm_size::Int
    dimension::Int
    bounds::Vector{Tuple{Float64, Float64}}
    
    positions::Matrix{Float64}
    velocities::Matrix{Float64}
    personal_best_positions::Matrix{Float64}
    personal_best_fitness::Vector{Float64}
    global_best_position::Vector{Float64}
    global_best_fitness::Float64
    
    inertia_weight::Float64
    cognitive_weight::Float64
    social_weight::Float64
    
    function ParticleSwarmOptimization(params::Dict{String, Any})
        inertia_weight = get(params, "inertia_weight", 0.7)
        cognitive_weight = get(params, "cognitive_weight", 1.5)
        social_weight = get(params, "social_weight", 1.5)
        
        return new(
            0, 0, [], 
            Matrix{Float64}(undef, 0, 0), 
            Matrix{Float64}(undef, 0, 0), 
            Matrix{Float64}(undef, 0, 0), 
            Vector{Float64}(undef, 0),
            Vector{Float64}(undef, 0),
            Inf,
            inertia_weight,
            cognitive_weight,
            social_weight
        )
    end
end

# ====================== Ant Colony Optimization ======================
"""
    AntColonyOptimization

Implementation of Ant Colony Optimization.
"""
mutable struct AntColonyOptimization <: SwarmAlgorithm
    swarm_size::Int
    dimension::Int
    bounds::Vector{Tuple{Float64, Float64}}
    
    positions::Matrix{Float64}
    pheromone_matrix::Matrix{Float64}
    best_position::Vector{Float64}
    best_fitness::Float64
    
    evaporation_rate::Float64
    pheromone_weight::Float64
    heuristic_weight::Float64
    
    function AntColonyOptimization(params::Dict{String, Any})
        evaporation_rate = get(params, "evaporation_rate", 0.1)
        pheromone_weight = get(params, "pheromone_weight", 1.0)
        heuristic_weight = get(params, "heuristic_weight", 2.0)
        
        return new(
            0, 0, [], 
            Matrix{Float64}(undef, 0, 0), 
            Matrix{Float64}(undef, 0, 0), 
            Vector{Float64}(undef, 0),
            Inf,
            evaporation_rate,
            pheromone_weight,
            heuristic_weight
        )
    end
end

# ====================== Artificial Bee Colony ======================
"""
    ArtificialBeeColony

Implementation of Artificial Bee Colony.
"""
mutable struct ArtificialBeeColony <: SwarmAlgorithm
    swarm_size::Int
    dimension::Int
    bounds::Vector{Tuple{Float64, Float64}}
    
    positions::Matrix{Float64}
    fitness_values::Vector{Float64}
    trial_counts::Vector{Int}
    best_position::Vector{Float64}
    best_fitness::Float64
    
    limit::Int
    
    function ArtificialBeeColony(params::Dict{String, Any})
        limit = get(params, "limit", 20)
        
        return new(
            0, 0, [], 
            Matrix{Float64}(undef, 0, 0), 
            Vector{Float64}(undef, 0),
            Vector{Int}(undef, 0),
            Vector{Float64}(undef, 0),
            Inf,
            limit
        )
    end
end

# ====================== Firefly Algorithm ======================
"""
    FireflyAlgorithm

Implementation of Firefly Algorithm.
"""
mutable struct FireflyAlgorithm <: SwarmAlgorithm
    swarm_size::Int
    dimension::Int
    bounds::Vector{Tuple{Float64, Float64}}
    
    positions::Matrix{Float64}
    intensity::Vector{Float64}
    best_position::Vector{Float64}
    best_fitness::Float64
    
    alpha::Float64
    beta0::Float64
    gamma::Float64
    
    function FireflyAlgorithm(params::Dict{String, Any})
        alpha = get(params, "alpha", 0.5)
        beta0 = get(params, "beta0", 1.0)
        gamma = get(params, "gamma", 1.0)
        
        return new(
            0, 0, [], 
            Matrix{Float64}(undef, 0, 0), 
            Vector{Float64}(undef, 0),
            Vector{Float64}(undef, 0),
            Inf,
            alpha,
            beta0,
            gamma
        )
    end
end

# ====================== Algorithm Factory ======================
"""
    create_algorithm(algorithm_type::String, params::Dict{String, Any})

Creates a new swarm algorithm instance of the specified type.
"""
function create_algorithm(algorithm_type::String, params::Dict{String, Any})
    algorithm_type = lowercase(algorithm_type)
    
    if algorithm_type == "pso" || algorithm_type == "particle"
        return ParticleSwarmOptimization(params)
    elseif algorithm_type == "aco" || algorithm_type == "ant"
        return AntColonyOptimization(params)
    elseif algorithm_type == "abc" || algorithm_type == "bee"
        return ArtificialBeeColony(params)
    elseif algorithm_type == "firefly"
        return FireflyAlgorithm(params)
    else
        error("Unknown algorithm type: $algorithm_type")
    end
end

# ====================== Initialization ======================
"""
    initialize!(algorithm::ParticleSwarmOptimization, swarm_size::Int, dimension::Int, bounds::Vector{Tuple{Float64, Float64}})

Initialize a Particle Swarm Optimization algorithm.
"""
function initialize!(algorithm::ParticleSwarmOptimization, swarm_size::Int, dimension::Int, bounds::Vector{Tuple{Float64, Float64}})
    algorithm.swarm_size = swarm_size
    algorithm.dimension = dimension
    algorithm.bounds = bounds
    
    # Generate random initial positions within bounds
    algorithm.positions = zeros(swarm_size, dimension)
    algorithm.velocities = zeros(swarm_size, dimension)
    algorithm.personal_best_positions = zeros(swarm_size, dimension)
    algorithm.personal_best_fitness = fill(Inf, swarm_size)
    algorithm.global_best_position = zeros(dimension)
    algorithm.global_best_fitness = Inf
    
    # Initialize positions and velocities
    for i in 1:swarm_size
        for j in 1:dimension
            min_val, max_val = bounds[j]
            algorithm.positions[i, j] = min_val + rand() * (max_val - min_val)
            algorithm.velocities[i, j] = (rand() - 0.5) * (max_val - min_val) * 0.1
        end
        algorithm.personal_best_positions[i, :] = algorithm.positions[i, :]
    end
end

"""
    initialize!(algorithm::AntColonyOptimization, swarm_size::Int, dimension::Int, bounds::Vector{Tuple{Float64, Float64}})

Initialize an Ant Colony Optimization algorithm.
"""
function initialize!(algorithm::AntColonyOptimization, swarm_size::Int, dimension::Int, bounds::Vector{Tuple{Float64, Float64}})
    algorithm.swarm_size = swarm_size
    algorithm.dimension = dimension
    algorithm.bounds = bounds
    
    # Generate random initial positions within bounds
    algorithm.positions = zeros(swarm_size, dimension)
    
    # Initialize pheromone matrix
    algorithm.pheromone_matrix = ones(dimension, 10)  # Discretize each dimension into 10 sections
    algorithm.best_position = zeros(dimension)
    algorithm.best_fitness = Inf
    
    # Initialize positions
    for i in 1:swarm_size
        for j in 1:dimension
            min_val, max_val = bounds[j]
            algorithm.positions[i, j] = min_val + rand() * (max_val - min_val)
        end
    end
end

"""
    initialize!(algorithm::ArtificialBeeColony, swarm_size::Int, dimension::Int, bounds::Vector{Tuple{Float64, Float64}})

Initialize an Artificial Bee Colony algorithm.
"""
function initialize!(algorithm::ArtificialBeeColony, swarm_size::Int, dimension::Int, bounds::Vector{Tuple{Float64, Float64}})
    algorithm.swarm_size = swarm_size
    algorithm.dimension = dimension
    algorithm.bounds = bounds
    
    # Generate random initial positions within bounds
    algorithm.positions = zeros(swarm_size, dimension)
    algorithm.fitness_values = fill(Inf, swarm_size)
    algorithm.trial_counts = zeros(Int, swarm_size)
    algorithm.best_position = zeros(dimension)
    algorithm.best_fitness = Inf
    
    # Initialize positions
    for i in 1:swarm_size
        for j in 1:dimension
            min_val, max_val = bounds[j]
            algorithm.positions[i, j] = min_val + rand() * (max_val - min_val)
        end
    end
end

"""
    initialize!(algorithm::FireflyAlgorithm, swarm_size::Int, dimension::Int, bounds::Vector{Tuple{Float64, Float64}})

Initialize a Firefly Algorithm.
"""
function initialize!(algorithm::FireflyAlgorithm, swarm_size::Int, dimension::Int, bounds::Vector{Tuple{Float64, Float64}})
    algorithm.swarm_size = swarm_size
    algorithm.dimension = dimension
    algorithm.bounds = bounds
    
    # Generate random initial positions within bounds
    algorithm.positions = zeros(swarm_size, dimension)
    algorithm.intensity = zeros(swarm_size)
    algorithm.best_position = zeros(dimension)
    algorithm.best_fitness = Inf
    
    # Initialize positions
    for i in 1:swarm_size
        for j in 1:dimension
            min_val, max_val = bounds[j]
            algorithm.positions[i, j] = min_val + rand() * (max_val - min_val)
        end
    end
end

"""
    initialize!(algorithm::SwarmAlgorithm, swarm_size::Int, dimension::Int, bounds::Vector{Tuple{Float64, Float64}})

Generic initialization for any swarm algorithm.
"""
function initialize!(algorithm::SwarmAlgorithm, swarm_size::Int, dimension::Int, bounds::Vector{Tuple{Float64, Float64}})
    if length(bounds) == 1 && dimension > 1
        bounds = repeat(bounds, dimension)
    elseif length(bounds) != dimension
        error("Bounds must have the same length as dimension")
    end
    
    initialize!(algorithm, swarm_size, dimension, bounds)
end

# ====================== Fitness Evaluation ======================
"""
    evaluate_fitness!(algorithm::ParticleSwarmOptimization, fitness_function::Function)

Evaluate fitness for all particles and update personal and global best positions.
"""
function evaluate_fitness!(algorithm::ParticleSwarmOptimization, fitness_function::Function)
    for i in 1:algorithm.swarm_size
        position = algorithm.positions[i, :]
        fitness = fitness_function(position)
        
        # Update personal best
        if fitness < algorithm.personal_best_fitness[i]
            algorithm.personal_best_fitness[i] = fitness
            algorithm.personal_best_positions[i, :] = position
            
            # Update global best
            if fitness < algorithm.global_best_fitness
                algorithm.global_best_fitness = fitness
                algorithm.global_best_position = position
            end
        end
    end
end

"""
    evaluate_fitness!(algorithm::AntColonyOptimization, fitness_function::Function)

Evaluate fitness for all ants and update pheromones.
"""
function evaluate_fitness!(algorithm::AntColonyOptimization, fitness_function::Function)
    fitness_values = zeros(algorithm.swarm_size)
    
    for i in 1:algorithm.swarm_size
        position = algorithm.positions[i, :]
        fitness_values[i] = fitness_function(position)
        
        # Update best position
        if fitness_values[i] < algorithm.best_fitness
            algorithm.best_fitness = fitness_values[i]
            algorithm.best_position = position
        end
    end
    
    # Update pheromone matrix (simplified for continuous domains)
    algorithm.pheromone_matrix *= (1 - algorithm.evaporation_rate)
    
    for i in 1:algorithm.swarm_size
        position = algorithm.positions[i, :]
        fitness = fitness_values[i]
        
        # Skip if fitness is not good
        if fitness > 10 * algorithm.best_fitness
            continue
        end
        
        # Calculate pheromone deposit
        deposit = 1.0 / (1.0 + fitness)
        
        # Update pheromone for this path (simplified)
        for j in 1:algorithm.dimension
            section = min(10, max(1, floor(Int, (position[j] - algorithm.bounds[j][1]) / 
                        (algorithm.bounds[j][2] - algorithm.bounds[j][1]) * 10) + 1))
            algorithm.pheromone_matrix[j, section] += deposit
        end
    end
end

"""
    evaluate_fitness!(algorithm::ArtificialBeeColony, fitness_function::Function)

Evaluate fitness for all food sources and update best position.
"""
function evaluate_fitness!(algorithm::ArtificialBeeColony, fitness_function::Function)
    for i in 1:algorithm.swarm_size
        position = algorithm.positions[i, :]
        fitness = fitness_function(position)
        
        # Update fitness values
        algorithm.fitness_values[i] = fitness
        
        # Update best position
        if fitness < algorithm.best_fitness
            algorithm.best_fitness = fitness
            algorithm.best_position = position
        end
    end
end

"""
    evaluate_fitness!(algorithm::FireflyAlgorithm, fitness_function::Function)

Evaluate fitness for all fireflies and update their light intensity.
"""
function evaluate_fitness!(algorithm::FireflyAlgorithm, fitness_function::Function)
    for i in 1:algorithm.swarm_size
        position = algorithm.positions[i, :]
        fitness = fitness_function(position)
        
        # Update intensity (inversely proportional to fitness for minimization)
        algorithm.intensity[i] = 1.0 / (1.0 + fitness)
        
        # Update best position
        if fitness < algorithm.best_fitness
            algorithm.best_fitness = fitness
            algorithm.best_position = position
        end
    end
end

# ====================== Algorithm Updates ======================
"""
    update!(algorithm::ParticleSwarmOptimization)

Update velocities and positions for particle swarm optimization.
"""
function update!(algorithm::ParticleSwarmOptimization)
    for i in 1:algorithm.swarm_size
        for j in 1:algorithm.dimension
            # Calculate cognitive and social components
            cognitive = algorithm.cognitive_weight * rand() * 
                       (algorithm.personal_best_positions[i, j] - algorithm.positions[i, j])
            social = algorithm.social_weight * rand() * 
                    (algorithm.global_best_position[j] - algorithm.positions[i, j])
            
            # Update velocity
            algorithm.velocities[i, j] = algorithm.inertia_weight * algorithm.velocities[i, j] + 
                                         cognitive + social
            
            # Update position
            algorithm.positions[i, j] += algorithm.velocities[i, j]
            
            # Bound position
            min_val, max_val = algorithm.bounds[j]
            algorithm.positions[i, j] = clamp(algorithm.positions[i, j], min_val, max_val)
        end
    end
end

"""
    update!(algorithm::AntColonyOptimization)

Update positions for ant colony optimization.
"""
function update!(algorithm::AntColonyOptimization)
    # For each ant
    for i in 1:algorithm.swarm_size
        # For each dimension
        for j in 1:algorithm.dimension
            # Compute probability distribution for this dimension
            probabilities = algorithm.pheromone_matrix[j, :] .^ algorithm.pheromone_weight
            
            # Choose a section based on probabilities
            section = sample(1:10, Weights(probabilities))
            
            # Compute the corresponding value
            min_val, max_val = algorithm.bounds[j]
            section_width = (max_val - min_val) / 10
            low = min_val + (section - 1) * section_width
            high = min_val + section * section_width
            
            # Generate position in selected section
            algorithm.positions[i, j] = low + rand() * (high - low)
        end
    end
end

"""
    update!(algorithm::ArtificialBeeColony)

Update positions for artificial bee colony.
"""
function update!(algorithm::ArtificialBeeColony)
    # Employed bees phase: generate new solutions
    for i in 1:algorithm.swarm_size
        # Choose a random dimension
        j = rand(1:algorithm.dimension)
        
        # Choose a random solution different from i
        k = rand(setdiff(1:algorithm.swarm_size, i))
        
        # Generate new position
        phi = rand() * 2 - 1  # Random value in [-1, 1]
        new_position = copy(algorithm.positions[i, :])
        new_position[j] = algorithm.positions[i, j] + phi * (algorithm.positions[i, j] - algorithm.positions[k, j])
        
        # Bound position
        min_val, max_val = algorithm.bounds[j]
        new_position[j] = clamp(new_position[j], min_val, max_val)
        
        # Calculate fitness
        new_fitness = fitness_function(new_position)
        
        # Greedy selection
        if new_fitness < algorithm.fitness_values[i]
            algorithm.positions[i, :] = new_position
            algorithm.fitness_values[i] = new_fitness
            algorithm.trial_counts[i] = 0
        else
            algorithm.trial_counts[i] += 1
        end
    end
    
    # Onlooker bees phase: select solutions based on fitness
    total_fitness = sum(1 ./ (1 .+ algorithm.fitness_values))
    probabilities = (1 ./ (1 .+ algorithm.fitness_values)) ./ total_fitness
    
    for _ in 1:algorithm.swarm_size
        i = sample(1:algorithm.swarm_size, Weights(probabilities))
        
        # Choose a random dimension
        j = rand(1:algorithm.dimension)
        
        # Choose a random solution different from i
        k = rand(setdiff(1:algorithm.swarm_size, i))
        
        # Generate new position
        phi = rand() * 2 - 1  # Random value in [-1, 1]
        new_position = copy(algorithm.positions[i, :])
        new_position[j] = algorithm.positions[i, j] + phi * (algorithm.positions[i, j] - algorithm.positions[k, j])
        
        # Bound position
        min_val, max_val = algorithm.bounds[j]
        new_position[j] = clamp(new_position[j], min_val, max_val)
        
        # Calculate fitness
        new_fitness = fitness_function(new_position)
        
        # Greedy selection
        if new_fitness < algorithm.fitness_values[i]
            algorithm.positions[i, :] = new_position
            algorithm.fitness_values[i] = new_fitness
            algorithm.trial_counts[i] = 0
        else
            algorithm.trial_counts[i] += 1
        end
    end
    
    # Scout bees phase: replace solutions that have been tried too many times
    for i in 1:algorithm.swarm_size
        if algorithm.trial_counts[i] >= algorithm.limit
            # Generate random solution
            for j in 1:algorithm.dimension
                min_val, max_val = algorithm.bounds[j]
                algorithm.positions[i, j] = min_val + rand() * (max_val - min_val)
            end
            
            algorithm.trial_counts[i] = 0
        end
    end
end

"""
    update!(algorithm::FireflyAlgorithm)

Update positions for firefly algorithm.
"""
function update!(algorithm::FireflyAlgorithm)
    for i in 1:algorithm.swarm_size
        for j in 1:algorithm.swarm_size
            # Move firefly i towards j if j is brighter
            if algorithm.intensity[j] > algorithm.intensity[i]
                # Calculate distance
                r = norm(algorithm.positions[i, :] - algorithm.positions[j, :])
                
                # Calculate attractiveness
                beta = algorithm.beta0 * exp(-algorithm.gamma * r^2)
                
                # Calculate randomization
                alpha_step = algorithm.alpha * (rand(algorithm.dimension) .- 0.5)
                
                # Move firefly i towards j
                algorithm.positions[i, :] += beta * (algorithm.positions[j, :] - algorithm.positions[i, :]) + alpha_step
                
                # Bound positions
                for k in 1:algorithm.dimension
                    min_val, max_val = algorithm.bounds[k]
                    algorithm.positions[i, k] = clamp(algorithm.positions[i, k], min_val, max_val)
                end
            end
        end
    end
end

# ====================== Utility Functions ======================
"""
    get_best_position(algorithm::SwarmAlgorithm)

Get the best position found by the algorithm.
"""
function get_best_position(algorithm::ParticleSwarmOptimization)
    return algorithm.global_best_position
end

function get_best_position(algorithm::SwarmAlgorithm)
    return algorithm.best_position
end

"""
    get_best_fitness(algorithm::SwarmAlgorithm)

Get the best fitness value found by the algorithm.
"""
function get_best_fitness(algorithm::ParticleSwarmOptimization)
    return algorithm.global_best_fitness
end

function get_best_fitness(algorithm::SwarmAlgorithm)
    return algorithm.best_fitness
end

end # module SwarmAlgorithms 