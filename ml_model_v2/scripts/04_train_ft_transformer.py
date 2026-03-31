"""
Phase 4: FT-Transformer Training with MLflow Logging

Trains FT-Transformer on prepared legal datasets with:
- Early stopping
- MLflow experiment tracking
- Model checkpointing
- Comprehensive metrics logging
- GPU support

Input:
    ml_model_v2/data/processed/
    ├── train_data.csv
    ├── val_data.csv
    ├── test_data.csv
    └── scaler_v2.pkl

Output:
    ml_model_v2/models/
    ├── ft_transformer_best.pt
    ├── ft_transformer_final.pt
    ├── model_config.json
    └── training_metrics.json

Usage:
    python scripts/04_train_ft_transformer.py

Requirements:
    pip install torch mlflow scikit-learn pandas numpy
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import pandas as pd
import numpy as np
from pathlib import Path
import json
from datetime import datetime
import sys

try:
    import mlflow
    import mlflow.pytorch
    HAS_MLFLOW = True
except ImportError:
    HAS_MLFLOW = False
    print("⚠️ MLflow not installed. Install: pip install mlflow")

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import TrainingConfig, FeatureConfig, EVAL_TARGETS
from models.ft_transformer import FTTransformer, FTTransformerConfig, count_parameters


class FTTransformerTrainer:
    """Train FT-Transformer with MLflow logging"""
    
    def __init__(self, config: TrainingConfig = TrainingConfig()):
        self.config = config
        self.data_dir = Path(__file__).parent.parent / 'data'
        self.models_dir = Path(__file__).parent.parent / 'models'
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        # Determine device
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.config.device = str(self.device)
        
        print(f"📱 Device: {self.device}")
        
        self.history = {
            'train_loss': [],
            'train_acc': [],
            'val_loss': [],
            'val_acc': []
        }
        
        self.best_metrics = {
            'val_accuracy': 0,
            'val_loss': float('inf'),
            'epoch': 0
        }
    
    def load_data(self):
        """Load train/val/test data"""
        
        print("📂 Loading data...")
        
        train_path = self.data_dir / 'processed' / 'train_data.csv'
        val_path = self.data_dir / 'processed' / 'val_data.csv'
        test_path = self.data_dir / 'processed' / 'test_data.csv'
        
        train_df = pd.read_csv(train_path)
        val_df = pd.read_csv(val_path)
        test_df = pd.read_csv(test_path)
        
        print(f"   ✅ Train: {len(train_df)} samples")
        print(f"   ✅ Val: {len(val_df)} samples")
        print(f"   ✅ Test: {len(test_df)} samples")
        
        # Separate features and targets
        X_train = train_df.drop('match', axis=1).values.astype(np.float32)
        y_train = train_df['match'].values.astype(np.int64)
        
        X_val = val_df.drop('match', axis=1).values.astype(np.float32)
        y_val = val_df['match'].values.astype(np.int64)
        
        X_test = test_df.drop('match', axis=1).values.astype(np.float32)
        y_test = test_df['match'].values.astype(np.int64)
        
        return X_train, y_train, X_val, y_val, X_test, y_test
    
    def create_dataloaders(self, X_train, y_train, X_val, y_val, X_test, y_test):
        """Create PyTorch DataLoaders"""
        
        print("\n📦 Creating DataLoaders...")
        
        # Convert to tensors
        train_dataset = TensorDataset(
            torch.from_numpy(X_train),
            torch.from_numpy(y_train)
        )
        val_dataset = TensorDataset(
            torch.from_numpy(X_val),
            torch.from_numpy(y_val)
        )
        test_dataset = TensorDataset(
            torch.from_numpy(X_test),
            torch.from_numpy(y_test)
        )
        
        # Create loaders
        train_loader = DataLoader(
            train_dataset,
            batch_size=self.config.batch_size,
            shuffle=True,
            num_workers=0
        )
        val_loader = DataLoader(
            val_dataset,
            batch_size=self.config.batch_size,
            shuffle=False,
            num_workers=0
        )
        test_loader = DataLoader(
            test_dataset,
            batch_size=self.config.batch_size,
            shuffle=False,
            num_workers=0
        )
        
        print(f"   ✅ DataLoaders created")
        
        return train_loader, val_loader, test_loader
    
    def initialize_model(self):
        """Initialize FT-Transformer"""
        
        print("\n🧠 Initializing FT-Transformer...")
        
        config = FTTransformerConfig(
            num_features=self.config.num_features,
            num_classes=self.config.num_classes,
            d_model=self.config.d_model,
            num_heads=self.config.num_heads,
            num_layers=self.config.num_layers,
            dim_feedforward=self.config.dim_feedforward,
            dropout=self.config.dropout
        )
        
        model = FTTransformer(config).to(self.device)
        
        total, trainable = count_parameters(model)
        print(f"   ✅ Parameters: {total:,} (trainable: {trainable:,})")
        
        return model, config
    
    def setup_training(self, model):
        """Setup optimizer and loss function"""
        
        print("\n⚙️ Setting up training...")
        
        criterion = nn.CrossEntropyLoss()
        
        optimizer = optim.Adam(
            model.parameters(),
            lr=self.config.learning_rate,
            weight_decay=self.config.weight_decay
        )
        
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            optimizer,
            mode='min',
            factor=0.5,
            patience=5
        )
        
        print(f"   ✅ Loss: CrossEntropyLoss")
        print(f"   ✅ Optimizer: Adam (lr={self.config.learning_rate})")
        print(f"   ✅ Scheduler: ReduceLROnPlateau")
        
        return criterion, optimizer, scheduler
    
    def train_epoch(self, model, train_loader, criterion, optimizer):
        """Train single epoch"""
        
        model.train()
        total_loss = 0
        correct = 0
        total = 0
        
        for batch_X, batch_y in train_loader:
            batch_X = batch_X.to(self.device)
            batch_y = batch_y.to(self.device)
            
            # Forward
            optimizer.zero_grad()
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            
            # Backward
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            
            # Metrics
            total_loss += loss.item() * batch_y.size(0)
            _, predicted = torch.max(outputs.data, 1)
            total += batch_y.size(0)
            correct += (predicted == batch_y).sum().item()
        
        avg_loss = total_loss / total
        accuracy = 100 * correct / total
        
        return avg_loss, accuracy
    
    def validate(self, model, val_loader, criterion):
        """Validate model"""
        
        model.eval()
        total_loss = 0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for batch_X, batch_y in val_loader:
                batch_X = batch_X.to(self.device)
                batch_y = batch_y.to(self.device)
                
                outputs = model(batch_X)
                loss = criterion(outputs, batch_y)
                
                total_loss += loss.item() * batch_y.size(0)
                _, predicted = torch.max(outputs.data, 1)
                total += batch_y.size(0)
                correct += (predicted == batch_y).sum().item()
        
        avg_loss = total_loss / total
        accuracy = 100 * correct / total
        
        return avg_loss, accuracy
    
    def train(self, model, train_loader, val_loader, criterion, optimizer, scheduler):
        """Complete training loop"""
        
        print(f"\n🚀 Starting training (max {self.config.num_epochs} epochs)...")
        print("=" * 70)
        
        patience_counter = 0
        
        for epoch in range(self.config.num_epochs):
            # Train
            train_loss, train_acc = self.train_epoch(model, train_loader, criterion, optimizer)
            
            # Validate
            val_loss, val_acc = self.validate(model, val_loader, criterion)
            
            # Update history
            self.history['train_loss'].append(train_loss)
            self.history['train_acc'].append(train_acc)
            self.history['val_loss'].append(val_loss)
            self.history['val_acc'].append(val_acc)
            
            # Learning rate scheduling
            scheduler.step(val_loss)
            
            # Logging
            if (epoch + 1) % self.config.log_interval == 0:
                print(f"Epoch [{epoch+1:3d}/{self.config.num_epochs}] | "
                      f"Train Loss: {train_loss:.4f} Acc: {train_acc:.2f}% | "
                      f"Val Loss: {val_loss:.4f} Acc: {val_acc:.2f}%")
            
            # MLflow logging
            if HAS_MLFLOW:
                mlflow.log_metrics({
                    'train_loss': train_loss,
                    'train_acc': train_acc,
                    'val_loss': val_loss,
                    'val_acc': val_acc
                }, step=epoch)
            
            # Early stopping
            if val_acc > self.best_metrics['val_accuracy']:
                self.best_metrics['val_accuracy'] = val_acc
                self.best_metrics['val_loss'] = val_loss
                self.best_metrics['epoch'] = epoch
                patience_counter = 0
                
                # Save best model
                if self.config.save_best_model:
                    self._save_model(model, 'ft_transformer_best.pt')
            else:
                patience_counter += 1
                if patience_counter >= self.config.patience:
                    print(f"\n⏸ Early stopping at epoch {epoch + 1}")
                    break
        
        print("=" * 70)
        print(f"✅ Training complete!")
        print(f"   Best accuracy: {self.best_metrics['val_accuracy']:.2f}% (epoch {self.best_metrics['epoch']+1})")
    
    def evaluate(self, model, test_loader):
        """Evaluate on test set"""
        
        print(f"\n📊 Evaluating on test set...")
        
        model.eval()
        all_preds = []
        all_targets = []
        
        with torch.no_grad():
            for batch_X, batch_y in test_loader:
                batch_X = batch_X.to(self.device)
                
                outputs = model(batch_X)
                _, predicted = torch.max(outputs.data, 1)
                
                all_preds.extend(predicted.cpu().numpy())
                all_targets.extend(batch_y.numpy())
        
        all_preds = np.array(all_preds)
        all_targets = np.array(all_targets)
        
        # Calculate metrics
        from sklearn.metrics import (
            accuracy_score, precision_score, recall_score,
            f1_score, roc_auc_score
        )
        
        accuracy = accuracy_score(all_targets, all_preds)
        precision = precision_score(all_targets, all_preds)
        recall = recall_score(all_targets, all_preds)
        f1 = f1_score(all_targets, all_preds)
        roc_auc = roc_auc_score(all_targets, all_preds)
        
        metrics = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'roc_auc': roc_auc
        }
        
        print(f"\n📈 Test Metrics:")
        print(f"   Accuracy:  {accuracy:.4f} (target: {EVAL_TARGETS['accuracy']['target']})")
        print(f"   Precision: {precision:.4f} (target: {EVAL_TARGETS['precision']['target']})")
        print(f"   Recall:    {recall:.4f} (target: {EVAL_TARGETS['recall']['target']})")
        print(f"   F1-Score:  {f1:.4f} (target: {EVAL_TARGETS['f1_score']['target']})")
        print(f"   ROC-AUC:   {roc_auc:.4f} (target: {EVAL_TARGETS['roc_auc']['target']})")
        
        return metrics
    
    def _save_model(self, model, filename):
        """Save model checkpoint"""
        
        path = self.models_dir / filename
        torch.save(model.state_dict(), path)
        print(f"   💾 Saved to {filename}")
    
    def save_artifacts(self, model, model_config):
        """Save final model and metadata"""
        
        print(f"\n💾 Saving artifacts...")
        
        # Save model
        model_path = self.models_dir / 'ft_transformer_final.pt'
        torch.save(model.state_dict(), model_path)
        print(f"   ✅ Model: {model_path}")
        
        # Save config
        config_path = self.models_dir / 'model_config.json'
        config_dict = {
            'num_features': model_config.num_features,
            'num_classes': model_config.num_classes,
            'd_model': model_config.d_model,
            'num_heads': model_config.num_heads,
            'num_layers': model_config.num_layers,
            'dropout': model_config.dropout,
            'best_val_accuracy': float(self.best_metrics['val_accuracy']),
            'best_epoch': self.best_metrics['epoch'],
            'trained_at': datetime.now().isoformat()
        }
        
        with open(config_path, 'w') as f:
            json.dump(config_dict, f, indent=2)
        print(f"   ✅ Config: {config_path}")
        
        # Save metrics
        metrics_path = self.models_dir / 'training_metrics.json'
        with open(metrics_path, 'w') as f:
            json.dump(self.history, f, indent=2)
        print(f"   ✅ Metrics: {metrics_path}")
    
    def run(self):
        """Execute complete training pipeline"""
        
        print("=" * 70)
        print("🚀 ML Model V2: FT-Transformer Training Phase")
        print("=" * 70)
        
        # Load data
        X_train, y_train, X_val, y_val, X_test, y_test = self.load_data()
        
        # Create dataloaders
        train_loader, val_loader, test_loader = self.create_dataloaders(
            X_train, y_train, X_val, y_val, X_test, y_test
        )
        
        # Initialize model
        model, model_config = self.initialize_model()
        
        # Setup training
        criterion, optimizer, scheduler = self.setup_training(model)
        
        # MLflow setup
        if HAS_MLFLOW:
            mlflow.set_experiment('ft_transformer_legal_matching')
            mlflow.start_run()
            mlflow.log_params({
                'batch_size': self.config.batch_size,
                'learning_rate': self.config.learning_rate,
                'num_epochs': self.config.num_epochs,
                'd_model': self.config.d_model,
                'num_layers': self.config.num_layers
            })
        
        # Train
        self.train(model, train_loader, val_loader, criterion, optimizer, scheduler)
        
        # Evaluate
        test_metrics = self.evaluate(model, test_loader)
        
        # Save artifacts
        self.save_artifacts(model, model_config)
        
        # MLflow finalize
        if HAS_MLFLOW:
            mlflow.log_metrics(test_metrics)
            mlflow.pytorch.log_model(model, 'ft_transformer')
            mlflow.end_run()
        
        print("\n" + "=" * 70)
        print("✅ Training Complete!")
        print("=" * 70)
        print(f"\n📝 Next step: Run Phase 5 - Evaluation")
        print("   python scripts/05_evaluate_model.py")


if __name__ == '__main__':
    config = TrainingConfig()
    trainer = FTTransformerTrainer(config)
    trainer.run()
