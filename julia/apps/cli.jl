#!/usr/bin/env julia

module JuliaOSCLI

using ArgParse
using JuliaOS
using JuliaOS.SwarmManager
using JuliaOS.MarketData
using JuliaOS.Bridge
using Dates
using JSON

# Import dashboard module
include("dashboard/app.jl")
using .DeFiDashboard

export main

function parse_commandline()
    s = ArgParseSettings(
        description = "JuliaOS CLI - Command line interface for JuliaOS framework",
        version = "0.1.0",
        add_version = true
    )

    @add_arg_table! s begin
        "dashboard"
            help = "Launch the DeFi trading dashboard web interface"
            action = :command
        "backtest"
            help = "Run a backtest for a trading strategy"
            action = :command
        "optimize"
            help = "Optimize trading parameters using swarm algorithms"
            action = :command
        "info"
            help = "Display information about available modules and algorithms"
            action = :command
        "market"
            help = "Get market data for a trading pair"
            action = :command
        "scaffold"
            help = "Generate a new project using JuliaOS"
            action = :command
    end

    # Sub-commands for dashboard
    @add_arg_table! s["dashboard"] begin
        "--host", "-H"
            help = "Host to bind the dashboard server"
            default = "127.0.0.1"
        "--port", "-p"
            help = "Port for the dashboard server"
            arg_type = Int
            default = 8000
    end

    # Sub-commands for backtest
    @add_arg_table! s["backtest"] begin
        "--algorithm", "-a"
            help = "Swarm algorithm to use (pso, gwo, woa, genetic, aco)"
            default = "pso"
        "--chain", "-c"
            help = "Blockchain to use (ethereum, solana, etc.)"
            default = "ethereum"
        "--dex", "-d"
            help = "DEX to use (uniswap-v3, sushiswap, etc.)"
            default = "uniswap-v3"
        "--pair", "-p"
            help = "Trading pair (e.g., ETH/USDC)"
            default = "ETH/USDC"
        "--days", "-D"
            help = "Number of days of historical data to use"
            arg_type = Int
            default = 30
        "--swarm-size", "-s"
            help = "Size of the swarm"
            arg_type = Int
            default = 100
        "--output", "-o"
            help = "Output file for backtest results (JSON)"
            default = "backtest_results.json"
        "--demo", "-m"
            help = "Run in demo mode with synthetic data"
            action = :store_true
    end

    # Sub-commands for optimize
    @add_arg_table! s["optimize"] begin
        "--algorithm", "-a"
            help = "Swarm algorithm to use (pso, gwo, woa, genetic, aco)"
            default = "pso"
        "--chain", "-c"
            help = "Blockchain to use (ethereum, solana, etc.)"
            default = "ethereum"
        "--dex", "-d"
            help = "DEX to use (uniswap-v3, sushiswap, etc.)"
            default = "uniswap-v3"
        "--pair", "-p"
            help = "Trading pair (e.g., ETH/USDC)"
            default = "ETH/USDC"
        "--days", "-D"
            help = "Number of days of historical data to use"
            arg_type = Int
            default = 30
        "--swarm-size", "-s"
            help = "Size of the swarm"
            arg_type = Int
            default = 100
        "--iterations", "-i"
            help = "Number of iterations to run"
            arg_type = Int
            default = 20
        "--output", "-o"
            help = "Output file for optimization results (JSON)"
            default = "optimize_results.json"
        "--demo", "-m"
            help = "Run in demo mode with synthetic data"
            action = :store_true
    end

    # Sub-commands for market
    @add_arg_table! s["market"] begin
        "--chain", "-c"
            help = "Blockchain to use (ethereum, solana, etc.)"
            default = "ethereum"
        "--dex", "-d"
            help = "DEX to use (uniswap-v3, sushiswap, etc.)"
            default = "uniswap-v3"
        "--pair", "-p"
            help = "Trading pair (e.g., ETH/USDC)"
            default = "ETH/USDC"
        "--days", "-D"
            help = "Number of days of historical data to fetch"
            arg_type = Int
            default = 7
        "--output", "-o"
            help = "Output file for market data (JSON or CSV)"
            default = "market_data.json"
        "--demo", "-m"
            help = "Run in demo mode with synthetic data"
            action = :store_true
    end

    # Sub-commands for scaffold
    @add_arg_table! s["scaffold"] begin
        "--name", "-n"
            help = "Name of the project"
            required = true
        "--type", "-t"
            help = "Project type (web, cli, library)"
            default = "web"
        "--directory", "-d"
            help = "Directory to create the project in"
            default = "."
    end

    return parse_args(s)
