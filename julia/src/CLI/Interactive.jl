module Interactive

using REPL.TerminalMenus
using Printf
using JSON
using Dates
using ProgressMeter
using Crayons
using JuliaOS
using JuliaOS.SwarmManager
using JuliaOS.MarketData
using JuliaOS.Bridge

# Rich terminal UI components
struct ProgressBar
    total::Int
    current::Int
    width::Int
    label::String
end

struct StatusBox
    title::String
    content::Vector{String}
    color::Symbol
end

# Interactive mode functions
function start_interactive_mode()
    setup_command_completion()
    
    println("\nJuliaOS Interactive Mode")
    println("=======================")
    println("Type 'help' for available commands")
    
    while true
        print("\njuliaos> ")
        input = readline()
        
        if input == "exit"
            break
        elseif input == "help"
            show_help()
        else
            handle_command(input)
        end
    end
end

function create_agent_interactive()
    println("\nCreating New Agent")
    println("=================")
    
    # Agent type selection
    agent_types = ["Arbitrage Agent", "Liquidity Provider Agent"]
    type_menu = RadioMenu(agent_types)
    type_choice = request("Select Agent Type:", type_menu)
    
    # Strategy selection
    strategies = STRATEGY_TYPES[agent_types[type_choice]]
    strategy_menu = RadioMenu(strategies)
    strategy_choice = request("Select Strategy:", strategy_menu)
    
    # Chain selection
    chain_menu = MultiSelectMenu(AVAILABLE_CHAINS)
    chain_choices = request("Select Chains (space to select, enter to confirm):", chain_menu)
    
    # Risk parameters
    println("\nRisk Parameters")
    println("---------------")
    risk_params = Dict{String, Any}()
    
    if agent_types[type_choice] == "Arbitrage Agent"
        risk_params["max_position_size"] = parse(Float64, get_user_input("Max Position Size (0.0-1.0): "))
        risk_params["min_profit_threshold"] = parse(Float64, get_user_input("Min Profit Threshold (0.0-1.0): "))
        risk_params["max_gas_price"] = parse(Float64, get_user_input("Max Gas Price: "))
        risk_params["confidence_threshold"] = parse(Float64, get_user_input("Confidence Threshold (0.0-1.0): "))
    else
        risk_params["max_position_size"] = parse(Float64, get_user_input("Max Position Size (0.0-1.0): "))
        risk_params["min_liquidity_depth"] = parse(Float64, get_user_input("Min Liquidity Depth: "))
        risk_params["max_il_threshold"] = parse(Float64, get_user_input("Max Impermanent Loss (0.0-1.0): "))
        risk_params["min_apy_threshold"] = parse(Float64, get_user_input("Min APY (0.0-1.0): "))
        risk_params["rebalance_threshold"] = parse(Float64, get_user_input("Rebalance Threshold (0.0-1.0): "))
    end
    
    # Create agent with progress bar
    println("\nCreating Agent...")
    p = Progress(5, desc="Initializing...")
    
    # Step 1: Validate configuration
    next!(p, desc="Validating configuration...")
    validate_config(risk_params)
    
    # Step 2: Initialize agent
    next!(p, desc="Initializing agent...")
    agent = create_agent(agent_types[type_choice], strategies[strategy_choice], AVAILABLE_CHAINS[chain_choices], risk_params)
    
    # Step 3: Set up monitoring
    next!(p, desc="Setting up monitoring...")
    setup_monitoring(agent)
    
    # Step 4: Connect to chains
    next!(p, desc="Connecting to chains...")
    connect_to_chains(agent, AVAILABLE_CHAINS[chain_choices])
    
    # Step 5: Finalize
    next!(p, desc="Finalizing...")
    finalize_agent(agent)
    
    finish!(p)
    
    println("\nAgent created successfully!")
    println("Name: $(agent.name)")
    println("Type: $(agent.type)")
    println("Strategy: $(agent.strategy)")
    println("Chains: $(join(AVAILABLE_CHAINS[chain_choices], ", "))")
