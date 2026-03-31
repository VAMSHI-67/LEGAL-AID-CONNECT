"""
Production Flask API for FT-Transformer v2 inference.
Loads the trained model and scaler to provide real-time legal matchmaking.
"""

import sys
import torch
import torch.nn.functional as F
import pandas as pd
import numpy as np
import joblib
import json
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add parent directory to path to import local modules
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Attempt to import models and config
try:
    from models.ft_transformer import FTTransformer, FTTransformerConfig
    from config import V2_MODEL_PATH, V2_SCALER_PATH, V2_CONFIG_PATH, FeatureConfig
except ImportError as e:
    print(f"❌ Import error: {e}")
    # Fallback for direct script execution if needed
    sys.path.append(str(PROJECT_ROOT.parent)) 

app = Flask(__name__)
CORS(app)

# Global variables to hold model and scaler
model = None
scaler = None
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def load_model():
    global model, scaler
    try:
        print(f"📦 Loading FT-Transformer from {V2_MODEL_PATH}...")
        
        # Load config
        if not Path(V2_CONFIG_PATH).exists():
            print(f"❌ Config file not found: {V2_CONFIG_PATH}")
            return False
            
        with open(V2_CONFIG_PATH, 'r') as f:
            model_meta = json.load(f)
            
        config = FTTransformerConfig(
            num_features=model_meta['num_features'],
            num_classes=model_meta['num_classes'],
            d_model=model_meta['d_model'],
            num_heads=model_meta['num_heads'],
            num_layers=model_meta['num_layers'],
            dropout=model_meta['dropout']
        )
        
        # Initialize and load model
        model = FTTransformer(config).to(device)
        model.load_state_dict(torch.load(V2_MODEL_PATH, map_location=device))
        model.eval()
        
        # Load scaler
        print(f"⚖️ Loading Scaler from {V2_SCALER_PATH}...")
        scaler = joblib.load(V2_SCALER_PATH)
        
        print("✅ Inference resources loaded successfully.")
        return True
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        import traceback
        traceback.print_exc()
        return False

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "up",
        "model_loaded": model is not None,
        "device": str(device)
    })

@app.route("/predict_v2", methods=["POST"])
def predict_v2():
    if model is None or scaler is None:
        return jsonify({"success": False, "message": "Model not loaded"}), 503
        
    try:
        data = request.json
        if not data or 'features' not in data:
            return jsonify({"success": False, "message": "Missing 'features' in request body"}), 400
            
        features_dict = data['features']
        
        # Ensure all 15 features are present
        input_data = []
        for name in FeatureConfig.FEATURE_NAMES:
            if name not in features_dict:
                return jsonify({"success": False, "message": f"Missing feature: {name}"}), 400
            input_data.append(features_dict[name])
            
        # Convert to DataFrame for scaling
        df = pd.DataFrame([input_data], columns=FeatureConfig.FEATURE_NAMES)
        
        # Scale numeric features
        df[FeatureConfig.NUMERIC_FEATURES] = scaler.transform(df[FeatureConfig.NUMERIC_FEATURES])
        
        # Convert to tensor
        input_tensor = torch.from_numpy(df.values.astype(np.float32)).to(device)
        
        # Predict
        with torch.no_grad():
            outputs = model(input_tensor)
            proba = F.softmax(outputs, dim=1)
            score = proba[0, 1].item()
            prediction = torch.argmax(outputs, dim=1).item()
            
        return jsonify({
            "success": True,
            "match_score": round(score, 4),
            "match": bool(prediction),
            "model_version": "v2-ft-transformer"
        })
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == "__main__":
    if load_model():
        app.run(host="0.0.0.0", port=8001)
    else:
        print("❌ Server failed to start due to model loading error.")
        sys.exit(1)