end

function cmd_dashboard(args)
    println("Starting DeFi Trading Dashboard...")
    println("Open your browser and go to http://$(args["host"]):$(args["port"])")
    
    # Run the dashboard
    DeFiDashboard.run_dashboard(host=args["host"], port=args["port"])
end

function cmd_backtest(args)
    println("Running backtest with the following parameters:")
    println("  Algorithm: $(args["algorithm"])")
    println("  Chain: $(args["chain"])")
    println("  DEX: $(args["dex"])")
    println("  Pair: $(args["pair"])")
    println("  Days: $(args["days"])")
    println("  Swarm Size: $(args["swarm-size"])")
    println("  Output: $(args["output"])")
    println("  Demo mode: $(args["demo"])")
    
    # Create swarm configuration
    algo_params = Dict{String, Any}(
        "inertia_weight" => 0.7,
        "cognitive_coef" => 1.5,
        "social_coef" => 1.5
    )
    
    swarm_config = SwarmManager.SwarmConfig(
        "backtest_swarm",
        args["swarm-size"],
        args["algorithm"],
        [args["pair"]],
        algo_params
    )
    
    # Get historical data
    historical_data = Vector{MarketData.MarketDataPoint}()
    
    if args["demo"]
        println("Using synthetic data for demo mode...")
        historical_data = DeFiDashboard.generate_synthetic_data(args["pair"], args["days"])
    else
        println("Fetching historical data...")
        if !Bridge.CONNECTION.is_connected
            Bridge.start_bridge()
        end
        
        historical_data = MarketData.fetch_historical(
            args["chain"], args["dex"], args["pair"];
            days=args["days"], interval="1h"
        )
    end
    
    println("Creating and initializing swarm...")
    
    # Create and initialize swarm
    swarm = SwarmManager.create_swarm(swarm_config, args["chain"], args["dex"])
    SwarmManager.start_swarm!(swarm, historical_data)
    
    println("Creating trading strategy...")
    
    # Create strategy for backtesting
    strategy = SwarmManager.create_trading_strategy(
        swarm, 
        "0xDemoWallet", 
        max_position_size=0.1
    )
    
    println("Running backtest...")
    
    # Run backtest
    backtest_results = SwarmManager.backtest_strategy(
        strategy, historical_data
    )
    
    # Get optimized parameters
    best_position = SwarmManager.get_best_position(swarm.algorithm)
    
    # Format results
    result = Dict{String, Any}(
        "portfolio_value" => backtest_results["portfolio_value"],
        "total_return" => backtest_results["total_return"] * 100,
        "win_rate" => backtest_results["win_rate"] * 100,
        "max_drawdown" => backtest_results["max_drawdown"] * 100,
        "sharpe_ratio" => backtest_results["sharpe_ratio"],
        "trade_count" => backtest_results["trade_count"],
        "optimized_parameters" => Dict(
            "entry_threshold" => best_position[1],
            "exit_threshold" => best_position[2],
            "stop_loss" => best_position[3] * 100,
            "take_profit" => best_position[4] * 100
        )
    )
    
    # Print summary
    println("\nBacktest Results:")
    println("  Portfolio Value: \$$(round(result["portfolio_value"], digits=2))")
    println("  Total Return: $(round(result["total_return"], digits=2))%")
    println("  Win Rate: $(round(result["win_rate"], digits=2))%")
    println("  Max Drawdown: $(round(result["max_drawdown"], digits=2))%")
    println("  Sharpe Ratio: $(round(result["sharpe_ratio"], digits=2))")
    println("  Trade Count: $(result["trade_count"])")
    println("\nOptimized Parameters:")
    println("  Entry Threshold: $(round(result["optimized_parameters"]["entry_threshold"], digits=2))")
    println("  Exit Threshold: $(round(result["optimized_parameters"]["exit_threshold"], digits=2))")
    println("  Stop Loss: $(round(result["optimized_parameters"]["stop_loss"], digits=2))%")
    println("  Take Profit: $(round(result["optimized_parameters"]["take_profit"], digits=2))%")
    
    # Save results to file
    open(args["output"], "w") do io
        JSON.print(io, result, 4)
    end
    
    println("\nResults saved to $(args["output"])")
