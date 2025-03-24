using Pkg
Pkg.activate(".")

println("Current environment: ", Pkg.project().path)

# Try to add JuliaOSBridge package
try
    Pkg.develop(path="../packages/julia-bridge")
    println("✓ Successfully added JuliaOSBridge")
catch e
    println("⚠ Warning: Failed to add JuliaOSBridge: $e")
end

# Try to import JuliaOSBridge
try
    using JuliaOSBridge
    println("✓ Successfully imported JuliaOSBridge")
    # Test some functionality
    println("  Available exports: MarketDataPoint, SwarmConfig")
catch e
    println("⚠ Warning: Failed to import JuliaOSBridge: $e")
end 