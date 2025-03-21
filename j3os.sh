#!/bin/bash
# Wrapper script that forwards all commands to the CLI directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
"$SCRIPT_DIR/cli/j3os.sh" "$@" 