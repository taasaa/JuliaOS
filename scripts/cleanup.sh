#!/bin/bash

# Clean up build artifacts and temporary files
rm -rf dist/
rm -rf build/
rm -rf target/
rm -rf artifacts/
rm -rf cache/
rm -rf typechain-types/
rm -rf .turbo/
rm -rf node_modules/

# Clean up test artifacts
rm -rf test-ledger/
rm -rf test-cli-project/
rm -rf test-project/
rm -f tests.old

# Clean up IDE and OS files
rm -rf .vscode/
rm -f .DS_Store
rm -f **/.DS_Store

# Clean up package manager files
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml

# Clean up sensitive files
rm -f solana-wallet.json
rm -f .env

echo "Repository cleaned successfully!" 