end

function monitor_agents_interactive()
    println("\nMonitoring Active Agents")
    println("=======================")
    
    # Get active agents
    agents = get_active_agents()
    
    if isempty(agents)
        println("No active agents found.")
        return
    end
    
    # Create status boxes for each agent
    status_boxes = StatusBox[]
    for agent in agents
        status = get_agent_status(agent)
        color = status == "Running" ? :green : status == "Warning" ? :yellow : :red
        push!(status_boxes, StatusBox(agent.name, [
            "Status: $status",
            "Type: $(agent.type)",
            "Strategy: $(agent.strategy)",
            "Performance: $(agent.performance)%",
            "Last Update: $(agent.last_update)"
        ], color))
    end
    
    # Display status boxes
    display_status_boxes(status_boxes)
    
    # Show options
    menu = RadioMenu([
        "Refresh Status",
        "View Detailed Logs",
        "Adjust Parameters",
        "Stop Agent",
        "Back to Main Menu"
    ])
    
    while true
        choice = request("Select Action:", menu)
        
        if choice == 1
            # Refresh status
            agents = get_active_agents()
            status_boxes = [create_status_box(agent) for agent in agents]
            display_status_boxes(status_boxes)
        elseif choice == 2
            # View logs
            agent_menu = RadioMenu([box.title for box in status_boxes])
            agent_choice = request("Select Agent:", agent_menu)
            view_agent_logs(agents[agent_choice])
        elseif choice == 3
            # Adjust parameters
            agent_menu = RadioMenu([box.title for box in status_boxes])
            agent_choice = request("Select Agent:", agent_menu)
            adjust_agent_parameters(agents[agent_choice])
        elseif choice == 4
            # Stop agent
            agent_menu = RadioMenu([box.title for box in status_boxes])
            agent_choice = request("Select Agent:", agent_menu)
            stop_agent(agents[agent_choice])
        elseif choice == 5
            break
        end
    end
end

function view_market_data_interactive()
    println("\nMarket Data Dashboard")
    println("=====================")
    
    # Get available pairs
    pairs = get_available_pairs()
    
    # Create pair selection menu
    pair_menu = MultiSelectMenu(pairs)
    selected_pairs = request("Select Trading Pairs (space to select, enter to confirm):", pair_menu)
    
    # Display market data with auto-refresh
    while true
        clear_screen()
        println("\nMarket Data Dashboard")
        println("=====================")
        
        for pair in pairs[selected_pairs]
            data = get_market_data(pair)
            display_market_data(pair, data)
        end
        
        println("\nPress 'q' to quit, 'r' to refresh")
        key = read(stdin, Char)
        
        if key == 'q'
            break
        elseif key == 'r'
            continue
        end
    end
end

function bridge_operations_interactive()
    println("\nBridge Operations")
    println("=================")
    
    while true
        menu = RadioMenu([
            "View Bridge Status",
            "Initiate Cross-Chain Transfer",
            "View Pending Transactions",
            "Cancel Transaction",
            "View Transaction History",
            "Back to Main Menu"
        ])
        
        choice = request("Select Operation:", menu)
        
        if choice == 1
            view_bridge_status()
        elseif choice == 2
            initiate_transfer()
        elseif choice == 3
            view_pending_transactions()
        elseif choice == 4
            cancel_transaction()
        elseif choice == 5
            view_transaction_history()
        elseif choice == 6
            break
        end
    end
end

function view_bridge_status()
    if !Bridge.CONNECTION.is_connected
        Bridge.start_bridge()
    end
    
    status = Bridge.CONNECTION.status
    active_chains = Bridge.CONNECTION.active_chains
    pending_txs = length(Bridge.CONNECTION.pending_transactions)
    
    println("\nBridge Status:")
    println("-------------")
    println("Connection Status: $status")
    println("Active Chains: $(join(active_chains, ", "))")
    println("Pending Transactions: $pending_txs")
    println("Last Update: $(Dates.format(now(), "yyyy-mm-dd HH:MM:SS"))")
    
    # Display chain-specific status
    for chain in active_chains
        chain_status = Bridge.get_chain_status(chain)
        println("\n$chain Status:")
        println("  Connected: $(chain_status["connected"])")
        println("  Block Height: $(chain_status["block_height"])")
        println("  Gas Price: $(chain_status["gas_price"])")
        println("  Network Load: $(chain_status["network_load"])")
    end
