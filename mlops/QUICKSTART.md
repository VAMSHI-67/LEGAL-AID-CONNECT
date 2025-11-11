# MLOps Quick Start Guide

Get the MLOps pipeline running in 5 minutes.

---

## Step 1: Install Dependencies

```powershell
# Run the installation script
.\mlops\install_mlops.ps1
```

**Or manually:**
```powershell
pip install mlflow evidently scikit-learn pandas numpy matplotlib seaborn joblib
```

---

## Step 2: Test Evaluation

```powershell
python mlops/scripts/evaluate_model.py
```

**Expected output:**
```
Evaluation metrics: {'accuracy': 0.9467, 'precision': 0.7206, ...}
```

**Files created:**
- `mlops/reports/evaluation_<timestamp>.txt`
- `mlops/tracking/eval_<timestamp>.json`

---

## Step 3: Start MLflow UI

```powershell
mlflow ui --backend-store-uri file:./mlops/tracking --port 5001
```

**Open browser:** http://localhost:5001

You'll see:
- Experiment: `LegalAid_Connect_Matchmaking`
- Runs with metrics
- Model artifacts

---

## Step 4: Run Retraining (Optional)

```powershell
python mlops/scripts/retrain_model.py
```

**What happens:**
- Trains a candidate model
- Compares to production
- Saves if improved to `mlops/models/v<timestamp>/`

---

## Step 5: Monitor Drift (Optional)

```powershell
python mlops/scripts/monitor_model.py
```

**Output:**
- `mlops/reports/data_drift_report_<timestamp>.html`

**Open the report:**
```powershell
start mlops/reports/data_drift_report_*.html
```

---

## Common Commands

### View MLflow Experiments
```powershell
mlflow ui --backend-store-uri file:./mlops/tracking --port 5001
```

### Evaluate Production Model
```powershell
python mlops/scripts/evaluate_model.py
```

### Retrain Model
```powershell
python mlops/scripts/retrain_model.py
```

### Check Data Drift
```powershell
python mlops/scripts/monitor_model.py
```

### Run DVC Pipeline
```powershell
cd mlops
python -m dvc repro
cd ..
```

---

## Troubleshooting

### "No module named 'mlflow'"
```powershell
pip install mlflow evidently
```

### "Model not found"
Ensure production model exists:
```powershell
Test-Path ml_model/lawyer_match_model.h5
```

### MLflow UI shows no data
Run evaluation first:
```powershell
python mlops/scripts/evaluate_model.py
```
Then refresh MLflow UI.

---

## What's Next?

1. **Schedule regular runs:**
   - Weekly retraining
   - Daily evaluation
   - Weekly drift monitoring

2. **Set up alerts:**
   - Email on accuracy drop
   - Slack notification on drift

3. **Automate promotion:**
   - Create `promote_model.py` script
   - Auto-deploy if accuracy improves >2%

---

**That's it!** Your MLOps pipeline is ready. 🚀

For detailed documentation, see `mlops/README.md`
