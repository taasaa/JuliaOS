using Pkg

# Activate the project
Pkg.activate(".")

# Add necessary packages
function safe_add_package(name::String, version::String)
    try
        println("Adding $name version $version...")
        Pkg.add(name=name, version=version)
        println("✓ Successfully added $name")
    catch e
        println("⚠ Warning: Failed to add $name: $e")
    end
end

# Stage 1: Core dependencies
println("\nStage 1: Installing core dependencies...")
safe_add_package("StatsBase", "0.33.21")
safe_add_package("Distributions", "0.25.118")
safe_add_package("DataFrames", "1.7.0")
safe_add_package("Plots", "1.39.0")

# Stage 2: Data handling dependencies
println("\nStage 2: Installing data handling dependencies...")
safe_add_package("CSV", "0.10.15")
safe_add_package("JSON", "0.21.4")
safe_add_package("TimeSeries", "0.23.2")

# Stage 3: Network and API dependencies
println("\nStage 3: Installing network and API dependencies...")
safe_add_package("HTTP", "1.10.15")
safe_add_package("WebSockets", "1.6.0")

# Stage 4: Machine Learning dependencies
println("\nStage 4: Installing machine learning dependencies...")
safe_add_package("MLJ", "0.18.6")

# Stage 5: Utility dependencies
println("\nStage 5: Installing utility dependencies...")
safe_add_package("FFTW", "1.8.1")
safe_add_package("BSON", "0.3.9")

# Add JuliaOSBridge package
println("\nAdding JuliaOSBridge package...")
try
    Pkg.develop(path="../packages/julia-bridge")
    println("✓ Successfully added JuliaOSBridge")
catch e
    println("⚠ Warning: Failed to add JuliaOSBridge: $e")
end

# Final stage: Instantiate and resolve dependencies
println("\nFinal stage: Resolving dependencies...")
try
    Pkg.resolve()
    Pkg.instantiate()
    Pkg.build()
    println("✓ Successfully resolved and built all dependencies")
catch e
    println("⚠ Warning: Failed to resolve dependencies: $e")
end

# Add the src directory to Julia's load path
src_path = abspath(joinpath(@__DIR__, "src"))
if !in(src_path, LOAD_PATH)
    push!(LOAD_PATH, src_path)
end

# Run tests if everything is installed
println("\nRunning tests...")
try
    # First try to import JuliaOS to verify it's accessible
    include(joinpath(src_path, "JuliaOS.jl"))
    using .JuliaOS
    include("test/runtests.jl")
    println("✓ Tests completed successfully")
catch e
    println("⚠ Warning: Tests failed: $e")
    println("Current LOAD_PATH: ", LOAD_PATH)
    println("Looking for JuliaOS.jl in: ", src_path)
end

# Test the project
Pkg.test() 