end

function initiate_transfer()
    println("\nInitiate Cross-Chain Transfer")
    println("----------------------------")
    
    # Source chain selection
    source_menu = RadioMenu(Bridge.CONNECTION.active_chains)
    source_chain = request("Select Source Chain:", source_menu)
    
    # Destination chain selection
    dest_menu = RadioMenu(filter(chain -> chain != Bridge.CONNECTION.active_chains[source_chain], 
        Bridge.CONNECTION.active_chains))
    dest_chain = request("Select Destination Chain:", dest_menu)
    
    # Token selection
    tokens = Bridge.get_available_tokens(Bridge.CONNECTION.active_chains[source_chain])
    token_menu = RadioMenu(tokens)
    token = request("Select Token:", token_menu)
    
    # Amount input
    amount = parse(Float64, get_user_input("Enter Amount: "))
    
    # Recipient address
    recipient = get_user_input("Enter Recipient Address: ")
    
    # Confirm transaction
    println("\nTransaction Summary:")
    println("  From: $(Bridge.CONNECTION.active_chains[source_chain])")
    println("  To: $(Bridge.CONNECTION.active_chains[dest_chain])")
    println("  Token: $token")
    println("  Amount: $amount")
    println("  Recipient: $recipient")
    
    confirm_menu = RadioMenu(["Confirm", "Cancel"])
    confirm = request("Confirm Transaction:", confirm_menu)
    
    if confirm == 1
        # Show progress bar
        p = Progress(5, desc="Processing transfer...")
        
        # Step 1: Validate transaction
        next!(p, desc="Validating transaction...")
        Bridge.validate_transfer(
            Bridge.CONNECTION.active_chains[source_chain],
            Bridge.CONNECTION.active_chains[dest_chain],
            token,
            amount,
            recipient
        )
        
        # Step 2: Lock tokens
        next!(p, desc="Locking tokens...")
        Bridge.lock_tokens(
            Bridge.CONNECTION.active_chains[source_chain],
            token,
            amount
        )
        
        # Step 3: Initiate transfer
        next!(p, desc="Initiating transfer...")
        tx_hash = Bridge.initiate_transfer(
            Bridge.CONNECTION.active_chains[source_chain],
            Bridge.CONNECTION.active_chains[dest_chain],
            token,
            amount,
            recipient
        )
        
        # Step 4: Wait for confirmation
        next!(p, desc="Waiting for confirmation...")
        Bridge.wait_for_confirmation(tx_hash)
        
        # Step 5: Complete transfer
        next!(p, desc="Completing transfer...")
        Bridge.complete_transfer(tx_hash)
        
        finish!(p)
        
        println("\nTransfer completed successfully!")
        println("Transaction Hash: $tx_hash")
    else
        println("\nTransfer cancelled.")
    end
end

function view_pending_transactions()
    if !Bridge.CONNECTION.is_connected
        Bridge.start_bridge()
    end
    
    pending_txs = Bridge.CONNECTION.pending_transactions
    
    if isempty(pending_txs)
        println("\nNo pending transactions.")
        return
    end
    
    println("\nPending Transactions:")
    println("-------------------")
    
    for (i, tx) in enumerate(pending_txs)
        println("\nTransaction $i:")
        println("  Hash: $(tx["hash"])")
        println("  From: $(tx["from_chain"])")
        println("  To: $(tx["to_chain"])")
        println("  Token: $(tx["token"])")
        println("  Amount: $(tx["amount"])")
        println("  Status: $(tx["status"])")
        println("  Timestamp: $(tx["timestamp"])")
    end
