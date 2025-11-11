import os
import sys
from datetime import datetime

# Add project root to path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, PROJECT_ROOT)

from mlops.mlflow_setup import track_model
from mlops.scripts.utils import load_dataset, load_production_model, prepare_xy, evaluate_model, save_json

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "reports")
TRACKING_DIR = os.path.join(os.path.dirname(__file__), "..", "tracking")


def main():
    df = load_dataset()
    model, encoder, scaler = load_production_model()

    from sklearn.model_selection import train_test_split
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df["match"].astype(int))

    X_test, y_test = prepare_xy(test_df, encoder, scaler)

    metrics = evaluate_model(model, X_test, y_test)

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    payload_path = os.path.join(TRACKING_DIR, f"eval_{ts}.json")
    os.makedirs(TRACKING_DIR, exist_ok=True)
    save_json({"timestamp": ts, "metrics": metrics}, payload_path)

    # Log to MLflow
    track_model(run_name=f"evaluate_{ts}", metrics=metrics, params={"type": "production_eval"}, artifacts={"eval": payload_path})

    # Minimal text report
    os.makedirs(REPORTS_DIR, exist_ok=True)
    with open(os.path.join(REPORTS_DIR, f"evaluation_{ts}.txt"), "w", encoding="utf-8") as f:
        for k, v in metrics.items():
            f.write(f"{k}: {v}\n")

    print("Evaluation metrics:", metrics)


if __name__ == "__main__":
    main()
