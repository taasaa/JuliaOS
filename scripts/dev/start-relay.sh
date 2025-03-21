#!/bin/bash

# Exit on error
set -e

echo "Building and starting Julia Bridge relay service..."

# Build TypeScript files
echo "Building TypeScript files..."
npm run build

# Start the relay service
echo "Starting relay service..."
node dist/relay.js 