end

function cancel_transaction()
    if !Bridge.CONNECTION.is_connected
        Bridge.start_bridge()
    end
    
    pending_txs = Bridge.CONNECTION.pending_transactions
    
    if isempty(pending_txs)
        println("\nNo pending transactions to cancel.")
        return
    end
    
    # Create menu of pending transactions
    tx_menu = RadioMenu(map(tx -> "$(tx["hash"]) - $(tx["from_chain"]) → $(tx["to_chain"])", pending_txs))
    choice = request("Select Transaction to Cancel:", tx_menu)
    
    if choice != 0
        tx = pending_txs[choice]
        
        # Confirm cancellation
        confirm_menu = RadioMenu(["Confirm", "Cancel"])
        confirm = request("Confirm Cancellation:", confirm_menu)
        
        if confirm == 1
            # Show progress bar
            p = Progress(3, desc="Cancelling transaction...")
            
            # Step 1: Validate cancellation
            next!(p, desc="Validating cancellation...")
            Bridge.validate_cancellation(tx["hash"])
            
            # Step 2: Cancel transaction
            next!(p, desc="Cancelling transaction...")
            Bridge.cancel_transaction(tx["hash"])
            
            # Step 3: Release tokens
            next!(p, desc="Releasing tokens...")
            Bridge.release_tokens(tx["hash"])
            
            finish!(p)
            
            println("\nTransaction cancelled successfully!")
        else
            println("\nCancellation cancelled.")
        end
    end
end

function view_transaction_history()
    println("\nTransaction History")
    println("------------------")
    
    # Get date range
    start_date = get_user_input("Enter Start Date (YYYY-MM-DD): ")
    end_date = get_user_input("Enter End Date (YYYY-MM-DD): ")
    
    # Get transactions
    transactions = Bridge.get_transaction_history(
        parse(Date, start_date),
        parse(Date, end_date)
    )
    
    if isempty(transactions)
        println("\nNo transactions found in the specified date range.")
        return
    end
    
    println("\nTransactions:")
    println("-------------")
    
    for (i, tx) in enumerate(transactions)
        println("\nTransaction $i:")
        println("  Hash: $(tx["hash"])")
        println("  From: $(tx["from_chain"])")
        println("  To: $(tx["to_chain"])")
        println("  Token: $(tx["token"])")
        println("  Amount: $(tx["amount"])")
        println("  Status: $(tx["status"])")
        println("  Timestamp: $(tx["timestamp"])")
        println("  Gas Used: $(tx["gas_used"])")
        println("  Gas Price: $(tx["gas_price"])")
    end
    
    # Show summary
    total_txs = length(transactions)
    successful_txs = count(tx -> tx["status"] == "Completed", transactions)
    failed_txs = count(tx -> tx["status"] == "Failed", transactions)
    
    println("\nSummary:")
    println("  Total Transactions: $total_txs")
    println("  Successful: $successful_txs")
    println("  Failed: $failed_txs")
    println("  Success Rate: $(round(successful_txs/total_txs*100, digits=2))%")
end

# Helper functions
function display_status_boxes(boxes::Vector{StatusBox})
    for box in boxes
        color = box.color == :green ? Crayon(foreground = :green) :
                box.color == :yellow ? Crayon(foreground = :yellow) :
                Crayon(foreground = :red)
        
        println(color, "\n$(box.title)")
        println("=" ^ length(box.title))
        for line in box.content
            println(line)
        end
        println(Crayon(reset = true))
    end
end

function display_market_data(pair::String, data::Dict{String, Any})
    println("\n$pair")
    println("-" ^ length(pair))
    println("Price: $(data["price"])")
    println("24h Change: $(data["change_24h"])%")
    println("Volume: $(data["volume"])")
    println("Liquidity: $(data["liquidity"])")
end

function clear_screen()
    print("\033[2J\033[H")
end

