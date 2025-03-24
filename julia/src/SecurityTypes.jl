module SecurityTypes

using Dates

export SecurityState, SecurityConfig, SecurityAlert, SecurityIncident

"""
    SecurityConfig

Configuration for the security monitoring system.
"""
struct SecurityConfig
    enabled::Bool
    monitoring_interval::Int
    max_incidents::Int
    alert_threshold::Float64
    anomaly_threshold::Float64
    max_retries::Int
    retry_delay::Int
    emergency_contacts::Vector{String}
    network_configs::Dict{String, Dict{String, Any}}
    ml_model_path::String
    security_rules::Dict{String, Any}
    paused_chains::Vector{String}
    
    SecurityConfig(
        enabled::Bool,
        monitoring_interval::Int,
        max_incidents::Int,
        alert_threshold::Float64,
        anomaly_threshold::Float64,
        max_retries::Int,
        retry_delay::Int,
        emergency_contacts::Vector{String},
        network_configs::Dict{String, Dict{String, Any}},
        ml_model_path::String,
        security_rules::Dict{String, Any},
        paused_chains::Vector{String}=String[]
    ) = new(
        enabled,
        monitoring_interval,
        max_incidents,
        alert_threshold,
        anomaly_threshold,
        max_retries,
        retry_delay,
        emergency_contacts,
        network_configs,
        ml_model_path,
        security_rules,
        paused_chains
    )
end

"""
    SecurityAlert

Represents a security alert.
"""
struct SecurityAlert
    id::String
    type::String
    severity::String
    description::String
    timestamp::DateTime
    source::String
    details::Dict{String, Any}
    resolved::Bool
    resolution_time::Union{Nothing, DateTime}
end

"""
    SecurityIncident

Represents a security incident.
"""
struct SecurityIncident
    id::String
    type::String
    severity::String
    description::String
    start_time::DateTime
    end_time::Union{Nothing, DateTime}
    status::String
    affected_components::Vector{String}
    alerts::Vector{SecurityAlert}
    actions_taken::Vector{String}
    resolution::Union{Nothing, String}
end

"""
    SecurityState

Represents the current state of the security system.
"""
mutable struct SecurityState
    config::SecurityConfig
    active_incidents::Vector{SecurityIncident}
    security_alerts::Vector{SecurityAlert}
    anomaly_scores::Dict{String, Float64}
    last_update::DateTime
    status::String
    emergency_mode::Bool
    paused::Bool
    circuit_breakers::Dict{String, Bool}
    emergency_thresholds::Dict{String, Float64}
    last_incident::Union{Nothing, DateTime}
    incident_history::Vector{Dict{String, Any}}
    contract_risks::Dict{String, Float64}
    merkle_root::String
    merkle_proofs::Dict{String, Vector{String}}
    
    SecurityState(config::SecurityConfig) = new(
        config,
        SecurityIncident[],
        SecurityAlert[],
        Dict{String, Float64}(),
        now(),
        "initializing",
        false,
        false,
        Dict{String, Bool}(),
        Dict{String, Float64}(),
        nothing,
        Vector{Dict{String, Any}}(),
        Dict{String, Float64}(),
        "",
        Dict{String, Vector{String}}()
    )
end

end # module 