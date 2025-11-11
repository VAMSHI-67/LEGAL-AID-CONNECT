# MLOps Layer for LegalAid Connect

This directory contains a **non-intrusive MLOps pipeline** for the LegalAid Connect matchmaking model. It operates independently from the production system and provides:

✅ **Experiment tracking** (MLflow)  
✅ **Data versioning** (DVC)  
✅ **Automated retraining**  
✅ **Model monitoring** (EvidentlyAI)  
✅ **Performance evaluation**  
✅ **CI/CD automation** (GitHub Actions)

---

## 📁 Directory Structure

```
mlops/
├── data/                          # Dataset snapshots (versioned with DVC)
│   └── matchmaking_dataset.csv    # Training data copy
├── models/                        # Versioned model artifacts
│   └── v<timestamp>/              # Candidate models (if improved)
├── tracking/                      # MLflow experiment logs
│   └── mlruns/                    # MLflow backend store
├── reports/                       # Evaluation and drift reports
│   ├── evaluation_*.txt           # Performance reports
│   └── data_drift_report_*.html   # Evidently drift reports
├── scripts/
│   ├── utils.py                   # Shared utilities
│   ├── retrain_model.py           # Retraining pipeline
│   ├── evaluate_model.py          # Model evaluation
│   └── monitor_model.py           # Data drift monitoring
├── mlflow_setup.py                # MLflow configuration
├── dvc.yaml                       # DVC pipeline definition
└── requirements.txt               # MLOps dependencies
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
pip install -r mlops/requirements.txt
```

### 2. Initialize DVC (Optional - for dataset versioning)

```powershell
cd mlops
dvc init
dvc add data/matchmaking_dataset.csv
git add data/matchmaking_dataset.csv.dvc data/.gitignore
git commit -m "Track dataset with DVC"
cd ..
```

### 3. Run MLflow UI (View Experiments)

```powershell
mlflow ui --backend-store-uri file:./mlops/tracking --port 5001
```

Then open: **http://localhost:5001**

---

## 📊 Core Workflows

### A. Retrain Model

Trains a candidate model and compares it to production:

```powershell
python mlops/scripts/retrain_model.py
```

**What it does:**
- Loads production model, encoder, and scaler from `ml_model/`
- Trains a new candidate model on `mlops/data/matchmaking_dataset.csv`
- Compares accuracy: candidate vs. production
- If improved:
  - Saves to `mlops/models/v<timestamp>/lawyer_match_model.h5`
  - Logs to MLflow with metrics and artifacts
- If not improved: logs metrics only (no model saved)

**Output:**
- `mlops/tracking/last_metrics.json` - Latest comparison
- `mlops/models/v<timestamp>/` - Candidate model (if better)
- MLflow run with full metrics

---

### B. Evaluate Production Model

Evaluates the current production model:

```powershell
python mlops/scripts/evaluate_model.py
```

**What it does:**
- Loads production model from `ml_model/lawyer_match_model.h5`
- Evaluates on test split of `mlops/data/matchmaking_dataset.csv`
- Logs metrics to MLflow
- Generates text report

**Output:**
- `mlops/reports/evaluation_<timestamp>.txt`
- `mlops/tracking/eval_<timestamp>.json`
- MLflow run with evaluation metrics

---

### C. Monitor Data Drift

Detects data drift using EvidentlyAI:

```powershell
python mlops/scripts/monitor_model.py
```

**What it does:**
- Reference data: `mlops/data/matchmaking_dataset.csv` (training snapshot)
- Current data: `mlops/data/current_data.csv` (if exists) or sample
- Generates HTML drift report with visualizations

**Output:**
- `mlops/reports/data_drift_report_<timestamp>.html`

**To monitor live data:**
1. Export recent predictions to `mlops/data/current_data.csv` (same schema)
2. Run monitor script
3. Open HTML report to view drift metrics

---

## 🔄 DVC Pipeline (Optional)

Run the full pipeline with DVC:

```powershell
cd mlops
dvc repro
```

This executes:
1. **train** stage → `retrain_model.py`
2. **evaluate** stage → `evaluate_model.py`

