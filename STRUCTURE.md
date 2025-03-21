# JuliaOS Framework Structure

This document outlines the organization of the JuliaOS Framework repository.

## Directory Structure

```
/
├── packages/                # Shared packages (monorepo)
│   ├── core/                # Core framework
│   ├── protocols/           # Blockchain protocols
│   ├── agents/              # Agent implementations
│   ├── wallets/             # Wallet integrations 
│   ├── platforms/           # Platform integrations
│   └── ...                  # Other packages
│
├── contracts/               # Smart contracts
│   ├── ethereum/            # Ethereum contracts
│   ├── solana/              # Solana contracts
│   └── README.md            # Contracts documentation
│
├── bridges/                 # Bridge implementations
│   ├── relay/               # Relay service
│   ├── solana-bridge/       # Solana bridge
│   ├── ethereum-bridge/     # Ethereum bridge
│   └── README.md            # Bridge documentation
│
├── julia/                   # Julia code
│   ├── src/                 # Julia source code
│   ├── test/                # Julia tests
│   ├── examples/            # Julia examples
│   └── README.md            # Julia documentation
│
├── tests/                   # Tests
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   ├── contracts/           # Contract tests
│   ├── e2e/                 # End-to-end tests
│   └── README.md            # Testing documentation
│
├── docs/                    # Documentation
│   ├── api/                 # API documentation
│   ├── guides/              # User guides
│   └── architecture/        # Architecture documentation
│
├── scripts/                 # Utility scripts
│   ├── deploy/              # Deployment scripts
│   ├── dev/                 # Development scripts
│   └── utilities/           # Utility scripts
│
├── config/                  # Configuration files
│   ├── default.env          # Default environment variables
│   ├── tsconfig.base.json   # Base TypeScript configuration
│   └── README.md            # Configuration documentation
│
└── .github/                 # GitHub workflows and templates
```

## Key Components

### Packages

The `packages` directory contains the core TypeScript/JavaScript libraries organized as a monorepo. Each package has its own `package.json` and can be published independently to npm.

### Contracts

The `contracts` directory contains all smart contracts, organized by blockchain platform.

### Bridges

The `bridges` directory contains all cross-chain bridge implementations, including the relay service.

### Julia

The `julia` directory contains all Julia programming language code, including the swarm optimization algorithms.

### Tests

The `tests` directory contains all test files, organized by test type.

## Development Workflow

1. **Setup**: Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/juliaos/framework.git
   cd framework
   npm install
   ```

2. **Build**: Build all packages:
   ```bash
   npm run build
   ```

3. **Test**: Run tests:
   ```bash
   npm test
   ```

4. **Development**: When developing a specific package:
   ```bash
   cd packages/core
   npm run dev
   ```

5. **CLI**: Use the CLI for project scaffolding:
   ```bash
   npm run cli init my-project
   ``` 