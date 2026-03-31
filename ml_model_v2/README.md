# ML Model V2: FT-Transformer Upgrade

## ⚠️ CRITICAL SAFETY NOTICE

This directory contains the **NEW** FT-Transformer matching model.

**The existing model in `../ml_model/` is UNTOUCHED and READ-ONLY.**

### Safety Guarantees
- ✅ ML Model V1 remains production-ready as fallback
- ✅ Model switching via configuration flag
- ✅ Zero destructive changes to existing code
- ✅ All new work is isolated in `ml_model_v2/`

---

## Directory Structure

```
ml_model_v2/
├── config.py                 # Configuration & feature definitions
├── data/                     # Datasets (not committed to git)
│   ├── raw/                 # Downloaded raw datasets
│   ├── processed/           # Processed training data
│   └── metadata.json        # Data quality reports
├── models/                   # Model artifacts
│   ├── ft_transformer_best.pt
│   ├── scaler_v2.pkl
│   └── model_config.json
├── scripts/                  # Standalone execution scripts
│   ├── 01_download_datasets.py
│   ├── 02_feature_engineering.py
│   ├── 03_prepare_data.py
│   ├── 04_train_ft_transformer.py
│   └── 05_evaluate_model.py
├── api/                      # Flask API wrapper
│   ├── app.py               # FastAPI/Flask application
│   └── endpoints.py         # Prediction endpoints
├── reports/                  # Performance reports
│   ├── training_logs/
│   ├── evaluation_metrics/
│   └── comparison_v1_vs_v2/
├── tests/                    # Unit tests
│   ├── test_features.py
│   ├── test_model.py
│   └── test_api.py
└── README.md
```

---

## Implementation Phases

### ✅ Phase 0: Safety & Isolation (DONE)
- [x] Create ml_model_v2/ directory structure
- [x] Setup configuration system
- [x] Define 15 feature specification
- [x] Create safety rules

### Phase 1: Data Acquisition (READY)
- [ ] Download Indian Supreme Court dataset
- [ ] Download Case Similarity dataset
- [ ] Download Lawyer Performance dataset
- [ ] Validate data integrity

### Phase 2: Feature Engineering (READY)
- [ ] Implement feature extraction pipeline
- [ ] Generate 15-feature training data
- [ ] Validate feature distributions
- [ ] Create data quality report

### Phase 3: Model Training (READY)
- [ ] Implement FT-Transformer architecture
- [ ] Setup training pipeline with MLflow
- [ ] Train on real data
- [ ] Log experiments

### Phase 4: Evaluation (READY)
- [ ] Calculate evaluation metrics
- [ ] Compare with v1 baseline
- [ ] Generate performance reports
- [ ] Validation checklist

### Phase 5: Integration (PENDING)
- [ ] Deploy Flask API (/predict_v2)
- [ ] Setup model switching in backend
- [ ] Configure fallback mechanism
- [ ] Setup monitoring

---

## 15-Feature Specification

```
1. case_duration_months      (numeric: 1-120)
2. legal_domain              (categorical: 0-9)
3. case_complexity           (numeric: 1-5)
4. client_budget             (numeric: 0-1M)
5. lawyer_experience_years   (numeric: 0-60)
6. lawyer_success_rate       (numeric: 0-100)
7. client_location           (categorical: 0-31)
8. lawyer_location           (categorical: 0-31)
9. language_match            (numeric: 0-1)
10. availability_match       (numeric: 0-1)
11. cost_preference          (numeric: 0-1)
12. specialization_match     (numeric: 0-1)
13. communication_style      (numeric: 1-5)
14. case_urgency             (numeric: 1-5)
15. lawyer_caseload          (numeric: 0-20)
```

---

## Key Configuration Variables

```python
# Set in config.py or environment:
MATCHMAKING_MODEL_VERSION = "v1"  # or "v2" when ready

# Affects:
# - Backend routing
# - API endpoint used
# - Fallback behavior
# - Logging/monitoring
```

---

## Model Switching

### Current (V1)
```python
# Backend uses existing model
if MATCHMAKING_MODEL_VERSION == "v1":
    prediction = call_v1_model(features)
```

### After Validation (V2)
```python
# Backend switches to new model
if MATCHMAKING_MODEL_VERSION == "v2":
    try:
        prediction = call_v2_model(features)
    except:
        # Automatic fallback to v1
        prediction = call_v1_model(features)
```

---

## Expected Performance

| Metric | V1 (Current) | V2 (Target) |
|--------|-------------|------------|
| Accuracy | 56.58% | 90-95% |
| Precision | 48.52% | 90%+ |
| Recall | 32.09% | 90%+ |
| F1-Score | 38.63% | 90%+ |
| ROC-AUC | ~0.60 | 0.95+ |

---

## Usage

### Train Model
```bash
python scripts/04_train_ft_transformer.py
```

### Evaluate Model
```bash
python scripts/05_evaluate_model.py
```

### Start API
```bash
python api/app.py
```

### Run Tests
```bash
pytest tests/
```

---

## Safety Checklist

Before switching to V2:

- [ ] Accuracy verified ≥ 85% on test set
- [ ] Inference latency < 500ms
- [ ] API endpoints working
- [ ] Fallback mechanism tested
- [ ] Error handling verified
- [ ] Monitoring setup ready
- [ ] Stakeholder approval received
- [ ] Rollback procedure documented

---

## Rollback Procedure

If V2 has issues:

```bash
# 1. Set environment variable
export MATCHMAKING_MODEL_VERSION=v1

# 2. Restart services
# Backend automatically uses v1

# 3. Monitor logs
# All requests now use fallback model

# 4. Investigate issues
# Review ml_model_v2/reports/

# 5. Fix and redeploy
# When ready, set back to v2
```

---

## Documentation

- [Feature Engineering Guide](./FEATURE_ENGINEERING.md)
- [Training Guide](./TRAINING.md)
- [Evaluation Guide](./EVALUATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./api/README.md)

---

## Contact & Support

For questions or issues:
1. Review safety rules in config.py
2. Check documentation
3. Consult implementation phases
4. Review existing ml_model/ for reference
