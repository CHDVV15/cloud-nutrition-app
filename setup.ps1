Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AI Nutrition Assistant Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

Write-Host ""
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
pip install -r requirements.txt
Set-Location ..

Write-Host ""
Write-Host "Creating environment file..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\env.example" "backend\.env"
    Write-Host "Environment file created from template." -ForegroundColor Green
    Write-Host "Please edit backend\.env with your actual configuration." -ForegroundColor Yellow
} else {
    Write-Host "Environment file already exists." -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the development servers:" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "To start only the frontend:" -ForegroundColor White
Write-Host "  npm run dev:frontend" -ForegroundColor Gray
Write-Host ""
Write-Host "To start only the backend:" -ForegroundColor White
Write-Host "  npm run dev:backend" -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend will be available at: http://localhost:5000" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to continue" 