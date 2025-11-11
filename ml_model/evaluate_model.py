import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    roc_auc_score,
    roc_curve
)
import tensorflow as tf
import matplotlib.pyplot as plt
import seaborn as sns


DATA_PATH = os.path.join("ml_model", "matchmaking_dataset.csv")
MODEL_PATH = os.path.join("ml_model", "lawyer_match_model.h5")
ENCODER_PATH = os.path.join("ml_model", "encoder.pkl")
SCALER_PATH = os.path.join("ml_model", "scaler.pkl")
PLOTS_DIR = os.path.join("ml_model", "evaluation_plots")


def load_artifacts():
    """Load trained model and preprocessing artifacts"""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Train the model first.")
    
    model = tf.keras.models.load_model(MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)
    scaler = joblib.load(SCALER_PATH)
    return model, encoder, scaler


def load_and_prepare_data():
    """Load dataset and prepare test set"""
    df = pd.read_csv(DATA_PATH)
    
    # Use same split as training
    train_df, test_df = train_test_split(
        df, test_size=0.2, random_state=42, stratify=df["match"].astype(int)
    )
    
    return test_df


def preprocess_test_data(test_df, encoder, scaler):
    """Preprocess test data using fitted encoder and scaler"""
    # Apply feature engineering
    test_df = test_df.copy()
    test_df['budget_fee_ratio'] = test_df['budget'] / (test_df['consultation_fee'] + 1)
    test_df['experience_success'] = test_df['experience'] * test_df['success_rate']
    test_df['urgency_complexity'] = test_df['urgency_level'] * test_df['case_complexity_score']
    test_df['rating_availability'] = test_df['rating'] * test_df['availability']
    test_df['budget_per_urgency'] = test_df['budget'] / (test_df['urgency_level'] + 1)
    test_df['fee_rating_ratio'] = test_df['consultation_fee'] / (test_df['rating'] + 0.1)
    
    categorical_cols = ["case_type", "location", "preferred_language", "specialization", "city"]
    numeric_cols = [
        "urgency_level", "budget", "case_complexity_score",
        "experience", "success_rate", "rating",
        "consultation_fee", "availability",
        "budget_fee_ratio", "experience_success", "urgency_complexity",
        "rating_availability", "budget_per_urgency", "fee_rating_ratio"
    ]
    
    X_test_cat = encoder.transform(test_df[categorical_cols].astype(str))
    X_test_num = scaler.transform(test_df[numeric_cols].astype(float))
    X_test = np.hstack([X_test_cat, X_test_num])
    y_test = test_df["match"].astype(int).values
    
    return X_test, y_test


def plot_confusion_matrix(y_true, y_pred, out_dir):
    """Plot confusion matrix"""
    cm = confusion_matrix(y_true, y_pred)
    
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=True)
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "confusion_matrix.png"))
    plt.close()
    
    return cm


def plot_roc_curve(y_true, y_prob, out_dir):
    """Plot ROC curve"""
    fpr, tpr, thresholds = roc_curve(y_true, y_prob)
    auc = roc_auc_score(y_true, y_prob)
    
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, label=f'ROC Curve (AUC = {auc:.4f})', linewidth=2)
    plt.plot([0, 1], [0, 1], 'k--', label='Random Classifier')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "roc_curve.png"))
    plt.close()
    
    return auc


def evaluate_model():
    """Main evaluation function"""
    print("=" * 60)
    print("EVALUATING MATCHMAKING MODEL")
    print("=" * 60)
    
    # Load model and artifacts
    print("\n[1/5] Loading model and preprocessing artifacts...")
    model, encoder, scaler = load_artifacts()
    print("✓ Model loaded successfully")
    
    # Load test data
    print("\n[2/5] Loading test dataset...")
    test_df = load_and_prepare_data()
    print(f"✓ Test set size: {len(test_df)} samples")
    
    # Preprocess test data
    print("\n[3/5] Preprocessing test data...")
    X_test, y_test = preprocess_test_data(test_df, encoder, scaler)
    print(f"✓ Feature shape: {X_test.shape}")
    print(f"✓ Class distribution: {np.bincount(y_test)}")
    
    # Make predictions
    print("\n[4/5] Making predictions...")
    y_prob = model.predict(X_test, verbose=0).ravel()
    y_pred = (y_prob >= 0.5).astype(int)
    print("✓ Predictions complete")
    
    # Calculate metrics
    print("\n[5/5] Calculating metrics...")
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    
    # Create plots directory
    os.makedirs(PLOTS_DIR, exist_ok=True)
    
    # Generate visualizations
    cm = plot_confusion_matrix(y_test, y_pred, PLOTS_DIR)
    auc = plot_roc_curve(y_test, y_prob, PLOTS_DIR)
    
    # Print results
    print("\n" + "=" * 60)
    print("EVALUATION RESULTS")
    print("=" * 60)
    print(f"\n📊 Overall Metrics:")
    print(f"   • Accuracy:  {acc:.4f} ({acc*100:.2f}%)")
    print(f"   • Precision: {prec:.4f} ({prec*100:.2f}%)")
    print(f"   • Recall:    {rec:.4f} ({rec*100:.2f}%)")
    print(f"   • F1-Score:  {f1:.4f}")
    print(f"   • ROC AUC:   {auc:.4f}")
    
    print(f"\n📈 Confusion Matrix:")
    print(f"   • True Negatives:  {cm[0][0]}")
    print(f"   • False Positives: {cm[0][1]}")
    print(f"   • False Negatives: {cm[1][0]}")
    print(f"   • True Positives:  {cm[1][1]}")
    
    print(f"\n📁 Visualizations saved to: {PLOTS_DIR}/")
    print(f"   • confusion_matrix.png")
    print(f"   • roc_curve.png")
    
    print("\n" + "=" * 60)
    print("DETAILED CLASSIFICATION REPORT")
    print("=" * 60)
    print(classification_report(y_test, y_pred, target_names=['No Match', 'Match']))
    
    # Determine if fine-tuning is needed
    print("\n" + "=" * 60)
    print("RECOMMENDATION")
    print("=" * 60)
    
    if acc >= 0.90 and f1 >= 0.88:
        print("✓ Model performance is EXCELLENT. Fine-tuning may provide marginal gains.")
    elif acc >= 0.85 and f1 >= 0.83:
        print("⚠ Model performance is GOOD. Fine-tuning recommended for improvement.")
    else:
        print("⚠ Model performance needs IMPROVEMENT. Fine-tuning strongly recommended.")
    
    print(f"\nCurrent Accuracy: {acc:.4f}")
    print(f"Target Accuracy:  0.90+")
    print("=" * 60)
    
    return {
        'accuracy': acc,
        'precision': prec,
        'recall': rec,
        'f1_score': f1,
        'roc_auc': auc
    }


if __name__ == "__main__":
    metrics = evaluate_model()
