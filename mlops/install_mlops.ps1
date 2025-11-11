Write-Host "Installing MLOps Dependencies for LegalAid Connect..." -ForegroundColor Green
Write-Host ""

# Check Python version
Write-Host "Checking Python version..." -ForegroundColor Yellow
python --version

Write-Host ""
Write-Host "Installing core MLOps packages..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Cyan
Write-Host ""

# Install in stages to avoid conflicts
Write-Host "[1/4] Installing MLflow..." -ForegroundColor Cyan
pip install mlflow==2.14.1 --quiet

Write-Host "[2/4] Installing Evidently..." -ForegroundColor Cyan
pip install evidently==0.4.33 --quiet

Write-Host "[3/4] Installing DVC (already installed)..." -ForegroundColor Cyan
# DVC already installed

Write-Host "[4/4] Installing remaining dependencies..." -ForegroundColor Cyan
pip install scikit-learn pandas numpy matplotlib seaborn joblib requests PyYAML --quiet

Write-Host ""
Write-Host "✓ MLOps dependencies installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: python mlops/scripts/evaluate_model.py" -ForegroundColor White
Write-Host "2. Run: mlflow ui --backend-store-uri file:./mlops/tracking --port 5001" -ForegroundColor White
Write-Host "3. Open: http://localhost:5001" -ForegroundColor White
Write-Host ""
