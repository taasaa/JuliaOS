using Pkg

# Activate the main project
Pkg.activate(".")

# Add the JuliaOSBridge package
Pkg.develop(path="../packages/julia-bridge")

# Try to import it
try
    @info "Attempting to import JuliaOSBridge..."
    using JuliaOSBridge
    @info "✓ Successfully imported JuliaOSBridge!"
    
    # Print available functions
    exported_symbols = names(JuliaOSBridge)
    @info "Exported symbols from JuliaOSBridge:" exported_symbols
catch e
    @error "Failed to import JuliaOSBridge" exception=(e, catch_backtrace())
end 