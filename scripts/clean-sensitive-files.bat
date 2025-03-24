@echo off
REM This script removes sensitive files from git tracking without deleting them from the filesystem
REM Run this before pushing to a public repository

echo Removing sensitive files from git tracking...

REM Environment files
git rm --cached .env 2>nul
git rm --cached .env.local 2>nul
git rm --cached .env.development 2>nul
git rm --cached .env.test 2>nul
git rm --cached .env.production 2>nul
git rm --cached config/*.env 2>nul

REM Wallet files
git rm --cached solana-wallet.json 2>nul
git rm --cached *-wallet.json 2>nul
git rm --cached wallet.json 2>nul
git rm --cached *-keypair.json 2>nul

REM Config files that might contain secrets
git rm --cached config/*.json 2>nul
git add config/default_config.json 2>nul
git add config/test_config.json 2>nul

REM Other potentially sensitive files
git rm --cached command.txt 2>nul
git rm --cached secrets.json 2>nul
git rm --cached credentials.json 2>nul

echo Done! You can now safely push to your public repository.
echo Remember to check 'git status' to make sure no sensitive files are being committed. 