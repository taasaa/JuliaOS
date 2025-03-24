@echo off
rem Wrapper script for JuliaOS CLI

rem Try to use the globally installed CLI if available
where j3os >nul 2>nul
if %ERRORLEVEL% == 0 (
  j3os %*
) else (
  rem Fall back to the local CLI implementation
  node "%~dp0packages\juliaos-cli\dist\index.js" %*
) 