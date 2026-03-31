"""
Phase 5: FT-Transformer Evaluation

Evaluates a trained FT-Transformer model on the prepared test split.
This script is non-intrusive and will exit if required artifacts are missing.

Inputs:
    ml_model_v2/data/processed/test_data.csv
    ml_model_v2/models/ft_transformer_best.pt (or final)
    ml_model_v2/models/scaler_v2.pkl

Usage:
    python scripts/05_evaluate_model.py
"""

import sys
from pathlib import Path
import json
import numpy as np
import pandas as pd
import torch
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import TrainingConfig, FeatureConfig
from models.ft_transformer import FTTransformer, FTTransformerConfig


def main():
    base_dir = Path(__file__).parent.parent
    processed_dir = base_dir / "data" / "processed"
    models_dir = base_dir / "models"

    test_path = processed_dir / "test_data.csv"
    model_path = models_dir / "ft_transformer_best.pt"

    if not test_path.exists():
        print(f"❌ Test data not found: {test_path}")
        print("   Run: python scripts/03_prepare_data.py")
        sys.exit(1)

    if not model_path.exists():
        print(f"❌ Model checkpoint not found: {model_path}")
        print("   Run: python scripts/04_train_ft_transformer.py")
        sys.exit(1)

    df = pd.read_csv(test_path)
    if "match" not in df.columns:
        print("❌ Test data missing target column: match")
        sys.exit(1)

    X = df.drop("match", axis=1).values.astype(np.float32)
    y = df["match"].values.astype(np.int64)

    config = FTTransformerConfig(
        num_features=TrainingConfig().num_features,
        num_classes=TrainingConfig().num_classes,
        d_model=TrainingConfig().d_model,
        num_heads=TrainingConfig().num_heads,
        num_layers=TrainingConfig().num_layers,
        dim_feedforward=TrainingConfig().dim_feedforward,
        dropout=TrainingConfig().dropout
    )

    model = FTTransformer(config)
    model.load_state_dict(torch.load(model_path, map_location="cpu"))
    model.eval()

    with torch.no_grad():
        logits = model(torch.from_numpy(X))
        probs = torch.softmax(logits, dim=1)[:, 1].numpy()
        preds = (probs >= 0.5).astype(int)

    metrics = {
        "accuracy": float(accuracy_score(y, preds)),
        "precision": float(precision_score(y, preds, zero_division=0)),
        "recall": float(recall_score(y, preds, zero_division=0)),
        "f1_score": float(f1_score(y, preds, zero_division=0)),
        "roc_auc": float(roc_auc_score(y, probs))
    }

    print("\n📈 Evaluation Metrics (FT-Transformer)")
    for k, v in metrics.items():
        print(f"   {k}: {v:.4f}")

    out_dir = base_dir / "reports" / "evaluation_metrics"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "metrics.json"

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"\n✅ Metrics saved to: {out_path}")


if __name__ == "__main__":
    main()
