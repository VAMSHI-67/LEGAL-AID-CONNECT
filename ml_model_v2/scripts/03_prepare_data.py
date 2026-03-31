"""
Phase 3: Data Preparation & Balancing

Prepares training data for FT-Transformer:
- Feature scaling and normalization
- Train/val/test splits
- Class imbalance handling with SMOTE
- Data quality reports

Input:
    ml_model_v2/data/processed/matchmaking_dataset.csv

Output:
    ml_model_v2/data/processed/
    ├── train_data.csv
    ├── val_data.csv
    ├── test_data.csv
    ├── scaler_v2.pkl
    ├── data_splits.json
    └── class_distribution.json

Usage:
    python scripts/03_prepare_data.py
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
import pickle
import json
import sys
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import FeatureConfig, LEGAL_DOMAINS, INDIAN_STATES


class DataPreparation:
    """Prepare data for FT-Transformer training"""
    
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / 'data'
        self.processed_dir = self.data_dir / 'processed'
        self.models_dir = Path(__file__).parent.parent / 'models'
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        self.scaler = StandardScaler()
        self.encoders = {}
        self.stats = {}
    
    def load_dataset(self):
        """Load processed dataset"""
        
        print("📂 Loading dataset...")
        
        dataset_path = self.processed_dir / 'matchmaking_dataset.csv'
        
        if not dataset_path.exists():
            print(f"❌ Dataset not found at {dataset_path}")
            print("   Run: python scripts/02_feature_engineering.py")
            sys.exit(1)
        
        df = pd.read_csv(dataset_path)
        
        print(f"   ✅ Loaded {len(df)} samples")
        print(f"   Features: {len(df.columns)}")
        print(f"   Memory: {df.memory_usage(deep=True).sum() / 1024**2:.1f} MB")
        
        return df
    
    def check_data_quality(self, df):
        """Analyze data quality"""
        
        print("\n🔍 Checking data quality...")
        
        # Check for missing values
        missing = df.isnull().sum()
        if missing.sum() > 0:
            print(f"   ⚠️ Missing values: {missing.sum()}")
            df = df.dropna()
            print(f"   Removed {missing.sum()} rows")
        
        # Check class distribution before balancing
        print(f"\n   Original class distribution:")
        class_dist = df['match'].value_counts()
        for class_label, count in class_dist.items():
            pct = count / len(df) * 100
            print(f"      Class {class_label}: {count} ({pct:.1f}%)")
        
        self.stats['original_distribution'] = class_dist.to_dict()
        
        return df
    
    def separate_features_and_target(self, df):
        """Separate features from target"""
        
        X = df.drop('match', axis=1)
        y = df['match']
        
        print(f"\n✅ Separated features and target")
        print(f"   Features shape: {X.shape}")
        print(f"   Target shape: {y.shape}")
        
        return X, y
    
    def scale_numeric_features(self, X_train, X_val, X_test):
        """Scale numeric features"""
        
        print(f"\n📊 Scaling numeric features...")
        
        numeric_features = FeatureConfig.NUMERIC_FEATURES
        
        # Fit scaler on training data only
        X_train_scaled = X_train.copy()
        X_train_scaled[numeric_features] = self.scaler.fit_transform(
            X_train[numeric_features]
        )
        
        # Apply same scaling to validation and test
        X_val_scaled = X_val.copy()
        X_val_scaled[numeric_features] = self.scaler.transform(X_val[numeric_features])
        
        X_test_scaled = X_test.copy()
        X_test_scaled[numeric_features] = self.scaler.transform(X_test[numeric_features])
        
        print(f"   ✅ Scaled {len(numeric_features)} numeric features")
        
        return X_train_scaled, X_val_scaled, X_test_scaled
    
    def apply_smote_balancing(self, X_train, y_train):
        """Balance training set using SMOTE"""
        
        print(f"\n⚖️ Balancing with SMOTE...")
        
        try:
            from imblearn.over_sampling import SMOTE
            
            print(f"   Before SMOTE: {y_train.value_counts().to_dict()}")
            
            smote = SMOTE(
                random_state=42,
                k_neighbors=5,
                n_jobs=-1
            )
            
            X_train_balanced, y_train_balanced = smote.fit_resample(X_train, y_train)
            
            print(f"   After SMOTE: {pd.Series(y_train_balanced).value_counts().to_dict()}")
            print(f"   New training set size: {len(X_train_balanced)}")
            
            self.stats['smote_applied'] = True
            self.stats['balanced_distribution'] = pd.Series(y_train_balanced).value_counts().to_dict()
            
            return X_train_balanced, y_train_balanced
        
        except ImportError:
            print("   ⚠️ imbalanced-learn not installed. Skipping SMOTE.")
            print("   Install: pip install imbalanced-learn")
            return X_train, y_train
    
    def create_splits(self, X, y):
        """Create train/val/test splits"""
        
        print(f"\n📊 Creating train/val/test splits...")
        
        # Train: 70%, Temp: 30%
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y,
            test_size=0.30,
            random_state=42,
            stratify=y
        )
        
        # Temp (30%): Val 50%, Test 50% (so val: 15%, test: 15%)
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp,
            test_size=0.50,
            random_state=42,
            stratify=y_temp
        )
        
        print(f"   Train: {len(X_train)} ({len(X_train)/len(X)*100:.1f}%)")
        print(f"   Val:   {len(X_val)} ({len(X_val)/len(X)*100:.1f}%)")
        print(f"   Test:  {len(X_test)} ({len(X_test)/len(X)*100:.1f}%)")
        
        self.stats['train_size'] = len(X_train)
        self.stats['val_size'] = len(X_val)
        self.stats['test_size'] = len(X_test)
        
        return X_train, X_val, X_test, y_train, y_val, y_test
    
    def save_splits(self, X_train, X_val, X_test, y_train, y_val, y_test):
        """Save train/val/test splits to CSV"""
        
        print(f"\n💾 Saving data splits...")
        
        # Combine features with target
        train_df = X_train.copy()
        train_df['match'] = y_train.values
        
        val_df = X_val.copy()
        val_df['match'] = y_val.values
        
        test_df = X_test.copy()
        test_df['match'] = y_test.values
        
        # Save
        train_path = self.processed_dir / 'train_data.csv'
        val_path = self.processed_dir / 'val_data.csv'
        test_path = self.processed_dir / 'test_data.csv'
        
        train_df.to_csv(train_path, index=False)
        val_df.to_csv(val_path, index=False)
        test_df.to_csv(test_path, index=False)
        
        print(f"   ✅ Saved to:")
        print(f"      {train_path}")
        print(f"      {val_path}")
        print(f"      {test_path}")
        
        return train_path, val_path, test_path
    
    def save_scaler(self):
        """Save fitted scaler for later use"""
        
        print(f"\n💾 Saving scaler...")
        
        scaler_path = self.models_dir / 'scaler_v2.pkl'
        
        with open(scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)
        
        print(f"   ✅ Saved to {scaler_path}")
        
        return scaler_path
    
    def create_metadata(self, train_path, val_path, test_path, scaler_path):
        """Create metadata JSON"""
        
        print(f"\n📋 Creating metadata...")
        
        metadata = {
            'created_at': datetime.now().isoformat(),
            'dataset_version': 'v2',
            'paths': {
                'train': str(train_path),
                'val': str(val_path),
                'test': str(test_path),
                'scaler': str(scaler_path)
            },
            'statistics': self.stats,
            'features': FeatureConfig.FEATURE_NAMES,
            'target': 'match',
            'notes': 'FT-Transformer training data with real legal datasets'
        }
        
        metadata_path = self.processed_dir / 'data_splits.json'
        
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"   ✅ Saved to {metadata_path}")
        
        return metadata_path
    
    def run(self):
        """Execute data preparation pipeline"""
        
        print("=" * 70)
        print("📊 ML Model V2: Data Preparation Phase")
        print("=" * 70)
        
        # Load dataset
        df = self.load_dataset()
        
        # Check quality
        df = self.check_data_quality(df)
        
        # Separate features and target
        X, y = self.separate_features_and_target(df)
        
        # Create splits first
        X_train, X_val, X_test, y_train, y_val, y_test = self.create_splits(X, y)
        
        # Scale numeric features
        X_train_scaled, X_val_scaled, X_test_scaled = self.scale_numeric_features(
            X_train, X_val, X_test
        )
        
        # Apply SMOTE balancing on training data only
        X_train_balanced, y_train_balanced = self.apply_smote_balancing(
            X_train_scaled, y_train
        )
        
        # Save splits
        train_path, val_path, test_path = self.save_splits(
            X_train_balanced, X_val_scaled, X_test_scaled,
            y_train_balanced, y_val, y_test
        )
        
        # Save scaler
        scaler_path = self.save_scaler()
        
        # Create metadata
        metadata_path = self.create_metadata(train_path, val_path, test_path, scaler_path)
        
        print("\n" + "=" * 70)
        print("✅ Data Preparation Complete!")
        print("=" * 70)
        print(f"\n📊 Summary:")
        for key, value in self.stats.items():
            print(f"   {key}: {value}")
        
        print(f"\n📝 Next step: Run Phase 4 - Model Training")
        print("   python scripts/04_train_ft_transformer.py")


if __name__ == '__main__':
    prep = DataPreparation()
    prep.run()