Outputs are tracked and versioned automatically.

---

## 🤖 CI/CD Automation

### GitHub Actions Workflow

**File:** `.github/workflows/mlops.yml`

**Triggers:**
- Push to `mlops/data/**` (new dataset)
- Manual workflow dispatch

**Steps:**
1. Install Python dependencies
2. Run retraining pipeline
3. Run monitoring (drift detection)
4. Run evaluation

**To trigger manually:**
- Go to GitHub → Actions → "MLOps Pipeline" → "Run workflow"

---

## 📈 MLflow Experiment Tracking

### Logged Metrics

For each run, MLflow tracks:
- **accuracy** - Overall correctness
- **precision** - Positive predictive value
- **recall** - True positive rate
- **f1** - Harmonic mean of precision/recall
- **roc_auc** - Area under ROC curve

### Logged Parameters

- `algorithm` - Model type (e.g., "keras_dnn")
- `batch_size` - Training batch size
- `epochs` - Number of training epochs
- `type` - Run type (e.g., "production_eval")

### Logged Artifacts

- `metrics` - JSON file with detailed metrics
- `model` - Candidate model directory (if improved)
- `eval` - Evaluation report

### View Experiments

```powershell
mlflow ui --backend-store-uri file:./mlops/tracking --port 5001
```

Navigate to:
- **Experiments** → `LegalAid_Connect_Matchmaking`
- Compare runs, view metrics, download models

---

## 🔍 Model Promotion Workflow

### Current Process (Manual)

1. Run retraining: `python mlops/scripts/retrain_model.py`
2. Check output: "Improved: True/False"
3. If improved:
   - Review MLflow metrics
   - Test candidate model: `mlops/models/v<timestamp>/lawyer_match_model.h5`
   - Manually copy to production:
     ```powershell
     Copy-Item "mlops/models/v<timestamp>/lawyer_match_model.h5" -Destination "ml_model/lawyer_match_model.h5" -Force
     ```
4. Restart ML service to load new model

### Automated Promotion (Future Enhancement)

Create `mlops/scripts/promote_model.py`:

```python
import shutil
import os
from mlops.scripts.utils import load_production_model, evaluate_model

# Load candidate and production models
# Compare on holdout set
# If candidate wins by threshold (e.g., +2% accuracy):
#   - Backup current production model
#   - Copy candidate to ml_model/
#   - Restart Flask service
```

---

## 📊 Monitoring Dashboard (Optional)

### Option 1: MLflow UI (Local)

```powershell
mlflow ui --backend-store-uri file:./mlops/tracking --port 5001
```

**Features:**
- Experiment comparison
- Metric visualization
- Model registry
- Artifact browser

### Option 2: Deploy MLflow Server (Cloud)

Deploy to Render, Railway, or AWS:

```yaml
# render.yaml example
services:
  - type: web
    name: mlflow-server
    env: python
    buildCommand: pip install mlflow
    startCommand: mlflow server --backend-store-uri sqlite:///mlflow.db --default-artifact-root ./artifacts --host 0.0.0.0 --port 5000
```

Then update `mlops/mlflow_setup.py`:

```python
def get_tracking_uri() -> str:
    return os.getenv("MLFLOW_TRACKING_URI", "file:./mlops/tracking")
```

Set environment variable:
```powershell
$env:MLFLOW_TRACKING_URI = "https://your-mlflow-server.onrender.com"
```

---

## 🛠️ Utilities Reference

### `mlops/scripts/utils.py`

**Functions:**
- `load_dataset()` - Load training data from `mlops/data/` or fallback to `ml_model/`
- `feature_engineer(df)` - Apply feature engineering (same as production)
- `load_production_model()` - Load model, encoder, scaler from `ml_model/`
- `prepare_xy(df, encoder, scaler)` - Preprocess data for model input
- `evaluate_model(model, X, y)` - Calculate metrics (accuracy, precision, recall, F1, ROC AUC)
- `save_json(data, path)` - Save JSON with metrics/logs

---

## 🔐 Best Practices

### Data Management

