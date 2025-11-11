# MLOps Architecture

Visual overview of the MLOps pipeline for LegalAid Connect.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LegalAid Connect Project                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │   Production     │         │   MLOps Layer    │             │
│  │   (Unchanged)    │         │  (New, Isolated) │             │
│  └──────────────────┘         └──────────────────┘             │
│           │                             │                        │
│           │                             │                        │
│  ┌────────▼────────┐         ┌─────────▼────────┐             │
│  │  ml_model/      │         │  mlops/          │             │
│  │  ├─ *.h5        │◄────────│  ├─ data/        │             │
│  │  ├─ *.pkl       │ (reads) │  ├─ models/      │             │
│  │  └─ predict.py  │         │  ├─ tracking/    │             │
│  └─────────────────┘         │  ├─ reports/     │             │
│           │                   │  └─ scripts/     │             │
│           │                   └──────────────────┘             │
│           │                             │                        │
│  ┌────────▼────────┐         ┌─────────▼────────┐             │
│  │  Flask Service  │         │  MLflow UI       │             │
│  │  Port: 8000     │         │  Port: 5001      │             │
│  └─────────────────┘         └──────────────────┘             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Production Flow (Unchanged)
```
User Request
    ↓
Backend API (Node.js)
    ↓
Flask ML Service (Port 8000)
    ↓
Production Model (ml_model/lawyer_match_model.h5)
    ↓
Prediction Response
```

### MLOps Flow (Parallel)
```
New Dataset
    ↓
DVC Track (mlops/data/)
    ↓
Retrain Script (mlops/scripts/retrain_model.py)
    ↓
├─ Load Production Model (read-only)
├─ Train Candidate Model
├─ Compare Metrics
└─ Log to MLflow
    ↓
MLflow Tracking (mlops/tracking/)
    ↓
If Improved: Save to mlops/models/v<timestamp>/
    ↓
Manual Review via MLflow UI
    ↓
Promote to Production (manual copy)
```

---

## Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                      MLOps Components                        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   MLflow     │    │     DVC      │    │  Evidently   │
│  Tracking    │    │  Versioning  │    │  Monitoring  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Experiments  │    │   Dataset    │    │ Drift Report │
│   Metrics    │    │   Versions   │    │     HTML     │
│  Artifacts   │    │   Metadata   │    │  Statistics  │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## Script Dependencies

```
retrain_model.py
    │
    ├─ imports: mlflow_setup.py
    ├─ imports: utils.py
    │   └─ loads: production model (ml_model/)
    │   └─ loads: dataset (mlops/data/)
    │
    ├─ outputs: mlops/models/v<timestamp>/
    └─ logs: mlflow (mlops/tracking/)

evaluate_model.py
    │
    ├─ imports: mlflow_setup.py
    ├─ imports: utils.py
    │   └─ loads: production model (ml_model/)
    │   └─ loads: dataset (mlops/data/)
    │
    ├─ outputs: mlops/reports/evaluation_*.txt
    └─ logs: mlflow (mlops/tracking/)

monitor_model.py
    │
    ├─ imports: utils.py
    │   └─ loads: dataset (mlops/data/)
    │
    └─ outputs: mlops/reports/data_drift_report_*.html
```

---

## File System Layout

```
project/
│
├── ml_model/                    # Production (unchanged)
│   ├── lawyer_match_model.h5   # Primary model
│   ├── encoder.pkl              # Preprocessor
│   ├── scaler.pkl               # Preprocessor
│   ├── predict_model.py         # Flask service
│   ├── train_model.py           # Training script
│   └── matchmaking_dataset.csv  # Original data
│
├── mlops/                       # MLOps layer (new)
│   │
│   ├── data/                    # Versioned datasets
│   │   ├── matchmaking_dataset.csv
│   │   └── matchmaking_dataset.csv.dvc
│   │
│   ├── models/                  # Candidate models
│   │   └── v<timestamp>/
│   │       └── lawyer_match_model.h5
│   │
│   ├── tracking/                # MLflow logs
│   │   ├── mlruns/
│   │   ├── last_metrics.json
│   │   └── eval_*.json
│   │
│   ├── reports/                 # Generated reports
│   │   ├── evaluation_*.txt
│   │   └── data_drift_report_*.html
│   │
│   ├── scripts/                 # MLOps scripts
│   │   ├── retrain_model.py
│   │   ├── evaluate_model.py
│   │   ├── monitor_model.py
│   │   └── utils.py
│   │
│   ├── mlflow_setup.py          # MLflow config
│   ├── dvc.yaml                 # DVC pipeline
│   └── requirements.txt         # Dependencies
│
├── backend/                     # Backend (unchanged)
├── src/                         # Frontend (unchanged)
└── .github/workflows/           # CI/CD
    └── mlops.yml                # MLOps automation
```

---

## Execution Flow

### Retraining Pipeline

```
START
  │
  ├─ Load dataset from mlops/data/
  │
  ├─ Load production model from ml_model/
  │
  ├─ Split data (train/test)
  │
  ├─ Train candidate model
  │
  ├─ Evaluate both models
  │
  ├─ Compare metrics
  │
  ├─ Log to MLflow
  │
  ├─ If improved:
  │   └─ Save to mlops/models/v<timestamp>/
  │
  └─ END
```

