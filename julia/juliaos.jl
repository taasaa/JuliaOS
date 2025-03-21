#!/usr/bin/env julia

# Main entry point for JuliaOS framework
# This script forwards arguments to the appropriate subcommand

# Add the current directory to the load path
push!(LOAD_PATH, @__DIR__)

# Include the CLI
include(joinpath(@__DIR__, "apps", "cli.jl"))

# Forward all arguments to the CLI
using .JuliaOSCLI

# Run main with the command-line arguments
JuliaOSCLI.main() 