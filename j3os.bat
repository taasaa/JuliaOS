@echo off
rem Wrapper script that forwards all commands to the CLI directory
powershell -ExecutionPolicy Bypass -File "%~dp0cli\j3os.ps1" %* 