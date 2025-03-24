module JuliaSwarm

using JSON
using Random
using Statistics
using LinearAlgebra
using Dates

# Include the swarm algorithms module
include("swarm_algorithms.jl")
using .SwarmAlgorithms

export SwarmManager
export initialize_swarm, optimize_swarm, execute_trade, validate_trade
export get_portfolio, get_market_data, update_market_data
export connect_to_typescript, disconnect_from_typescript

# ====================== Types ======================
"""
    SwarmManager

Main manager for swarm operations and TypeScript communication.
"""
mutable struct SwarmManager
    swarm_id::String
    algorithm::SwarmAlgorithm
    config::Dict{String, Any}
    market_data::Dict{String, Dict{String, Any}}
    portfolio::Dict{String, Any}
    trades::Vector{Dict{String, Any}}
    optimization_results::Union{Nothing, Dict{String, Any}}
    status::String
    created_at::DateTime
    last_updated::DateTime
    
    function SwarmManager(swarm_id::String, config::Dict{String, Any})
        # Extract algorithm params
        algorithm_type = get(config, "algorithm", "pso")
        algorithm_params = get(config, "parameters", Dict{String, Any}())
        algorithm = create_algorithm(algorithm_type, algorithm_params)
        
        # Create empty portfolio
        portfolio = Dict{String, Any}(
            "balances" => Dict{String, Float64}(),
            "positions" => Dict{String, Dict{String, Any}}(),
            "total_value" => 0.0,
            "timestamp" => now()
        )
        
        # Add some initial balances based on config
        if haskey(config, "initial_balances")
            portfolio["balances"] = config["initial_balances"]
        else
            # Set some default balances for testing
            portfolio["balances"] = Dict{String, Float64}(
                "USDC" => 10000.0,
                "ETH" => 0.0,
                "SOL" => 0.0
            )
        end
        
        return new(
            swarm_id,
            algorithm,
            config,
            Dict{String, Dict{String, Any}}(),
            portfolio,
            Vector{Dict{String, Any}}(),
            nothing,
            "initialized",
            now(),
            now()
        )
    end
end

# Global registry of active swarm managers
const SWARM_MANAGERS = Dict{String, SwarmManager}()

# ====================== Core Functions ======================
"""
    initialize_swarm(config::Dict{String, Any})

Initialize a new swarm with the given configuration.
"""
function initialize_swarm(config::Dict{String, Any})
    try
        # Generate a new swarm ID if not provided
        swarm_id = get(config, "swarm_id", string(uuid4()))
        
        # Check if this swarm already exists
        if haskey(SWARM_MANAGERS, swarm_id)
            return Dict{String, Any}(
                "success" => true,
                "swarm_id" => swarm_id,
                "message" => "Swarm already initialized"
            )
        end
        
        # Create a new swarm manager
        manager = SwarmManager(swarm_id, config)
        SWARM_MANAGERS[swarm_id] = manager
        
        # Initialize trading pairs with empty market data
        trading_pairs = get(config, "trading_pairs", String[])
        for pair in trading_pairs
            manager.market_data[pair] = Dict{String, Any}(
                "price" => 0.0,
                "volume" => 0.0,
                "liquidity" => 0.0,
                "timestamp" => now()
            )
        end
        
        # Initialize algorithm with dimension based on strategy
        dimension = get(config, "dimension", 4)  # Default dimension for trading strategy
        swarm_size = get(config, "size", 30)     # Default swarm size
        
        # Create bounds for optimization
        bounds = Vector{Tuple{Float64, Float64}}()
        if haskey(config, "bounds")
            bounds = [(b[1], b[2]) for b in config["bounds"]]
        else
            # Default bounds for trading parameters
            push!(bounds, (0.0, 1.0))  # Entry threshold
            push!(bounds, (0.0, 1.0))  # Exit threshold
            push!(bounds, (0.01, 0.2)) # Stop loss
            push!(bounds, (0.01, 0.5)) # Take profit
        end
        
        # Initialize the algorithm
        initialize!(manager.algorithm, swarm_size, dimension, bounds)
        
        return Dict{String, Any}(
            "success" => true,
            "swarm_id" => swarm_id,
            "message" => "Swarm initialized successfully"
        )
    catch e
        return Dict{String, Any}(
            "success" => false,
            "message" => "Failed to initialize swarm: $(string(e))"
        )
    end
