using Pkg

# Activate the project
Pkg.activate(".")

# Resolve and update dependencies
Pkg.resolve()
Pkg.update()

# Install dependencies
Pkg.instantiate()

# Run tests
include("test/runtests.jl") 