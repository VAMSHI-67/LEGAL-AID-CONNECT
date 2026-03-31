"""
ML Model v2 Configuration
Controls model versioning, feature definitions, and training parameters
"""

import os
from dataclasses import dataclass
from typing import List, Dict

# ==================== CRITICAL: MODEL VERSION CONTROL ====================
# Set to "v1" or "v2" to control which model is used
# v1 = Existing custom neural network (fallback)
# v2 = New FT-Transformer (primary)
MATCHMAKING_MODEL_VERSION = os.getenv('MATCHMAKING_MODEL_VERSION', 'v1')

# Fallback model path (existing production model - DO NOT MODIFY)
FALLBACK_MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    '../ml_model/lawyer_match_model.h5'
)

# V2 Model paths
V2_MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    'models/ft_transformer_best.pt'
)

V2_SCALER_PATH = os.path.join(
    os.path.dirname(__file__),
    'models/scaler_v2.pkl'
)

V2_CONFIG_PATH = os.path.join(
    os.path.dirname(__file__),
    'models/model_config.json'
)

# ==================== FEATURE DEFINITIONS ====================
@dataclass
class FeatureConfig:
    """15-feature specification for FT-Transformer"""
    
    # Feature names in order
    FEATURE_NAMES = [
        'case_duration_months',      # 1
        'legal_domain',              # 2 (0-9 encoded)
        'case_complexity',           # 3 (1-5 scale)
        'client_budget',             # 4 (numeric)
        'lawyer_experience_years',   # 5 (numeric)
        'lawyer_success_rate',       # 6 (0-100)
        'client_location',           # 7 (0-31 encoded state)
        'lawyer_location',           # 8 (0-31 encoded state)
        'language_match',            # 9 (0-1)
        'availability_match',        # 10 (0-1)
        'cost_preference',           # 11 (0-1)
        'specialization_match',      # 12 (0-1)
        'communication_style',       # 13 (1-5 scale)
        'case_urgency',              # 14 (1-5 scale)
        'lawyer_caseload'            # 15 (0-20)
    ]
    
    # Feature data types
    FEATURE_TYPES = {
        'case_duration_months': 'numeric',
        'legal_domain': 'categorical',
        'case_complexity': 'numeric',
        'client_budget': 'numeric',
        'lawyer_experience_years': 'numeric',
        'lawyer_success_rate': 'numeric',
        'client_location': 'categorical',
        'lawyer_location': 'categorical',
        'language_match': 'numeric',
        'availability_match': 'numeric',
        'cost_preference': 'numeric',
        'specialization_match': 'numeric',
        'communication_style': 'numeric',
        'case_urgency': 'numeric',
        'lawyer_caseload': 'numeric'
    }
    
    # Feature ranges (for validation)
    FEATURE_RANGES = {
        'case_duration_months': (1, 120),
        'legal_domain': (0, 9),
        'case_complexity': (1, 5),
        'client_budget': (0, 1000000),
        'lawyer_experience_years': (0, 60),
        'lawyer_success_rate': (0, 100),
        'client_location': (0, 31),
        'lawyer_location': (0, 31),
        'language_match': (0, 1),
        'availability_match': (0, 1),
        'cost_preference': (0, 1),
        'specialization_match': (0, 1),
        'communication_style': (1, 5),
        'case_urgency': (1, 5),
        'lawyer_caseload': (0, 20)
    }
    
    # Numeric features for scaling
    NUMERIC_FEATURES = [f for f, t in FEATURE_TYPES.items() if t == 'numeric']
    
    # Categorical features for encoding
    CATEGORICAL_FEATURES = [f for f, t in FEATURE_TYPES.items() if t == 'categorical']
    
    NUM_FEATURES = len(FEATURE_NAMES)


# ==================== LEGAL DOMAIN MAPPING ====================
LEGAL_DOMAINS = {
    'Criminal': 0,
    'Civil': 1,
    'Corporate': 2,
    'Employment': 3,
    'IP': 4,
    'Family': 5,
    'Real Estate': 6,
    'Tax': 7,
    'Administrative': 8,
    'Constitutional': 9
}

DOMAIN_REVERSE_MAP = {v: k for k, v in LEGAL_DOMAINS.items()}

# ==================== INDIAN STATES MAPPING ====================
INDIAN_STATES = {
    'Andhra Pradesh': 0, 'Arunachal Pradesh': 1, 'Assam': 2,
    'Bihar': 3, 'Chhattisgarh': 4, 'Goa': 5, 'Gujarat': 6,
    'Haryana': 7, 'Himachal Pradesh': 8, 'Jharkhand': 9,
    'Karnataka': 10, 'Kerala': 11, 'Madhya Pradesh': 12,
    'Maharashtra': 13, 'Manipur': 14, 'Meghalaya': 15,
    'Mizoram': 16, 'Nagaland': 17, 'Odisha': 18, 'Punjab': 19,
    'Rajasthan': 20, 'Sikkim': 21, 'Tamil Nadu': 22,
    'Telangana': 23, 'Tripura': 24, 'Uttar Pradesh': 25,
    'Uttarakhand': 26, 'West Bengal': 27, 'Delhi': 28,
    'Puducherry': 29, 'Chandigarh': 30, 'Other': 31
}

STATE_REVERSE_MAP = {v: k for k, v in INDIAN_STATES.items()}

