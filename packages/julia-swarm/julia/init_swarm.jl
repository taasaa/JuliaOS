using JSON
using JuliaSwarm

function parse_config(config_json::String)
    config = JSON.parse(config_json)
    
    SwarmConfig(
        config["size"],
        2,  # Default to 2D optimization
        config["parameters"]["learningRate"],
        config["parameters"]["inertia"],
        config["parameters"]["cognitiveWeight"],
        config["parameters"]["socialWeight"],
        ([-10.0, -10.0], [10.0, 10.0])  # Default bounds
    )
end

function main()
    # Read configuration from stdin
    config_json = readline()
    config = parse_config(config_json)
    
    # Initialize swarm with a default objective function
    objective_function(x) = sum(x.^2)  # Sphere function as default
    swarm = initialize_swarm(config, objective_function)
    
    println("Initialized")
    flush(stdout)
    
    while true
        # Read command from stdin
        command_json = readline()
        command = JSON.parse(command_json)
        
        if command["type"] == "optimize"
            # Parse objective function from string
            objective_str = command["objectiveFunction"]
            # Note: In a real implementation, you'd need to safely evaluate this string
            # This is just a placeholder
            objective_function = x -> eval(Meta.parse(objective_str))(x)
            
            # Run optimization
            best_position, best_fitness = optimize(swarm)
            
            # Send result back
            result = Dict(
                "bestPosition" => best_position,
                "bestFitness" => best_fitness
            )
            println(JSON.json(result))
            flush(stdout)
            
        elseif command["type"] == "exit"
            break
        end
    end
end

main() 