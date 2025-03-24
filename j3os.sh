#!/bin/bash
# Wrapper script that forwards all commands to the CLI implementation

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Try to use the globally installed CLI if available
if command -v j3os &> /dev/null; then
  j3os "$@"
else
  # Fall back to the local CLI implementation
  node "$SCRIPT_DIR/packages/juliaos-cli/dist/index.js" "$@"
fi 