end

function cmd_optimize(args)
    println("Optimizing trading parameters with the following settings:")
    println("  Algorithm: $(args["algorithm"])")
    println("  Chain: $(args["chain"])")
    println("  DEX: $(args["dex"])")
    println("  Pair: $(args["pair"])")
    println("  Days: $(args["days"])")
    println("  Swarm Size: $(args["swarm-size"])")
    println("  Iterations: $(args["iterations"])")
    println("  Output: $(args["output"])")
    println("  Demo mode: $(args["demo"])")
    
    # Get historical data
    historical_data = Vector{MarketData.MarketDataPoint}()
    
    if args["demo"]
        println("Using synthetic data for demo mode...")
        historical_data = DeFiDashboard.generate_synthetic_data(args["pair"], args["days"])
    else
        println("Fetching historical data...")
        if !Bridge.CONNECTION.is_connected
            Bridge.start_bridge()
        end
        
        historical_data = MarketData.fetch_historical(
            args["chain"], args["dex"], args["pair"];
            days=args["days"], interval="1h"
        )
    end
    
    # Run optimization with multiple algorithm configurations
    results = Dict{String, Any}()
    
    for algorithm in ["pso", "gwo", "woa", "genetic"]
        println("\nOptimizing with $algorithm algorithm...")
        
        # Create swarm configuration
        algo_params = if algorithm == "pso"
            Dict("inertia_weight" => 0.7, "cognitive_coef" => 1.5, "social_coef" => 1.5)
        elseif algorithm == "gwo"
            Dict("alpha_param" => 2.0, "decay_rate" => 0.01)
        elseif algorithm == "woa"
            Dict("a_decrease_factor" => 2.0, "spiral_constant" => 1.0)
        elseif algorithm == "genetic"
            Dict("crossover_rate" => 0.8, "mutation_rate" => 0.1, "elitism_count" => 2)
        else
            Dict{String, Any}()
        end
        
        swarm_config = SwarmManager.SwarmConfig(
            "$(algorithm)_swarm",
            args["swarm-size"],
            algorithm,
            [args["pair"]],
            algo_params
        )
        
        # Create and initialize swarm
        swarm = SwarmManager.create_swarm(swarm_config, args["chain"], args["dex"])
        SwarmManager.start_swarm!(swarm, historical_data)
        
        # Run iterations
        convergence = []
        for i in 1:args["iterations"]
            print("  Iteration $i/$(args["iterations"]): ")
            
            # Update swarm positions
            SwarmManager.update_swarm!(swarm, historical_data)
            
            # Get best fitness
            best_fitness = SwarmManager.get_best_fitness(swarm.algorithm)
            push!(convergence, best_fitness)
            
            # Get best position
            best_position = SwarmManager.get_best_position(swarm.algorithm)
            
            println("best fitness = $(round(-best_fitness, digits=4))")
        end
        
        # Store results
        results[algorithm] = Dict(
            "best_position" => SwarmManager.get_best_position(swarm.algorithm),
            "best_fitness" => -SwarmManager.get_best_fitness(swarm.algorithm),
            "convergence" => convergence
        )
    end
    
    # Determine best algorithm
    best_algorithm = ""
    best_fitness = -Inf
    
    for (algo, result) in results
        if result["best_fitness"] > best_fitness
            best_fitness = result["best_fitness"]
            best_algorithm = algo
        end
    end
    
    # Format for output
    output_results = Dict{String, Any}(
        "best_algorithm" => best_algorithm,
        "algorithms" => Dict{String, Any}()
    )
    
    for (algo, result) in results
        bp = result["best_position"]
        output_results["algorithms"][algo] = Dict(
            "fitness" => result["best_fitness"],
            "parameters" => Dict(
                "entry_threshold" => bp[1],
                "exit_threshold" => bp[2],
                "stop_loss" => bp[3] * 100,
                "take_profit" => bp[4] * 100
            )
        )
    end
    
    # Print summary
    println("\nOptimization Results:")
    println("  Best Algorithm: $(output_results["best_algorithm"])")
    println("\nAlgorithm Comparison:")
    
    for (algo, result) in output_results["algorithms"]
        println("  $algo:")
        println("    Fitness: $(round(result["fitness"], digits=4))")
        println("    Entry Threshold: $(round(result["parameters"]["entry_threshold"], digits=2))")
        println("    Exit Threshold: $(round(result["parameters"]["exit_threshold"], digits=2))")
        println("    Stop Loss: $(round(result["parameters"]["stop_loss"], digits=2))%")
        println("    Take Profit: $(round(result["parameters"]["take_profit"], digits=2))%")
    end
    
    # Save results to file
    open(args["output"], "w") do io
        JSON.print(io, output_results, 4)
    end
    
    println("\nResults saved to $(args["output"])")
