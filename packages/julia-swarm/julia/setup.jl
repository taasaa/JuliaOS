#!/usr/bin/env julia

"""
    setup.jl
    
This script initializes the JuliaSwarm package and ensures all dependencies
are installed. It also provides helper functions for starting the TypeScript bridge.
"""

# Check if required packages are installed, install if needed
required_packages = [
    "JSON",
    "Random",
    "LinearAlgebra",
    "Statistics",
    "Dates",
    "WebSockets",
    "HTTP"
]

missing_packages = String[]
using Pkg

for pkg in required_packages
    try
        # Try to use the package
        Base.eval(Main, :(using $(Symbol(pkg))))
        println("✓ Package $pkg is installed")
    catch
        # If it fails, add to missing list
        push!(missing_packages, pkg)
    end
end

# Install missing packages
if !isempty(missing_packages)
    println("Installing missing packages: $(join(missing_packages, ", "))")
    Pkg.add(missing_packages)
    
    # Verify installation
    any_failed = false
    for pkg in missing_packages
        try
            Base.eval(Main, :(using $(Symbol(pkg))))
            println("✓ Successfully installed $pkg")
        catch
            println("✗ Failed to install $pkg")
            any_failed = true
        end
    end
    
    if any_failed
        error("Some packages failed to install. Please install them manually.")
    end
end

println("All required packages are installed!")

# Check if the WebSocket server is already running
function is_server_running()
    try
        # Try to connect to the WebSocket server
        using WebSockets, HTTP
        
        # Create a client that tries to connect
        conn = WebSockets.open("ws://localhost:8080") do ws
            # If connection succeeds, server is running
            WebSockets.send(ws, JSON.json(Dict("type" => "ping", "data" => Dict())))
            
            # Wait for a response
            data = WebSockets.receive(ws)
            return true
        end
        
        return true
    catch
        # If connection fails, server is not running
        return false
    end
end

# Script to start the WebSocket server
function start_server()
    println("Starting JuliaSwarm WebSocket server...")
    
    # Get the directory of this script
    script_dir = dirname(Base.source_path() === nothing ? pwd() : Base.source_path())
    
    # Build the path to main.jl
    main_script = joinpath(script_dir, "main.jl")
    
    if !isfile(main_script)
        error("Cannot find main.jl in $(script_dir). Make sure you're running this script from the correct directory.")
    end
    
    # Start the server in the background
    cmd = `$(Base.julia_cmd()) $main_script`
    proc = run(cmd, wait=false)
    
    # Give it some time to start
    sleep(2)
    
    if !is_server_running()
        println("Server failed to start. Check logs for errors.")
    else
        println("Server started successfully!")
        println("WebSocket endpoint: ws://localhost:8080")
    end
    
    return proc
end

# Helper function to initialize a new swarm
function init_swarm(config::Dict{String, Any})
    # Include the JuliaSwarm module
    include(joinpath(dirname(Base.source_path() === nothing ? pwd() : Base.source_path()), "JuliaSwarm.jl"))
    using .JuliaSwarm
    
    # Initialize a new swarm
    response = initialize_swarm(config)
    
    if response["success"]
        println("Swarm initialized successfully!")
        println("Swarm ID: $(response["swarm_id"])")
    else
        println("Failed to initialize swarm: $(response["message"])")
    end
    
    return response
end

# Print usage information
println("""
JuliaSwarm Setup Complete!

To start the WebSocket server, call:
    proc = start_server()

To initialize a new swarm, call:
    config = Dict{String, Any}(
        "algorithm" => "pso",
        "size" => 30,
        "trading_pairs" => ["ETH/USDC", "SOL/USDC"],
        "parameters" => Dict{String, Any}(
            "inertia_weight" => 0.7,
            "cognitive_weight" => 1.5,
            "social_weight" => 1.5
        )
    )
    response = init_swarm(config)
    swarm_id = response["swarm_id"]
""")

# If run directly, start the server
if abspath(PROGRAM_FILE) == @__FILE__
    start_server()
end 