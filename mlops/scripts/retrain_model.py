import os
import sys
import time
from datetime import datetime

import numpy as np
import tensorflow as tf

# Ensure project root is on path to import existing training utilities if needed
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.append(PROJECT_ROOT)

from mlops.mlflow_setup import track_model
from mlops.scripts.utils import (
    load_dataset, load_production_model, prepare_xy, evaluate_model, save_json,
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
TRACKING_DIR = os.path.join(os.path.dirname(__file__), "..", "tracking")


def main():
    # Load data
    df = load_dataset()

    # Load current production model and preprocessors
    prod_model, encoder, scaler = load_production_model()

    # Split data
    from sklearn.model_selection import train_test_split
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df["match"].astype(int))

    # Prepare matrices using production encoder & scaler (ensures compatibility)
    X_train, y_train = prepare_xy(train_df, encoder, scaler)
    X_test, y_test = prepare_xy(test_df, encoder, scaler)

    # Baseline metrics with production model
    baseline = evaluate_model(prod_model, X_test, y_test)

    # Build a fresh model with same input_dim as production
    input_dim = X_train.shape[1]
    # Simple but strong architecture (independent, not modifying training script)
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(256, activation="relu", input_dim=input_dim),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.4),
        tf.keras.layers.Dense(128, activation="relu"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(64, activation="relu"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(1, activation="sigmoid"),
    ])
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3), loss="binary_crossentropy", metrics=["accuracy"]) 

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=5, min_lr=1e-6),
    ]

    history = model.fit(
        X_train, y_train, validation_split=0.2, epochs=60, batch_size=64, shuffle=True, callbacks=callbacks, verbose=0
    )

    # Evaluate new model
    new_metrics = evaluate_model(model, X_test, y_test)

    # Compare and decide
    improved = new_metrics["accuracy"] > baseline["accuracy"]

    # Save results
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    metrics_path = os.path.join(TRACKING_DIR, "last_metrics.json")
    payload = {
        "timestamp": ts,
        "baseline": baseline,
        "candidate": new_metrics,
        "improved": improved,
    }
    save_json(payload, metrics_path)

    # Save model version if improved
    artifacts = {"metrics": metrics_path}
    params = {"algorithm": "keras_dnn", "batch_size": 64, "epochs": len(history.history.get("loss", []))}

    if improved:
        version_dir = os.path.join(MODELS_DIR, f"v{ts}")
        os.makedirs(version_dir, exist_ok=True)
        candidate_path = os.path.join(version_dir, "lawyer_match_model.h5")
        model.save(candidate_path)
        artifacts["model"] = candidate_path

    # Track with MLflow (always log metrics; log model only if improved)
    run_name = f"retrain_{ts}"
    track_model(run_name, new_metrics, params, artifacts)

    print("Baseline:", baseline)
    print("Candidate:", new_metrics)
    print("Improved:", improved)


if __name__ == "__main__":
    main()
