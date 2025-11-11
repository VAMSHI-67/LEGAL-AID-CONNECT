import os
import sys
import pandas as pd
from datetime import datetime

# Add project root to path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, PROJECT_ROOT)

from evidently.report import Report
from evidently.metrics import DataDriftPreset

from mlops.scripts.utils import load_dataset

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "reports")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def main():
    os.makedirs(REPORTS_DIR, exist_ok=True)

    # Reference = training data snapshot
    reference_df = load_dataset()

    # Current data: if a recent batch exists under mlops/data/current_data.csv, use it; else, sample from reference
    current_path = os.path.join(DATA_DIR, "current_data.csv")
    if os.path.exists(current_path):
        current_df = pd.read_csv(current_path)
    else:
        current_df = reference_df.sample(min(2000, len(reference_df)), random_state=42).copy()

    report = Report(metrics=[DataDriftPreset()])
    report.run(reference_data=reference_df, current_data=current_df)

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    out_html = os.path.join(REPORTS_DIR, f"data_drift_report_{ts}.html")
    report.save_html(out_html)
    print(f"Saved data drift report to {out_html}")


if __name__ == "__main__":
    main()
