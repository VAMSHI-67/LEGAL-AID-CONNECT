Write-Host "Starting LegalAid Connect Services..." -ForegroundColor Green
Write-Host ""

Write-Host "Starting Backend Server on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run server:dev" -WindowStyle Normal

Write-Host "Waiting 3 seconds for backend to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host "Starting ML Matchmaking Service on port 8000..." -ForegroundColor Yellow
# Ensure Python starts the Flask model API using the primary artifacts (lawyer_match_model.h5, encoder.pkl, scaler.pkl)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python ml_model/predict_model.py" -WindowStyle Normal

Write-Host "Starting Frontend on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Services are starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "ML Service: http://localhost:8000/predict_match" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