# ==================== DATASET SOURCES ====================
DATASET_CONFIG = {
    'indian_supreme_court': {
        'name': 'Indian Supreme Court Case Database',
        'source': 'https://www.kaggle.com/datasets/sukhjitkour/indian-supreme-court-case-database',
        'size': '40000+ cases',
        'purpose': 'Primary training data'
    },
    'case_similarity': {
        'name': 'Case Similarity Dataset',
        'source': 'https://www.kaggle.com/datasets/legal-case-similarity',
        'size': '10000 pairs',
        'purpose': 'Validation and threshold calibration'
    },
    'lawyer_profiles': {
        'name': 'Lawyer Performance Dataset',
        'source': 'https://www.kaggle.com/datasets/lawyer-performance',
        'size': '5000+ profiles',
        'purpose': 'Lawyer attributes and enrichment'
    }
}

# ==================== TRAINING CONFIGURATION ====================
@dataclass
class TrainingConfig:
    """FT-Transformer training hyperparameters"""
    
    # Data
    train_split: float = 0.70
    val_split: float = 0.15
    test_split: float = 0.15
    random_seed: int = 42
    
    # SMOTE balancing
    apply_smote: bool = True
    smote_random_state: int = 42
    
    # Model architecture
    num_features: int = 15
    num_classes: int = 2
    d_model: int = 64
    num_heads: int = 4
    num_layers: int = 3
    dim_feedforward: int = 256
    dropout: float = 0.2
    
    # Training
    batch_size: int = 32
    num_epochs: int = 100
    learning_rate: float = 0.001
    weight_decay: float = 1e-5
    patience: int = 10
    
    # Device
    device: str = 'cuda'  # Will fallback to 'cpu' if GPU unavailable
    
    # Logging
    log_interval: int = 5
    save_best_model: bool = True
    
    # MLflow
    log_to_mlflow: bool = True
    mlflow_tracking_uri: str = 'http://localhost:5000'
    mlflow_experiment_name: str = 'ft_transformer_legal_matching'


# ==================== INFERENCE CONFIGURATION ====================
@dataclass
class InferenceConfig:
    """FT-Transformer inference settings"""
    
    # Model selection
    use_v2: bool = MATCHMAKING_MODEL_VERSION == "v2"
    fallback_on_error: bool = True
    
    # Thresholds
    confidence_threshold_high: float = 0.8
    confidence_threshold_medium: float = 0.5
    
    # Inference
    batch_inference_size: int = 32
    max_inference_time_ms: int = 500
    
    # Fallback behavior
    fallback_model_path: str = FALLBACK_MODEL_PATH
    log_fallback_usage: bool = True


# ==================== EVALUATION TARGETS ====================
EVAL_TARGETS = {
    'accuracy': {
        'target': 0.90,
        'baseline': 0.5665  # Current v1 accuracy
    },
    'precision': {
        'target': 0.90,
        'baseline': 0.4852
    },
    'recall': {
        'target': 0.90,
        'baseline': 0.3209
    },
    'f1_score': {
        'target': 0.90,
        'baseline': 0.3863
    },
    'roc_auc': {
        'target': 0.95,
        'baseline': 0.60
    }
}

# ==================== DEPLOYMENT CHECKLIST ====================
DEPLOYMENT_CHECKLIST = {
    'pre_deployment': [
        'Test accuracy on hold-out test set ≥ 0.85',
        'Inference latency < 500ms',
        'Compare predictions with v1 on 100 samples',
        'Run shadow deployment for 1 week',
        'Verify fallback mechanism works',
        'Check API error handling',
        'Validate feature preprocessing',
        'Confirm MLOps logging working'
    ],
    'deployment': [
        'Deploy Flask API for /predict_v2',
        'Update backend config to recognize v2',
        'Setup monitoring dashboard',
        'Configure alerting rules',
        'Document rollback procedure'
    ],
    'post_deployment': [
        'Monitor prediction distribution',
        'Track user feedback',
        'Monitor inference latency',
        'Check for API errors',
        'Validate accuracy on real data'
    ],
    'rollback_criteria': [
        'Accuracy drops below 80%',
        'Inference latency > 1000ms',
        'API error rate > 5%',
        'User complaints about matches'
    ]
}

# ==================== SAFETY RULES ====================
SAFETY_RULES = """
✅ SAFETY RULES - NON-NEGOTIABLE

1. ISOLATION:
   - ml_model/ directory is READ-ONLY
   - All changes go to ml_model_v2/
   - No modifications to existing models

2. MODEL SWITCHING:
   - Always support both v1 and v2
   - Default to v1 until v2 validated
   - Configuration-based switching (not code)

3. FALLBACK:
   - If v2 fails → automatically use v1
   - Log all fallback events
   - Never let system fail completely

4. VERSIONING:
   - Track model versions in MLflow
   - Keep all checkpoints
   - No destructive model updates

5. DATA:
   - Existing datasets untouched
   - New datasets in ml_model_v2/data/
   - Version control datasets with DVC

6. DEPLOYMENT:
   - Always have rollback plan
   - Test thoroughly before switching
   - Monitor after deployment
   - Stakeholder approval required
"""

# Print safety rules on import
if __name__ == '__main__':
    print(SAFETY_RULES)
    print("\n✅ Current Configuration:")
    print(f"   Model Version: {MATCHMAKING_MODEL_VERSION}")
    print(f"   Features: {FeatureConfig.NUM_FEATURES}")
    print(f"   Fallback Path: {FALLBACK_MODEL_PATH}")
    print(f"   V2 Model Path: {V2_MODEL_PATH}")