end

"""
    optimize_swarm(swarm_id::String, iterations::Int=100)

Run optimization on the specified swarm.
"""
function optimize_swarm(swarm_id::String, iterations::Int=100)
    try
        # Check if swarm exists
        if !haskey(SWARM_MANAGERS, swarm_id)
            return Dict{String, Any}(
                "success" => false,
                "message" => "Swarm not found: $swarm_id"
            )
        end
        
        manager = SWARM_MANAGERS[swarm_id]
        manager.status = "optimizing"
        manager.last_updated = now()
        
        # Define fitness function
        fitness_function = position -> calculate_fitness(position, manager)
        
        # Run optimization for specified iterations
        for i in 1:iterations
            # Evaluate fitness for current positions
            evaluate_fitness!(manager.algorithm, fitness_function)
            
            # Update positions for next iteration
            update!(manager.algorithm)
        end
        
        # Get best solution
        best_position = get_best_position(manager.algorithm)
        best_fitness = get_best_fitness(manager.algorithm)
        
        # Store optimization results
        manager.optimization_results = Dict{String, Any}(
            "best_position" => best_position,
            "best_fitness" => best_fitness,
            "iterations" => iterations,
            "timestamp" => now()
        )
        
        manager.status = "optimized"
        manager.last_updated = now()
        
        return Dict{String, Any}(
            "success" => true,
            "results" => manager.optimization_results
        )
    catch e
        return Dict{String, Any}(
            "success" => false,
            "message" => "Optimization failed: $(string(e))"
        )
    end
end

"""
    calculate_fitness(position::Vector{Float64}, manager::SwarmManager)

Calculate fitness for a given position.
"""
function calculate_fitness(position::Vector{Float64}, manager::SwarmManager)
    try
        # In a real implementation, this would simulate trading with the given parameters
        # For now, we'll use a simple function based on position
        
        # Extract trading parameters from position
        entry_threshold = position[1]
        exit_threshold = position[2]
        stop_loss = position[3]
        take_profit = position[4]
        
        # Simulate backtesting with these parameters
        # This is a placeholder - in a real implementation, you would use historical data
        
        # For demonstration purposes, we'll return a function that penalizes:
        # - Too high entry threshold (hard to enter market)
        # - Too low exit threshold (premature exit)
        # - Too low stop loss (excessive risk)
        # - Too low take profit (not enough reward)
        
        entry_penalty = (entry_threshold > 0.7) ? (entry_threshold - 0.7)^2 : 0.0
        exit_penalty = (exit_threshold < 0.3) ? (0.3 - exit_threshold)^2 : 0.0
        stop_loss_penalty = (stop_loss < 0.05) ? (0.05 - stop_loss)^2 : 0.0
        take_profit_penalty = (take_profit < 0.1) ? (0.1 - take_profit)^2 : 0.0
        
        # Calculate risk-reward ratio
        risk_reward = take_profit / stop_loss
        reward_penalty = (risk_reward < 2.0) ? (2.0 - risk_reward)^2 : 0.0
        
        # Sum penalties to get fitness (lower is better)
        fitness = entry_penalty + exit_penalty + stop_loss_penalty + take_profit_penalty + reward_penalty
        
        return fitness
    catch e
        @warn "Error calculating fitness: $(string(e))"
        return Inf  # Return worst possible fitness
    end
end