1. **Never modify production data** - MLOps reads from `ml_model/` but doesn't write
2. **Version datasets** - Use DVC to track `mlops/data/matchmaking_dataset.csv`
3. **Snapshot live data** - Periodically export predictions to `mlops/data/current_data.csv` for drift monitoring

### Model Management

1. **Semantic versioning** - Use timestamps: `v20251108_153000`
2. **Keep production stable** - Only promote after thorough testing
3. **Backup before promotion** - Save old model as `lawyer_match_model_backup.h5`

### Experiment Tracking

1. **Meaningful run names** - Use descriptive names: `retrain_20251108`, `eval_production`
2. **Tag experiments** - Add tags for dataset version, feature changes
3. **Document changes** - Log parameter changes in MLflow

### Monitoring

1. **Regular drift checks** - Run weekly or after major data updates
2. **Set drift thresholds** - Define acceptable drift levels (e.g., <10% feature drift)
3. **Alert on degradation** - Monitor accuracy drops >5%

---

## 🐛 Troubleshooting

### Issue: "Model not found"

**Solution:** Ensure production model exists:
```powershell
Test-Path ml_model/lawyer_match_model.h5
```

### Issue: "No module named 'mlflow'"

**Solution:** Install MLOps dependencies:
```powershell
pip install -r mlops/requirements.txt
```

### Issue: "DVC not initialized"

**Solution:** Initialize DVC in mlops directory:
```powershell
cd mlops
dvc init
cd ..
```

### Issue: "Cannot import from mlops"

**Solution:** Run scripts from project root:
```powershell
# Correct (from project root)
python mlops/scripts/retrain_model.py

# Incorrect (from mlops/)
cd mlops
python scripts/retrain_model.py  # Will fail
```

---

## 📝 Maintenance Schedule

### Daily
- ✅ Check MLflow UI for failed runs
- ✅ Monitor production model accuracy

### Weekly
- ✅ Run drift monitoring: `python mlops/scripts/monitor_model.py`
- ✅ Review drift reports in `mlops/reports/`

### Monthly
- ✅ Retrain model: `python mlops/scripts/retrain_model.py`
- ✅ Compare candidate vs. production
- ✅ Promote if improved by >2%

### Quarterly
- ✅ Review all experiments in MLflow
- ✅ Archive old model versions
- ✅ Update DVC dataset snapshots

---

## 🚀 Future Enhancements

### Phase 1 (Current)
- ✅ MLflow tracking
- ✅ DVC data versioning
- ✅ Retraining pipeline
- ✅ Drift monitoring
- ✅ GitHub Actions CI

### Phase 2 (Planned)
- ⏳ Automated model promotion
- ⏳ A/B testing framework
- ⏳ Real-time monitoring dashboard
- ⏳ Slack/email alerts on drift
- ⏳ Model explainability (SHAP/LIME)

### Phase 3 (Advanced)
- ⏳ Multi-model ensemble
- ⏳ AutoML integration
- ⏳ Feature store
- ⏳ Online learning pipeline
- ⏳ Model serving with Seldon/KServe

---

## 📚 Resources

### Documentation
- [MLflow Docs](https://mlflow.org/docs/latest/index.html)
- [DVC Docs](https://dvc.org/doc)
- [Evidently Docs](https://docs.evidentlyai.com/)

### Tutorials
- [MLflow Tracking](https://mlflow.org/docs/latest/tracking.html)
- [DVC Get Started](https://dvc.org/doc/start)
- [Evidently Tutorials](https://docs.evidentlyai.com/user-guide/tutorials)

---

## 🤝 Contributing

To add new MLOps features:

1. Create feature in `mlops/scripts/`
2. Update `mlops/dvc.yaml` if needed
3. Add to GitHub Actions workflow
4. Document in this README
5. Test without modifying production code

---

## 📞 Support

For MLOps-related issues:
- Check `mlops/tracking/` logs
- Review MLflow UI for run details
- Consult drift reports in `mlops/reports/`

**Remember:** This MLOps layer is **non-intrusive** and operates independently from production. Your main application remains unaffected.

---

**Status:** ✅ MLOps Pipeline Active  
**Last Updated:** November 8, 2025  
**Version:** 1.0.0
