using Pkg

# Activate the project
Pkg.activate(".")

# Add JuliaOSBridge package
println("\nAdding JuliaOSBridge package...")
try
    Pkg.develop(path="../packages/julia-bridge")
    println("✓ Successfully added JuliaOSBridge")
catch e
    println("⚠ Warning: Failed to add JuliaOSBridge: $e")
end

# Add base dependencies
base_deps = [
    "Base64" => "",
    "SHA" => "",
    "JSON" => "0.21.4",
    "HTTP" => "1.10.15",
    "DataFrames" => "1.7.0",
    "Distributions" => "0.25.118",
    "StatsBase" => "0.33.21"
]

for (pkg, ver) in base_deps
    try
        if ver == ""
            Pkg.add(pkg)
        else
            Pkg.add(name=pkg, version=ver)
        end
        println("✓ Successfully added $pkg")
    catch e
        println("⚠ Warning: Failed to add $pkg: $e")
    end
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

println("\nSetup completed successfully!") 