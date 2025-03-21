using Pkg
using Logging

# Add required packages if not already installed
required_packages = [
    "HTTP",
    "WebSockets",
    "JSON",
    "UUIDs",
    "Dates",
    "Statistics",
    "Random",
    "DataFrames",
    "Distributions",
    "LinearAlgebra",
    "Plots",
    "Serialization"
]

for pkg in required_packages
    if !(pkg in keys(Pkg.project().dependencies))
        @info "Installing package: $pkg"
        Pkg.add(pkg)
    end
end

# Activate the project environment
Pkg.activate(".")

# Set up logging
ENV["JULIA_LOG_LEVEL"] = "INFO"
global_logger(ConsoleLogger(stderr, Logging.Info))

# Initialize the system
@info "Initializing JuliaOS system..."
include("src/JuliaOS.jl")
JuliaOS.initialize_system()

# Check system health
@info "Checking system health..."
health_status = JuliaOS.check_system_health()
@info "System health status: $health_status"

# Start the server
@info "Starting server..."
include("src/server.jl")
http_server, ws_server = start_server()

# Keep the main thread alive
@info "Server is running. Press Ctrl+C to stop."
while true
    sleep(1)
end 