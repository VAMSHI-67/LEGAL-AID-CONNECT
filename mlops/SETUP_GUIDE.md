# MLOps Setup Guide

This guide walks you through setting up the MLOps pipeline for LegalAid Connect.

---

## Prerequisites

- Python 3.9 or 3.10
- Git installed
- Project already running (backend + frontend + ML service)

---

## Step-by-Step Setup

### 1. Install MLOps Dependencies

From the project root:

```powershell
pip install -r mlops/requirements.txt
```

**Expected output:**
```
Successfully installed mlflow-2.14.1 dvc-3.50.2 evidently-0.4.33 ...
```

---

### 2. Initialize DVC (Data Version Control)

```powershell
cd mlops
dvc init --no-scm
cd ..
```

**What this does:**
- Creates `.dvc/` directory in `mlops/`
- Sets up DVC configuration
- `--no-scm` flag prevents DVC from trying to initialize git (already initialized at project root)

---

### 3. Track Dataset with DVC

```powershell
cd mlops
dvc add data/matchmaking_dataset.csv
cd ..
```

**What this does:**
- Creates `mlops/data/matchmaking_dataset.csv.dvc` (metadata file)
- Adds dataset to `.gitignore` (actual data not committed)
- Tracks dataset hash for versioning

**Commit the DVC file:**

```powershell
git add mlops/data/matchmaking_dataset.csv.dvc mlops/data/.gitignore
git commit -m "Track matchmaking dataset with DVC"
```

---

### 4. Test Retraining Pipeline

```powershell
python mlops/scripts/retrain_model.py
```

**Expected output:**
```
Baseline: {'accuracy': 0.9467, 'precision': 0.7206, ...}
Candidate: {'accuracy': 0.9512, 'precision': 0.7389, ...}
Improved: True
```

**Check results:**
- `mlops/tracking/last_metrics.json` - Comparison metrics
- `mlops/models/v<timestamp>/` - Candidate model (if improved)

---

### 5. Start MLflow UI

```powershell
mlflow ui --backend-store-uri file:./mlops/tracking --port 5001
```

**Open browser:** http://localhost:5001

**You should see:**
- Experiment: `LegalAid_Connect_Matchmaking`
- Runs with metrics (accuracy, precision, recall, F1, ROC AUC)
- Artifacts (models, metrics JSON)

---

### 6. Run Evaluation

```powershell
python mlops/scripts/evaluate_model.py
```

**Expected output:**
```
Evaluation metrics: {'accuracy': 0.9467, 'precision': 0.7206, ...}
```

**Check results:**
- `mlops/reports/evaluation_<timestamp>.txt`
- MLflow run in UI

---

### 7. Run Drift Monitoring

```powershell
python mlops/scripts/monitor_model.py
```

**Expected output:**
```
Saved data drift report to mlops/reports/data_drift_report_<timestamp>.html
```

**Open the HTML report:**
```powershell
# Windows
start mlops/reports/data_drift_report_*.html
```

**You should see:**
- Dataset summary statistics
- Feature drift metrics
- Distribution comparisons
- Drift detection results

---

### 8. Verify GitHub Actions (Optional)

**File:** `.github/workflows/mlops.yml`

**To test locally:**

1. Make a change to `mlops/data/matchmaking_dataset.csv`
2. Commit and push:
   ```powershell
   git add mlops/data/matchmaking_dataset.csv.dvc
   git commit -m "Update dataset"
   git push
   ```
3. Check GitHub Actions tab for workflow run

**Or trigger manually:**
- GitHub → Actions → "MLOps Pipeline" → "Run workflow"

---

## Verification Checklist

- [ ] MLOps dependencies installed
- [ ] DVC initialized in `mlops/`
- [ ] Dataset tracked with DVC
- [ ] Retraining script runs successfully
- [ ] MLflow UI accessible at http://localhost:5001
- [ ] Evaluation generates reports
- [ ] Drift monitoring creates HTML reports
- [ ] GitHub Actions workflow file exists

---

## Common Setup Issues

### Issue: `pip install` fails

**Solution:** Use a virtual environment:
```powershell
python -m venv mlops_env
.\mlops_env\Scripts\Activate.ps1
pip install -r mlops/requirements.txt
```

### Issue: DVC commands not found

**Solution:** Ensure DVC is installed:
```powershell
pip install dvc
dvc version
```

### Issue: MLflow UI shows no experiments

**Solution:** Run a script first to create experiments:
```powershell
python mlops/scripts/evaluate_model.py
```

Then refresh MLflow UI.

### Issue: Import errors when running scripts

**Solution:** Always run from project root:
```powershell
# Correct
python mlops/scripts/retrain_model.py

# Wrong
cd mlops
python scripts/retrain_model.py  # Will fail
```

---

## Next Steps

After setup:

1. **Schedule regular retraining:**
   - Weekly: `python mlops/scripts/retrain_model.py`
   - Review MLflow for improvements

2. **Monitor drift:**
   - Weekly: `python mlops/scripts/monitor_model.py`
   - Check HTML reports for data changes

3. **Evaluate production:**
   - Daily: `python mlops/scripts/evaluate_model.py`
   - Track accuracy trends in MLflow

4. **Promote models:**
   - If candidate improves by >2%, manually promote:
     ```powershell
     Copy-Item "mlops/models/v<timestamp>/lawyer_match_model.h5" -Destination "ml_model/lawyer_match_model.h5" -Force
     ```
   - Restart ML service

---

## Advanced Configuration

### Remote DVC Storage (Optional)

Store datasets on cloud:

```powershell
cd mlops
dvc remote add -d myremote s3://my-bucket/dvc-storage
dvc push
cd ..
```

Supported backends: S3, GCS, Azure Blob, SSH, HTTP

### MLflow Remote Tracking (Optional)

Use a remote MLflow server:

```powershell
# Set environment variable
$env:MLFLOW_TRACKING_URI = "https://mlflow.example.com"

# Or modify mlops/mlflow_setup.py
```

### Automated Model Promotion (Future)

Create `mlops/scripts/promote_model.py`:

```python
# Pseudocode
if candidate_accuracy > production_accuracy + 0.02:
    backup_production_model()
    copy_candidate_to_production()
    restart_ml_service()
    notify_team()
```

---

## Support

For help:
1. Check `mlops/README.md` for detailed documentation
2. Review MLflow logs in `mlops/tracking/`
3. Inspect drift reports in `mlops/reports/`

---

**Setup Complete!** 🎉

Your MLOps pipeline is now ready to:
- Track experiments
- Version datasets
- Retrain models safely
- Monitor drift
- Automate workflows

All without touching your production code!