end

function cmd_info()
    println("JuliaOS Framework Information")
    println("=============================")
    println("\nAvailable Modules:")
    println("  • SwarmManager - Manage swarm intelligence algorithms for trading")
    println("  • MarketData - Fetch and analyze market data from various chains and DEXes")
    println("  • Bridge - Bridge between Julia and TypeScript/JavaScript code")
    
    println("\nSupported Swarm Algorithms:")
    println("  • PSO (Particle Swarm Optimization) - General-purpose optimization")
    println("  • GWO (Grey Wolf Optimizer) - Adapts well to changing market conditions")
    println("  • WOA (Whale Optimization Algorithm) - Handles volatility well")
    println("  • Genetic Algorithm - Discovers novel trading rule combinations")
    println("  • ACO (Ant Colony Optimization) - Path-dependent strategies")
    
    println("\nSupported Chains:")
    println("  • Ethereum")
    println("  • Solana")
    println("  • Avalanche")
    println("  • Polygon")
    
    println("\nSupported DEXes:")
    println("  • Uniswap V3 (Ethereum)")
    println("  • SushiSwap (Multiple chains)")
    println("  • Raydium (Solana)")
    println("  • TraderJoe (Avalanche)")
    println("  • QuickSwap (Polygon)")
    
    println("\nAvailable Use Cases:")
    println("  • DeFi Trading Dashboard - Web interface for trading strategy development")
    println("  • Backtest - Run backtests for trading strategies")
    println("  • Optimize - Optimize trading parameters using swarm algorithms")
    println("  • Market Data Analysis - Fetch and analyze market data")
end

function cmd_market(args)
    println("Fetching market data with the following parameters:")
    println("  Chain: $(args["chain"])")
    println("  DEX: $(args["dex"])")
    println("  Pair: $(args["pair"])")
    println("  Days: $(args["days"])")
    println("  Output: $(args["output"])")
    println("  Demo mode: $(args["demo"])")
    
    # Get historical data
    historical_data = Vector{MarketData.MarketDataPoint}()
    
    if args["demo"]
        println("Using synthetic data for demo mode...")
        historical_data = DeFiDashboard.generate_synthetic_data(args["pair"], args["days"])
    else
        println("Fetching historical data...")
        if !Bridge.CONNECTION.is_connected
            Bridge.start_bridge()
        end
        
        historical_data = MarketData.fetch_historical(
            args["chain"], args["dex"], args["pair"];
            days=args["days"], interval="1h"
        )
    end
    
    # Format data for output
    formatted_data = []
    
    for point in historical_data
        push!(formatted_data, Dict(
            "timestamp" => Dates.format(point.timestamp, "yyyy-mm-dd HH:MM:SS"),
            "chain" => point.chain,
            "dex" => point.dex,
            "pair" => point.pair,
            "price" => point.price,
            "volume" => point.volume,
            "liquidity" => point.liquidity,
            "indicators" => point.indicators
        ))
    end
    
    # Save to file
    output_ext = lowercase(split(args["output"], ".")[end])
    
    if output_ext == "json"
        # Save as JSON
        open(args["output"], "w") do io
            JSON.print(io, formatted_data, 4)
        end
    elseif output_ext == "csv"
        # Save as CSV
        open(args["output"], "w") do io
            # Write header
            println(io, "timestamp,chain,dex,pair,price,volume,liquidity,rsi,sma_20,sma_50")
            
            # Write data
            for point in formatted_data
                # Extract indicators or use default values
                rsi = get(point["indicators"], "rsi", "")
                sma_20 = get(point["indicators"], "sma_20", "")
                sma_50 = get(point["indicators"], "sma_50", "")
                
                println(io, "$(point["timestamp"]),$(point["chain"]),$(point["dex"]),$(point["pair"]),$(point["price"]),$(point["volume"]),$(point["liquidity"]),$rsi,$sma_20,$sma_50")
            end
        end
    else
        # Default to JSON
        open("$(split(args["output"], ".")[1]).json", "w") do io
            JSON.print(io, formatted_data, 4)
        end
    end
    
    # Print summary
    println("\nMarket Data Summary:")
    println("  Total Data Points: $(length(historical_data))")
    println("  Date Range: $(Dates.format(historical_data[1].timestamp, "yyyy-mm-dd")) to $(Dates.format(historical_data[end].timestamp, "yyyy-mm-dd"))")
    println("  Price Range: \$$(round(minimum([p.price for p in historical_data]), digits=2)) to \$$(round(maximum([p.price for p in historical_data]), digits=2))")
    println("  Average Volume: \$$(round(mean([p.volume for p in historical_data]), digits=2))")
    println("\nData saved to $(args["output"])")