"""
    execute_trade(swarm_id::String, trade::Dict{String, Any})

Execute a trade for the specified swarm.
"""
function execute_trade(swarm_id::String, trade::Dict{String, Any})
    try
        # Check if swarm exists
        if !haskey(SWARM_MANAGERS, swarm_id)
            return Dict{String, Any}(
                "success" => false,
                "message" => "Swarm not found: $swarm_id"
            )
        end
        
        manager = SWARM_MANAGERS[swarm_id]
        
        # Extract trade details
        pair = get(trade, "pair", "")
        trade_type = get(trade, "type", "")
        amount = get(trade, "amount", 0.0)
        price = get(trade, "price", nothing)
        
        if pair == "" || trade_type == "" || amount <= 0
            return Dict{String, Any}(
                "success" => false,
                "message" => "Invalid trade parameters"
            )
        end
        
        # Validate the trade
        validation = validate_trade(swarm_id, trade)
        if !validation["success"]
            return validation
        end
        
        # Generate a trade ID
        trade_id = string(uuid4())
        
        # Use current price if not specified
        if price === nothing
            if haskey(manager.market_data, pair)
                price = manager.market_data[pair]["price"]
            else
                return Dict{String, Any}(
                    "success" => false,
                    "message" => "No price specified and no market data available for $pair"
                )
            end
        end
        
        # Execute the trade (this is a simplified simulation)
        trade_timestamp = now()
        
        # Split the trading pair to get base and quote assets
        base_asset, quote_asset = split(pair, "/")
        
        # Update portfolio
        if trade_type == "buy"
            # Check if we have enough quote asset
            cost = amount * price
            if !haskey(manager.portfolio["balances"], quote_asset) || manager.portfolio["balances"][quote_asset] < cost
                return Dict{String, Any}(
                    "success" => false,
                    "message" => "Insufficient balance of $quote_asset"
                )
            end
            
            # Subtract quote asset
            manager.portfolio["balances"][quote_asset] -= cost
            
            # Add base asset
            if !haskey(manager.portfolio["balances"], base_asset)
                manager.portfolio["balances"][base_asset] = 0.0
            end
            manager.portfolio["balances"][base_asset] += amount
            
            # Record position
            if !haskey(manager.portfolio["positions"], pair)
                manager.portfolio["positions"][pair] = Dict{String, Any}(
                    "size" => amount,
                    "entry_price" => price,
                    "current_price" => price
                )
            else
                # Update existing position
                position = manager.portfolio["positions"][pair]
                old_size = position["size"]
                old_price = position["entry_price"]
                
                # Calculate new average entry price
                new_size = old_size + amount
                new_price = (old_size * old_price + amount * price) / new_size
                
                position["size"] = new_size
                position["entry_price"] = new_price
                position["current_price"] = price
            end
        elseif trade_type == "sell"
            # Check if we have enough base asset
            if !haskey(manager.portfolio["balances"], base_asset) || manager.portfolio["balances"][base_asset] < amount
                return Dict{String, Any}(
                    "success" => false,
                    "message" => "Insufficient balance of $base_asset"
                )
            end
            
            # Subtract base asset
            manager.portfolio["balances"][base_asset] -= amount
            
            # Add quote asset
            if !haskey(manager.portfolio["balances"], quote_asset)
                manager.portfolio["balances"][quote_asset] = 0.0
            end
            manager.portfolio["balances"][quote_asset] += amount * price
            
            # Update position
            if haskey(manager.portfolio["positions"], pair)
                position = manager.portfolio["positions"][pair]
                position["size"] -= amount
                position["current_price"] = price
                
                # Remove position if size is zero
                if position["size"] <= 0
                    delete!(manager.portfolio["positions"], pair)
                end
            end
        else
            return Dict{String, Any}(
                "success" => false,
                "message" => "Invalid trade type: $trade_type"
            )
        end
        
        # Record the trade
        trade_record = Dict{String, Any}(
            "id" => trade_id,
            "pair" => pair,
            "type" => trade_type,
            "amount" => amount,
            "price" => price,
            "timestamp" => trade_timestamp
        )
        push!(manager.trades, trade_record)
        
        # Update portfolio timestamp
        manager.portfolio["timestamp"] = trade_timestamp
        
        # Update total portfolio value
        update_portfolio_value!(manager)
        
        return Dict{String, Any}(
            "success" => true,
            "trade_id" => trade_id,
            "timestamp" => trade_timestamp,
            "price" => price,
            "amount" => amount,
            "total" => amount * price
        )
    catch e
        return Dict{String, Any}(
            "success" => false,
            "message" => "Failed to execute trade: $(string(e))"
        )
    end
