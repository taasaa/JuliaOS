module JuliaOS

using JSON
using Dates
using Statistics
using Random
using HTTP
using DataFrames
using Distributions
using LinearAlgebra
using WebSockets
using Plots
using Logging
using JuliaOSBridge

# Include core system modules in dependency order
include("Blockchain.jl")
include("SecurityTypes.jl")
include("SwarmManager.jl")
include("SecurityManager.jl")
include("Bridge.jl")
include("AgentSystem.jl")
include("DEX.jl")
include("MarketData.jl")
include("MLIntegration.jl")
include("RiskManagement.jl")
include("AdvancedSwarm.jl")
include("SpecializedAgents.jl")
include("CrossChainArbitrage.jl")
include("UserModules.jl")

# Export public components
export Blockchain, SecurityTypes, SecurityManager, SwarmManager, Bridge, AgentSystem, DEX, MarketData, MLIntegration, AdvancedSwarm, SpecializedAgents, CrossChainArbitrage, RiskManagement, UserModules

# Initialize logging
const logger = SimpleLogger(stderr, Logging.Info)
global_logger(logger)

# System configuration
const CONFIG = Dict(
    "max_agents" => 1000,
    "default_swarm_size" => 100,
    "update_interval" => 0.1,
    "max_memory" => 1024 * 1024 * 1024,  # 1GB
    "data_dir" => "data",
    "log_dir" => "logs",
    "supported_chains" => ["ethereum", "polygon", "arbitrum", "optimism", "base"],
    "default_gas_limit" => 500000,
    "max_slippage" => 0.01,  # 1%
    "min_liquidity" => 10000.0,  # Minimum liquidity in USD
    "price_feed_update_interval" => 1.0,  # seconds
    "bridge_timeout" => 300,  # 5 minutes
    "max_retries" => 3,
    "health_check_interval" => 60,  # seconds
    "security" => Dict(
        "anomaly_detection_threshold" => 0.75,
        "max_transaction_value" => 10.0,  # ETH or equivalent
        "emergency_contacts" => ["security@yourproject.com"],
        "monitoring_interval" => 60,  # seconds
        "enable_hooks" => true
    )
)

# Abstract types for system components
abstract type AbstractAgent end
abstract type AbstractSwarm end
abstract type AbstractStrategy end
abstract type AbstractMarketData end
abstract type AbstractBridge end

# Initialize system directories
function initialize_system()
    # Create necessary directories
    for dir in [CONFIG["data_dir"], CONFIG["log_dir"]]
        if !isdir(dir)
            mkdir(dir)
            @info "Created directory: $dir"
        end
    end
    
    # Initialize logging
    log_file = joinpath(CONFIG["log_dir"], "juliaos_$(Dates.format(now(), "yyyy-mm-dd_HH-MM-SS")).log")
    file_logger = SimpleLogger(open(log_file, "w"), Logging.Info)
    global_logger(TeeLogger(logger, file_logger))
    
    # Initialize security subsystem
    initialize_security_subsystem()
    
    # Load user modules
    UserModules.load_user_modules()
    
    @info "JuliaOS system initialized"
end

# Initialize security subsystem
function initialize_security_subsystem()
    security_config = SecurityManager.SecurityConfig(
        CONFIG["security"]["emergency_contacts"],
        CONFIG["security"]["anomaly_detection_threshold"],
        CONFIG["security"]["max_transaction_value"],
        String[],  # No paused chains by default
        Dict(
            "max_slippage" => CONFIG["max_slippage"],
            "max_gas_multiplier" => 3.0,
            "contract_risk_threshold" => 0.7
        ),
        CONFIG["security"]["monitoring_interval"],
        CONFIG["security"]["enable_hooks"]
    )
    
    # Initialize security manager
    security_status = SecurityManager.initialize_security(security_config)
    
    # Start security monitoring in background task
    @async begin
        while true
            try
                for chain in CONFIG["supported_chains"]
                    # Monitor chain activity
                    chain_metrics = SecurityManager.monitor_chain_activity(chain)
                    
                    # Check for anomalies
                    if chain_metrics["anomaly_score"] > security_config.anomaly_detection_threshold
                        # Create incident response
                        SecurityManager.create_incident_response(
                            "chain_anomaly", 
                            "high", 
                            Dict("chain" => chain, "metrics" => chain_metrics)
                        )
                        
                        @warn "Security anomaly detected on $chain"
                    end
                end
            catch e
                @error "Error in security monitoring" exception=(e, catch_backtrace())
            end
            
            # Sleep until next monitoring interval
            sleep(CONFIG["security"]["monitoring_interval"])
        end
    end
    
    @info "Security subsystem initialized"
end

# System health check
function check_system_health()
    try
        # Check memory usage
        memory_usage = Sys.free_memory() / (1024 * 1024 * 1024)  # Convert to GB
        memory_status = memory_usage < CONFIG["max_memory"] ? "healthy" : "warning"
        
        # Check active agents
        active_agents = length(collect(instances(AbstractAgent)))
        agent_status = active_agents <= CONFIG["max_agents"] ? "healthy" : "warning"
        
        # Check bridge connections
        bridge_status = Bridge.check_connections()
        
        # Check market data feeds
        market_data_status = MarketData.check_feeds()

        # Get security status (added)
        security_report = SecurityManager.generate_security_report(3600)  # Last hour
        
        return Dict(
            "status" => "operational",
            "memory_usage" => memory_usage,
            "memory_status" => memory_status,
            "active_agents" => active_agents,
            "agent_status" => agent_status,
            "bridge_status" => bridge_status,
            "market_data_status" => market_data_status,
            "security_status" => security_report["summary"],
            "timestamp" => now()
        )
    catch e
        @error "Error checking system health" exception=(e, catch_backtrace())
        return Dict(
            "status" => "error",
            "error" => string(e),
            "timestamp" => now()
        )
    end
end

# Export public functions
export initialize_system, check_system_health

# Module initialization
function __init__()
    @info "JuliaOS runtime initialization"
    
    # Runtime initialization code 
    # (This runs after all modules are loaded but before any user code executes)
end

end # module 