import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Tuple, Dict

import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ML_MODEL_DIR = os.path.join(PROJECT_ROOT, "ml_model")
MLOPS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

PRIMARY_MODEL_PATH = os.path.join(ML_MODEL_DIR, "lawyer_match_model.h5")
ENCODER_PATH = os.path.join(ML_MODEL_DIR, "encoder.pkl")
SCALER_PATH = os.path.join(ML_MODEL_DIR, "scaler.pkl")
DEFAULT_DATA_PATH = os.path.join(ML_MODEL_DIR, "matchmaking_dataset.csv")
MLOPS_DATA_PATH = os.path.join(MLOPS_DIR, "data", "matchmaking_dataset.csv")


def load_dataset() -> pd.DataFrame:
    path = MLOPS_DATA_PATH if os.path.exists(MLOPS_DATA_PATH) else DEFAULT_DATA_PATH
    return pd.read_csv(path)


def feature_engineer(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['budget_fee_ratio'] = df['budget'] / (df['consultation_fee'] + 1)
    df['experience_success'] = df['experience'] * df['success_rate']
    df['urgency_complexity'] = df['urgency_level'] * df['case_complexity_score']
    df['rating_availability'] = df['rating'] * df['availability']
    df['budget_per_urgency'] = df['budget'] / (df['urgency_level'] + 1)
    df['fee_rating_ratio'] = df['consultation_fee'] / (df['rating'] + 0.1)
    return df


def load_production_model():
    model = tf.keras.models.load_model(PRIMARY_MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)
    scaler = joblib.load(SCALER_PATH)
    return model, encoder, scaler


def prepare_xy(df: pd.DataFrame, encoder, scaler) -> Tuple[np.ndarray, np.ndarray]:
    df = feature_engineer(df)
    categorical_cols = ["case_type", "location", "preferred_language", "specialization", "city"]
    numeric_cols = [
        "urgency_level", "budget", "case_complexity_score",
        "experience", "success_rate", "rating",
        "consultation_fee", "availability",
        "budget_fee_ratio", "experience_success", "urgency_complexity",
        "rating_availability", "budget_per_urgency", "fee_rating_ratio"
    ]
    X_cat = encoder.transform(df[categorical_cols].astype(str))
    X_num = scaler.transform(df[numeric_cols].astype(float))
    X = np.hstack([X_cat, X_num])
    y = df["match"].astype(int).values
    return X, y


def evaluate_model(model, X: np.ndarray, y: np.ndarray) -> Dict[str, float]:
    y_prob = model.predict(X, verbose=0).ravel()
    y_pred = (y_prob >= 0.5).astype(int)
    return {
        "accuracy": float(accuracy_score(y, y_pred)),
        "precision": float(precision_score(y, y_pred, zero_division=0)),
        "recall": float(recall_score(y, y_pred, zero_division=0)),
        "f1": float(f1_score(y, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y, y_prob)),
    }


def save_json(data: Dict, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