# Command completion and input validation
function get_command_completions(partial::String)
    commands = [
        "create", "monitor", "view", "bridge", "exit",
        "agent", "swarm", "market", "status", "transfer",
        "history", "cancel", "parameters", "logs"
    ]
    
    return filter(cmd -> startswith(cmd, partial), commands)
end

function validate_input(input::String, type::Symbol; min=nothing, max=nothing)
    try
        if type == :float
            value = parse(Float64, input)
            if min !== nothing && value < min
                return false, "Value must be greater than or equal to $min"
            end
            if max !== nothing && value > max
                return false, "Value must be less than or equal to $max"
            end
            return true, value
        elseif type == :int
            value = parse(Int, input)
            if min !== nothing && value < min
                return false, "Value must be greater than or equal to $min"
            end
            if max !== nothing && value > max
                return false, "Value must be less than or equal to $max"
            end
            return true, value
        elseif type == :address
            if !startswith(input, "0x") || length(input) != 42
                return false, "Invalid Ethereum address format"
            end
            return true, input
        elseif type == :date
            try
                value = parse(Date, input, "yyyy-mm-dd")
                return true, value
            catch
                return false, "Invalid date format. Use YYYY-MM-DD"
            end
        else
            return false, "Unknown input type"
        end
    catch
        return false, "Invalid input format"
    end
end

function get_user_input(prompt::String; type::Symbol=:string, min=nothing, max=nothing)
    while true
        print(prompt)
        input = readline()
        
        if type == :string
            return input
        else
            valid, result = validate_input(input, type, min=min, max=max)
            if valid
                return result
            else
                println("Error: ", result)
            end
        end
    end
end

function setup_command_completion()
    # Set up REPL completion
    if isdefined(Main, :REPL)
        REPL.completions(c::REPLCompletionProvider, partial::String) = get_command_completions(partial)
    end
end

function show_help()
    println("\nAvailable Commands:")
    println("------------------")
    println("  create agent    - Create a new trading agent")
    println("  create swarm    - Create a new agent swarm")
    println("  monitor agents  - Monitor active agents")
    println("  view market     - View market data")
    println("  bridge status   - View bridge status")
    println("  bridge transfer - Initiate cross-chain transfer")
    println("  bridge history  - View transaction history")
    println("  exit           - Exit the program")
    println("\nUse TAB for command completion")
end

function handle_command(input::String)
    parts = split(input)
    if isempty(parts)
        return
    end
    
    cmd = parts[1]
    args = parts[2:end]
    
    try
        if cmd == "create"
            if length(args) < 1
                println("Error: Specify what to create (agent/swarm)")
                return
            end
            if args[1] == "agent"
                create_agent_interactive()
            elseif args[1] == "swarm"
                create_swarm_interactive()
            else
                println("Error: Unknown create command")
            end
        elseif cmd == "monitor"
            if length(args) < 1
                println("Error: Specify what to monitor (agents/market)")
                return
            end
            if args[1] == "agents"
                monitor_agents_interactive()
            elseif args[1] == "market"
                view_market_data_interactive()
            else
                println("Error: Unknown monitor command")
            end
        elseif cmd == "view"
            if length(args) < 1
                println("Error: Specify what to view (market/status)")
                return
            end
            if args[1] == "market"
                view_market_data_interactive()
            elseif args[1] == "status"
                view_bridge_status()
            else
                println("Error: Unknown view command")
            end
        elseif cmd == "bridge"
            if length(args) < 1
                println("Error: Specify bridge operation (status/transfer/history)")
                return
            end
            if args[1] == "status"
                view_bridge_status()
            elseif args[1] == "transfer"
                initiate_transfer()
            elseif args[1] == "history"
                view_transaction_history()
            else
                println("Error: Unknown bridge command")
            end
        else
            println("Error: Unknown command")
        end
    catch e
        println("Error: ", e)
    end
end

# Export main functions
export start_interactive_mode, create_agent_interactive, monitor_agents_interactive, view_market_data_interactive

end # module 