end

"""
    validate_trade(swarm_id::String, trade::Dict{String, Any})

Validate a trade for the specified swarm.
"""
function validate_trade(swarm_id::String, trade::Dict{String, Any})
    try
        # Check if swarm exists
        if !haskey(SWARM_MANAGERS, swarm_id)
            return Dict{String, Any}(
                "success" => false,
                "message" => "Swarm not found: $swarm_id"
            )
        end
        
        manager = SWARM_MANAGERS[swarm_id]
        
        # Extract trade details
        pair = get(trade, "pair", "")
        trade_type = get(trade, "type", "")
        amount = get(trade, "amount", 0.0)
        
        if pair == "" || !(trade_type in ["buy", "sell"]) || amount <= 0
            return Dict{String, Any}(
                "success" => false,
                "message" => "Invalid trade parameters"
            )
        end
        
        # Check if we have market data for this pair
        if !haskey(manager.market_data, pair)
            return Dict{String, Any}(
                "success" => false,
                "message" => "No market data available for $pair"
            )
        end
        
        # Get trading params from config
        max_position_size = get(manager.config, "max_position_size", 1.0)
        max_trade_size = get(manager.config, "max_trade_size", 0.5)
        
        # Check max trade size
        if amount > max_trade_size
            return Dict{String, Any}(
                "success" => false,
                "message" => "Trade size exceeds maximum allowed ($max_trade_size)"
            )
        end
        
        # Split the trading pair to get base and quote assets
        base_asset, quote_asset = split(pair, "/")
        
        # Check specific validations by trade type
        if trade_type == "buy"
            # Calculate cost
            price = manager.market_data[pair]["price"]
            cost = amount * price
            
            # Check if we have enough balance
            if !haskey(manager.portfolio["balances"], quote_asset) || manager.portfolio["balances"][quote_asset] < cost
                return Dict{String, Any}(
                    "success" => false,
                    "message" => "Insufficient balance of $quote_asset"
                )
            end
            
            # Check if this would exceed max position size
            current_size = 0.0
            if haskey(manager.portfolio["positions"], pair)
                current_size = manager.portfolio["positions"][pair]["size"]
            end
            
            if current_size + amount > max_position_size
                return Dict{String, Any}(
                    "success" => false,
                    "message" => "Trade would exceed maximum position size ($max_position_size)"
                )
            end
        elseif trade_type == "sell"
            # Check if we have enough base asset
            if !haskey(manager.portfolio["balances"], base_asset) || manager.portfolio["balances"][base_asset] < amount
                return Dict{String, Any}(
                    "success" => false,
                    "message" => "Insufficient balance of $base_asset"
                )
            end
        end
        
        return Dict{String, Any}(
            "success" => true,
            "message" => "Trade is valid"
        )
    catch e
        return Dict{String, Any}(
            "success" => false,
            "message" => "Failed to validate trade: $(string(e))"
        )
    end
end

"""
    get_portfolio(swarm_id::String)

Get the current portfolio for the specified swarm.
"""
function get_portfolio(swarm_id::String)
    try
        # Check if swarm exists
        if !haskey(SWARM_MANAGERS, swarm_id)
            return Dict{String, Any}(
                "success" => false,
                "message" => "Swarm not found: $swarm_id"
            )
        end
        
        manager = SWARM_MANAGERS[swarm_id]
        
        # Update market prices for positions
        update_positions_prices!(manager)
        
        # Update total portfolio value
        update_portfolio_value!(manager)
        
        return Dict{String, Any}(
            "success" => true,
            "portfolio" => manager.portfolio
        )
    catch e
        return Dict{String, Any}(
            "success" => false,
            "message" => "Failed to get portfolio: $(string(e))"
        )
    end
end