### Evaluation Pipeline

```
START
  │
  ├─ Load dataset from mlops/data/
  │
  ├─ Load production model from ml_model/
  │
  ├─ Split data (train/test)
  │
  ├─ Evaluate on test set
  │
  ├─ Calculate metrics
  │
  ├─ Log to MLflow
  │
  ├─ Save report to mlops/reports/
  │
  └─ END
```

### Monitoring Pipeline

```
START
  │
  ├─ Load reference data (training snapshot)
  │
  ├─ Load current data (recent predictions)
  │
  ├─ Compare distributions
  │
  ├─ Detect drift
  │
  ├─ Generate HTML report
  │
  ├─ Save to mlops/reports/
  │
  └─ END
```

---

## GitHub Actions Workflow

```
Trigger: Push to mlops/data/** OR Manual Dispatch
  │
  ├─ Checkout code
  │
  ├─ Setup Python 3.10
  │
  ├─ Install dependencies (mlops/requirements.txt)
  │
  ├─ Run retrain_model.py
  │   └─ Logs experiments to mlops/tracking/
  │
  ├─ Run monitor_model.py
  │   └─ Generates drift report
  │
  ├─ Run evaluate_model.py
  │   └─ Evaluates production model
  │
  └─ END
```

---

## MLflow Tracking Structure

```
MLflow Tracking URI: file:./mlops/tracking
  │
  └─ Experiment: LegalAid_Connect_Matchmaking
      │
      ├─ Run: retrain_20251108_150000
      │   ├─ Metrics: accuracy, precision, recall, f1, roc_auc
      │   ├─ Params: algorithm, batch_size, epochs
      │   ├─ Tags: timestamp
      │   └─ Artifacts: metrics.json, model/
      │
      ├─ Run: evaluate_20251108_151000
      │   ├─ Metrics: accuracy, precision, recall, f1, roc_auc
      │   ├─ Params: type=production_eval
      │   └─ Artifacts: eval.json
      │
      └─ Run: retrain_20251108_152000
          └─ ...
```

---

## DVC Pipeline Structure

```
dvc.yaml
  │
  ├─ Stage: train
  │   ├─ Command: python mlops/scripts/retrain_model.py
  │   ├─ Dependencies:
  │   │   ├─ mlops/scripts/retrain_model.py
  │   │   ├─ mlops/scripts/utils.py
  │   │   └─ mlops/data/matchmaking_dataset.csv
  │   ├─ Outputs:
  │   │   └─ mlops/models/
  │   └─ Metrics:
  │       └─ mlops/tracking/last_metrics.json
  │
  └─ Stage: evaluate
      ├─ Command: python mlops/scripts/evaluate_model.py
      ├─ Dependencies:
      │   ├─ mlops/scripts/evaluate_model.py
      │   ├─ mlops/scripts/utils.py
      │   └─ mlops/models/
      └─ Outputs:
          └─ mlops/reports/
```

---

## Integration Points

### Read-Only Access to Production
```
mlops/scripts/*.py
    │
    └─ Reads (never writes):
        ├─ ml_model/lawyer_match_model.h5
        ├─ ml_model/encoder.pkl
        └─ ml_model/scaler.pkl
```

### Isolated Outputs
```
mlops/scripts/*.py
    │
    └─ Writes to (isolated):
        ├─ mlops/models/
        ├─ mlops/tracking/
        └─ mlops/reports/
```

### No Cross-Contamination
```
Production Files          MLOps Files
    (ml_model/)    ◄───X───►    (mlops/)
        │                           │
        │                           │
   Flask Service              MLflow UI
   (Port 8000)               (Port 5001)
```

---

## Security & Safety

### Isolation Guarantees

1. **File System Isolation**
   - MLOps reads from `ml_model/` (read-only)
   - MLOps writes to `mlops/` only
   - No cross-directory writes

2. **Process Isolation**
   - Flask service (production) runs independently
   - MLflow UI (monitoring) runs on different port
   - No shared state between services

3. **Data Isolation**
   - Production data in `ml_model/`
   - MLOps data in `mlops/data/`
   - DVC tracks only MLOps data

4. **Model Isolation**
   - Production model: `ml_model/lawyer_match_model.h5`
   - Candidate models: `mlops/models/v<timestamp>/`
   - Manual promotion required

---

## Scalability Considerations

### Current Setup (Local)
- MLflow tracking: Local file system
- DVC storage: Local directory
- Suitable for: Single developer, small team

### Future Scaling (Cloud)
- MLflow tracking: Remote server (AWS/Azure/GCP)
- DVC storage: S3/GCS/Azure Blob
- Suitable for: Large team, production scale

---

**Architecture Complete!** 🏗️

This architecture ensures:
- ✅ Complete isolation from production
- ✅ Safe experimentation
- ✅ Easy monitoring
- ✅ Scalable design
- ✅ Clear data flow

---

**Last Updated:** November 8, 2025  
**Version:** 1.0.0