end

function cmd_scaffold(args)
    println("Scaffolding new project with the following parameters:")
    println("  Name: $(args["name"])")
    println("  Type: $(args["type"])")
    println("  Directory: $(args["directory"])")
    
    # Create project directory
    project_dir = joinpath(args["directory"], args["name"])
    
    if isdir(project_dir)
        println("Error: Directory already exists: $project_dir")
        return
    end
    
    mkpath(project_dir)
    
    # Create Project.toml
    open(joinpath(project_dir, "Project.toml"), "w") do io
        println(io, "name = \"$(args["name"])\"")
        println(io, "version = \"0.1.0\"")
        println(io, "")
        println(io, "[deps]")
        println(io, "JuliaOS = \"8f9c0c1a-3c4b-4c5c-9c6a-3c4b4c5c9c6a\"")
        
        if args["type"] == "web"
            println(io, "GenieFramework = \"a59fdf5c-6bf0-4f5d-949c-a137c9e2f353\"")
            println(io, "Genie = \"c43c736e-a2d1-11e8-161f-af95117fbd1e\"")
        elseif args["type"] == "cli"
            println(io, "ArgParse = \"c7e460c6-2fb9-53a9-8c5b-16f535851c63\"")
        end
        
        println(io, "JSON = \"682c06a0-de6a-54ab-a142-c8b1cf79cde6\"")
        println(io, "Dates = \"ade2ca70-3891-5945-98fb-dc099432e06a\"")
        println(io, "")
    end
    
    # Create main file
    if args["type"] == "web"
        # Create app.jl for web app
        open(joinpath(project_dir, "app.jl"), "w") do io
            println(io, "using GenieFramework")
            println(io, "using JuliaOS")
            println(io, "using JuliaOS.SwarmManager")
            println(io, "using JuliaOS.MarketData")
            println(io, "using JuliaOS.Bridge")
            println(io, "")
            println(io, "@genietools")
            println(io, "")
            println(io, "@app begin")
            println(io, "    # Define your app model here")
            println(io, "    @in chain = \"ethereum\"")
            println(io, "    @out message = \"Hello from JuliaOS!\"")
            println(io, "end")
            println(io, "")
            println(io, "# Define UI components")
            println(io, "ui() = [")
            println(io, "    h1(\"$(args["name"])\")") 
            println(io, "    p(\"This is a JuliaOS web application.\")")
            println(io, "    p(:message)")
            println(io, "]")
            println(io, "")
            println(io, "@page(\"/\", ui)")
            println(io, "")
            println(io, "# Start the app")
            println(io, "if abspath(PROGRAM_FILE) == @__FILE__")
            println(io, "    Genie.AppServer.startup()")
            println(io, "end")
        end
    elseif args["type"] == "cli"
        # Create cli.jl for CLI app
        open(joinpath(project_dir, "cli.jl"), "w") do io
            println(io, "#!/usr/bin/env julia")
            println(io, "")
            println(io, "using ArgParse")
            println(io, "using JuliaOS")
            println(io, "using JuliaOS.SwarmManager")
            println(io, "using JuliaOS.MarketData")
            println(io, "using JuliaOS.Bridge")
            println(io, "")
            println(io, "function parse_commandline()")
            println(io, "    s = ArgParseSettings(")
            println(io, "        description = \"$(args["name"]) CLI\"")
            println(io, "    )")
            println(io, "")
            println(io, "    @add_arg_table! s begin")
            println(io, "        \"run\"")
            println(io, "            help = \"Run the application\"")
            println(io, "            action = :command")
            println(io, "    end")
            println(io, "")
            println(io, "    return parse_args(s)")
            println(io, "end")
            println(io, "")
            println(io, "function main()")
            println(io, "    args = parse_commandline()")
            println(io, "")
            println(io, "    if args[\"%COMMAND%\"] == \"run\"")
            println(io, "        println(\"Running $(args["name"])...\")")
            println(io, "    end")
            println(io, "end")
            println(io, "")
            println(io, "if abspath(PROGRAM_FILE) == @__FILE__")
            println(io, "    main()")
            println(io, "end")
        end
    else
        # Create src directory and main file for library
        mkpath(joinpath(project_dir, "src"))
        
        open(joinpath(project_dir, "src", "$(args["name"]).jl"), "w") do io
            println(io, "module $(args["name"])")
            println(io, "")
            println(io, "using JuliaOS")
            println(io, "using JuliaOS.SwarmManager")
            println(io, "using JuliaOS.MarketData")
            println(io, "using JuliaOS.Bridge")
            println(io, "")
            println(io, "export hello")
            println(io, "")
            println(io, "function hello()")
            println(io, "    return \"Hello from $(args["name"])!\"")
            println(io, "end")
            println(io, "")
            println(io, "end # module")
        end
    end
    
    # Create README.md
    open(joinpath(project_dir, "README.md"), "w") do io
        println(io, "# $(args["name"])")
        println(io, "")
        println(io, "A JuliaOS $(args["type"]) project.")
        println(io, "")
        println(io, "## Installation")
        println(io, "")
        println(io, "```bash")
        println(io, "# Clone the repository")
        println(io, "git clone <repository-url>")
        println(io, "cd $(args["name"])")
        println(io, "")
        println(io, "# Install dependencies")
        println(io, "julia --project -e 'using Pkg; Pkg.instantiate()'")
        println(io, "```")
        println(io, "")
        println(io, "## Usage")
        println(io, "")
        
        if args["type"] == "web"
            println(io, "```bash")
            println(io, "# Start the web app")
            println(io, "julia --project app.jl")
            println(io, "```")
            println(io, "")
            println(io, "Then open your browser and navigate to `http://localhost:8000`.")
        elseif args["type"] == "cli"
            println(io, "```bash")
            println(io, "# Run the CLI app")
            println(io, "julia --project cli.jl run")
            println(io, "```")
        else
            println(io, "```julia")
            println(io, "using $(args["name"])")
            println(io, "")
            println(io, "# Use the library functions")
            println(io, "println(hello())")
            println(io, "```")
        end
    end
    
    println("\nProject scaffolded successfully in $project_dir")
end

function main()
    args = parse_commandline()

    if isempty(args)
        println("No command specified. Use --help to see available commands.")
        return
    end

    if args["%COMMAND%"] == "dashboard"
        cmd_dashboard(args["dashboard"])
    elseif args["%COMMAND%"] == "backtest"
        cmd_backtest(args["backtest"])
    elseif args["%COMMAND%"] == "optimize"
        cmd_optimize(args["optimize"])
    elseif args["%COMMAND%"] == "info"
        cmd_info()
    elseif args["%COMMAND%"] == "market"
        cmd_market(args["market"])
    elseif args["%COMMAND%"] == "scaffold"
        cmd_scaffold(args["scaffold"])
    end
end

if abspath(PROGRAM_FILE) == @__FILE__
    main()
end

end # module

using .JuliaOSCLI

JuliaOSCLI.main() 