# Start Libroware Network Development Environment
Write-Host "Starting Libroware Network Development Environment..." -ForegroundColor Green

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Wi-Fi).IPAddress
if (-not $localIP) {
    # Try Ethernet if Wi-Fi is not available
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Ethernet).IPAddress
}

if (-not $localIP) {
    Write-Host "Could not determine local IP address. Using default 192.168.1.X placeholder." -ForegroundColor Yellow
    $localIP = "192.168.1.X"
}

# Update the .env.network file with the actual IP
$envContent = Get-Content -Path "$PSScriptRoot\frontend\.env.network" -Raw
$updatedContent = $envContent -replace "192\.168\.1\.X", $localIP
Set-Content -Path "$PSScriptRoot\frontend\.env.network" -Value $updatedContent

Write-Host "Network configuration updated with IP address: $localIP" -ForegroundColor Cyan

# Start Backend Server
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; node index.js"

# Give the backend a moment to start
Start-Sleep -Seconds 2

# Start Frontend Server in network mode
Write-Host "Starting Frontend Server in network mode..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev:network"

Write-Host "Network development environment started!" -ForegroundColor Green
Write-Host "Backend: http://$localIP:4000/graphql" -ForegroundColor Yellow
Write-Host "Frontend: http://$localIP:3000" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White
Write-Host "You can access the application from other devices on your network using these URLs." -ForegroundColor White 