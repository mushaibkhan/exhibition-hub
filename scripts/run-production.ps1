# Start production stack (runs deploy/run.ps1 from repo root).
& (Join-Path (Split-Path $PSScriptRoot) "deploy\run.ps1") @args
