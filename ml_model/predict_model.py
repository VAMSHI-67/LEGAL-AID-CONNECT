import os
import joblib
import numpy as np
from flask import Flask, request, jsonify
import tensorflow as tf


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "lawyer_match_model.h5")
ENCODER_PATH = os.path.join(BASE_DIR, "encoder.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.pkl")

app = Flask(__name__)


def load_artifacts():
    if not (os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH) and os.path.exists(SCALER_PATH)):
        raise FileNotFoundError("Model or preprocessing artifacts not found. Train the model first.")
    model = tf.keras.models.load_model(MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)
    scaler = joblib.load(SCALER_PATH)
    return model, encoder, scaler


model, encoder, scaler = load_artifacts()


@app.route("/predict_match", methods=["POST"])
def predict_match():
    payload = request.get_json(force=True)

    # Expected fields (subset of training features). If location vs city missing, reuse values when sensible.
    case_type = str(payload.get("case_type", ""))
    location = str(payload.get("location", payload.get("client_city", "")))
    preferred_language = str(payload.get("preferred_language", "English"))
    specialization = str(payload.get("specialization", ""))
    city = str(payload.get("city", payload.get("lawyer_city", location)))

    urgency_level = float(payload.get("urgency_level", 3))
    budget = float(payload.get("budget", 15000))
    case_complexity_score = float(payload.get("case_complexity_score", 0.5))
    experience = float(payload.get("experience", 5))
    success_rate = float(payload.get("success_rate", 0.7))
    rating = float(payload.get("rating", 4.0))
    consultation_fee = float(payload.get("consultation_fee", 12000))
    availability = float(payload.get("availability", 1))

    # Calculate engineered features
    budget_fee_ratio = budget / (consultation_fee + 1)
    experience_success = experience * success_rate
    urgency_complexity = urgency_level * case_complexity_score
    rating_availability = rating * availability
    budget_per_urgency = budget / (urgency_level + 1)
    fee_rating_ratio = consultation_fee / (rating + 0.1)

    # Prepare encodable arrays
    cat_row = [[case_type, location, preferred_language, specialization, city]]
    num_row = [[
        urgency_level,
        budget,
        case_complexity_score,
        experience,
        success_rate,
        rating,
        consultation_fee,
        availability,
        budget_fee_ratio,
        experience_success,
        urgency_complexity,
        rating_availability,
        budget_per_urgency,
        fee_rating_ratio,
    ]]

    X_cat = encoder.transform(cat_row)
    X_num = scaler.transform(num_row)
    X = np.hstack([X_cat, X_num])

    prob = float(model.predict(X).ravel()[0])
    match_result = int(prob >= 0.5)

    return jsonify({"match_probability": round(prob, 4), "match_result": match_result})


if __name__ == "__main__":
    # Default port 8000 for the Flask ML service
    app.run(host="0.0.0.0", port=int(os.environ.get("ML_PORT", 8000)))