"""
    get_market_data(swarm_id::String)

Get the current market data for the specified swarm.
"""
function get_market_data(swarm_id::String)
    try
        # Check if swarm exists
        if !haskey(SWARM_MANAGERS, swarm_id)
            return Dict{String, Any}(
                "success" => false,
                "message" => "Swarm not found: $swarm_id"
            )
        end
        
        manager = SWARM_MANAGERS[swarm_id]
        
        return Dict{String, Any}(
            "success" => true,
            "market_data" => manager.market_data
        )
    catch e
        return Dict{String, Any}(
            "success" => false,
            "message" => "Failed to get market data: $(string(e))"
        )
    end
end

"""
    update_market_data(swarm_id::String, market_data::Dict{String, Any})

Update market data for the specified swarm.
"""
function update_market_data(swarm_id::String, market_data::Dict{String, Any})
    try
        # Check if swarm exists
        if !haskey(SWARM_MANAGERS, swarm_id)
            return Dict{String, Any}(
                "success" => false,
                "message" => "Swarm not found: $swarm_id"
            )
        end
        
        manager = SWARM_MANAGERS[swarm_id]
        
        # Update market data
        for (pair, data) in market_data
            if !haskey(manager.market_data, pair)
                manager.market_data[pair] = Dict{String, Any}()
            end
            
            # Update fields
            for (key, value) in data
                manager.market_data[pair][key] = value
            end
            
            # Add timestamp if not provided
            if !haskey(manager.market_data[pair], "timestamp")
                manager.market_data[pair]["timestamp"] = now()
            end
        end
        
        # Update positions with new prices
        update_positions_prices!(manager)
        
        # Update total portfolio value
        update_portfolio_value!(manager)
        
        return Dict{String, Any}(
            "success" => true,
            "message" => "Market data updated successfully"
        )
    catch e
        return Dict{String, Any}(
            "success" => false,
            "message" => "Failed to update market data: $(string(e))"
        )
    end
end

# ====================== Helper Functions ======================
"""
    update_positions_prices!(manager::SwarmManager)

Update positions with current market prices.
"""
function update_positions_prices!(manager::SwarmManager)
    for (pair, position) in manager.portfolio["positions"]
        if haskey(manager.market_data, pair) && haskey(manager.market_data[pair], "price")
            position["current_price"] = manager.market_data[pair]["price"]
            
            # Calculate PnL
            entry_price = position["entry_price"]
            current_price = position["current_price"]
            size = position["size"]
            
            pnl = size * (current_price - entry_price)
            position["pnl"] = pnl
        end
    end
end

"""
    update_portfolio_value!(manager::SwarmManager)

Update total portfolio value.
"""
function update_portfolio_value!(manager::SwarmManager)
    total_value = 0.0
    
    # Sum up balances in quote currency (assuming USDC)
    for (asset, balance) in manager.portfolio["balances"]
        if asset == "USDC"
            total_value += balance
        else
            # Convert to USDC using market data
            for (pair, data) in manager.market_data
                if startswith(pair, "$asset/")
                    # Direct pair (e.g. ETH/USDC)
                    total_value += balance * data["price"]
                    break
                elseif endswith(pair, "/$asset")
                    # Inverse pair (e.g. USDC/ETH)
                    total_value += balance / data["price"]
                    break
                end
            end
        end
    end
    
    manager.portfolio["total_value"] = total_value
end

"""
    connect_to_typescript(config::Dict{String, Any})

Connect to TypeScript via bridge.
"""
function connect_to_typescript(config::Dict{String, Any})
    # This would be implemented to connect to the TypeScript side
    # For now, just return success
    return Dict{String, Any}(
        "success" => true,
        "message" => "Connected to TypeScript"
    )
end

"""
    disconnect_from_typescript()

Disconnect from TypeScript.
"""
function disconnect_from_typescript()
    # This would be implemented to disconnect from the TypeScript side
    # For now, just return success
    return Dict{String, Any}(
        "success" => true,
        "message" => "Disconnected from TypeScript"
    )
end

end # module JuliaSwarm 