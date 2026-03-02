# Run production stack from repo root. Usage: .\deploy\run.ps1 [.env.production path]
$ErrorActionPreference = "Stop"
$Root = (Get-Item $PSScriptRoot).Parent.FullName
$EnvFile = if ($args[0]) { $args[0] } else { Join-Path $Root ".env.production" }
Set-Location $Root
if (-not (Test-Path $EnvFile)) {
  Write-Host "Missing $EnvFile. Copy deploy/.env.production.example to .env.production and set DB_PASSWORD, JWT_SECRET."
  exit 1
}
docker compose -f deploy/docker-compose.production.yml --env-file $EnvFile up -d
