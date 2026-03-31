"""
ML Model V2 Package
Safe upgrade path for LegalAid Connect matchmaking engine
"""

__version__ = "2.0.0"
__author__ = "LegalAid Connect Team"

from .config import (
    MATCHMAKING_MODEL_VERSION,
    FeatureConfig,
    TrainingConfig,
    InferenceConfig,
    LEGAL_DOMAINS,
    INDIAN_STATES
)

__all__ = [
    'MATCHMAKING_MODEL_VERSION',
    'FeatureConfig',
    'TrainingConfig',
    'InferenceConfig',
    'LEGAL_DOMAINS',
    'INDIAN_STATES'
]
