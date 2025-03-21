#!/usr/bin/env julia

using Pkg
Pkg.activate(".")

using JuliaOS.CLI.DefiCLI

# Run the CLI
DefiCLI.main() 