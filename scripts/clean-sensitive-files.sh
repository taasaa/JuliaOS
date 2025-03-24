#!/bin/bash
# This script removes sensitive files from git tracking without deleting them from the filesystem
# Run this before pushing to a public repository

echo "Removing sensitive files from git tracking..."

# Environment files
git rm --cached .env 2>/dev/null || true
git rm --cached .env.local 2>/dev/null || true
git rm --cached .env.development 2>/dev/null || true
git rm --cached .env.test 2>/dev/null || true
git rm --cached .env.production 2>/dev/null || true
git rm --cached config/*.env 2>/dev/null || true

# Wallet files
git rm --cached solana-wallet.json 2>/dev/null || true
git rm --cached *-wallet.json 2>/dev/null || true
git rm --cached wallet.json 2>/dev/null || true
git rm --cached *-keypair.json 2>/dev/null || true

# Config files that might contain secrets
git rm --cached config/*.json 2>/dev/null || true
git add config/default_config.json 2>/dev/null || true
git add config/test_config.json 2>/dev/null || true

# Other potentially sensitive files
git rm --cached command.txt 2>/dev/null || true
git rm --cached secrets.json 2>/dev/null || true
git rm --cached credentials.json 2>/dev/null || true

echo "Done! You can now safely push to your public repository."
echo "Remember to check 'git status' to make sure no sensitive files are being committed." 