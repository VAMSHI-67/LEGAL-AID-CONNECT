import os
import time
import mlflow
from typing import Dict, Any


def get_tracking_uri() -> str:
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "tracking"))
    os.makedirs(base, exist_ok=True)
    return f"file:{base}"


def init_mlflow(experiment_name: str = "LegalAid_Connect_Matchmaking"):
    mlflow.set_tracking_uri(get_tracking_uri())
    mlflow.set_experiment(experiment_name)


def track_model(run_name: str, metrics: Dict[str, float], params: Dict[str, Any], artifacts: Dict[str, str]):
    """Log a run with metrics, params and artifacts.
    - metrics: dict of float metrics
    - params: dict of hyperparameters / metadata
    - artifacts: mapping name -> local path to file or directory
    """
    init_mlflow()
    with mlflow.start_run(run_name=run_name):
        # params
        for k, v in params.items():
            mlflow.log_param(k, v)
        # metrics
        for k, v in metrics.items():
            try:
                mlflow.log_metric(k, float(v))
            except Exception:
                pass
        # artifacts
        for name, path in artifacts.items():
            if os.path.isdir(path):
                mlflow.log_artifacts(path, artifact_path=name)
            elif os.path.isfile(path):
                mlflow.log_artifact(path, artifact_path=name)
        # tag with timestamp
        mlflow.set_tag("timestamp", str(int(time.time())))
