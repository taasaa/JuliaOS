# JuliaOS CLI

This directory contains the implementation of the JuliaOS Command Line Interface (`j3os`), which provides tools for creating and managing AI-powered trading agents and swarms.

## Files

- `j3os.ps1` - PowerShell implementation for Windows
- `j3os.sh` - Bash implementation for Mac/Linux

## Usage

The CLI can be used in two ways:

1. **Through npm** - The CLI is published to npm as `@juliaos/cli` and can be installed globally:
   ```bash
   npm install -g @juliaos/cli
   j3os init my-project
   ```

2. **From Repository** - The CLI is designed to be used through the wrapper scripts in the root directory:
   - `j3os.bat` for Windows
   - `j3os.sh` for Mac/Linux 

## Available Commands

- `j3os init [project-name]` - Create a new JuliaOS project
- `j3os create` - Create a new component (coming soon)
- `j3os version` - Show version information
- `j3os help` - Show help information

## Development

When adding new commands, please update both:
1. The PowerShell implementation (`j3os.ps1`) for Windows users
2. The Bash implementation (`j3os.sh`) for Mac/Linux users

## Publishing

To publish a new version to npm:

1. Update the version number in `package.json`
2. Run `npm publish`

Make sure you have the necessary permissions to publish to the `@juliaos` scope. 