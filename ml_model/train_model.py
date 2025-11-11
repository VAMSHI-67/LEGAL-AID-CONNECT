import os
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.regularizers import l2


DATA_PATH = os.path.join("ml_model", "matchmaking_dataset.csv")
MODEL_PATH = os.path.join("ml_model", "lawyer_match_model.h5")
ENCODER_PATH = os.path.join("ml_model", "encoder.pkl")
SCALER_PATH = os.path.join("ml_model", "scaler.pkl")
PLOTS_DIR = os.path.join("ml_model", "plots")


def load_data(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found at {path}. Run generate_data.py first.")
    return pd.read_csv(path)


def preprocess(df: pd.DataFrame):
    # Feature engineering - create interaction features
    df = df.copy()
    df['budget_fee_ratio'] = df['budget'] / (df['consultation_fee'] + 1)
    df['experience_success'] = df['experience'] * df['success_rate']
    df['urgency_complexity'] = df['urgency_level'] * df['case_complexity_score']
    df['rating_availability'] = df['rating'] * df['availability']
    df['budget_per_urgency'] = df['budget'] / (df['urgency_level'] + 1)
    df['fee_rating_ratio'] = df['consultation_fee'] / (df['rating'] + 0.1)
    
    # Separate features and target
    y = df["match"].astype(int).values

    categorical_cols = [
        "case_type",
        "location",
        "preferred_language",
        "specialization",
        "city",
    ]
    numeric_cols = [
        "urgency_level",
        "budget",
        "case_complexity_score",
        "experience",
        "success_rate",
        "rating",
        "consultation_fee",
        "availability",
        "budget_fee_ratio",
        "experience_success",
        "urgency_complexity",
        "rating_availability",
        "budget_per_urgency",
        "fee_rating_ratio",
    ]

    X_cat = df[categorical_cols].astype(str)
    X_num = df[numeric_cols].astype(float)

    encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    scaler = StandardScaler()

    X_cat_enc = encoder.fit_transform(X_cat)
    X_num_scaled = scaler.fit_transform(X_num)

    X = np.hstack([X_cat_enc, X_num_scaled])
    return X, y, encoder, scaler


def build_model(input_dim: int) -> Sequential:
    """Build optimized neural network for 90%+ accuracy target"""
    model = Sequential(
        [
            # First block - very wide initial layer
            Dense(512, activation="relu", input_dim=input_dim, kernel_regularizer=l2(0.0005)),
            BatchNormalization(),
            Dropout(0.5),
            
            # Second block
            Dense(256, activation="relu", kernel_regularizer=l2(0.0005)),
            BatchNormalization(),
            Dropout(0.4),
            
            # Third block
            Dense(128, activation="relu", kernel_regularizer=l2(0.0005)),
            BatchNormalization(),
            Dropout(0.3),
            
            # Fourth block
            Dense(64, activation="relu", kernel_regularizer=l2(0.0005)),
            BatchNormalization(),
            Dropout(0.25),
            
            # Fifth block
            Dense(32, activation="relu", kernel_regularizer=l2(0.0005)),
            BatchNormalization(),
            Dropout(0.2),
            
            # Sixth block
            Dense(16, activation="relu", kernel_regularizer=l2(0.0005)),
            Dropout(0.1),
            
            # Output layer
            Dense(1, activation="sigmoid"),
        ]
    )
    
    # Use optimized learning rate
    optimizer = Adam(learning_rate=0.0015, beta_1=0.9, beta_2=0.999)
    
    model.compile(
        optimizer=optimizer,
        loss="binary_crossentropy",
        metrics=[
            "accuracy",
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
            tf.keras.metrics.AUC(name="auc")
        ]
    )
    return model


def plot_history(history: tf.keras.callbacks.History, out_dir: str):
    os.makedirs(out_dir, exist_ok=True)

    # Accuracy
    plt.figure(figsize=(10, 6))
    plt.plot(history.history["accuracy"], label="Train Accuracy", linewidth=2)
    plt.plot(history.history["val_accuracy"], label="Val Accuracy", linewidth=2)
    plt.title("Training vs Validation Accuracy", fontsize=14, fontweight='bold')
    plt.xlabel("Epoch", fontsize=12)
    plt.ylabel("Accuracy", fontsize=12)
    plt.legend(fontsize=10)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "accuracy.png"), dpi=300)
    plt.close()

    # Loss
    plt.figure(figsize=(10, 6))
    plt.plot(history.history["loss"], label="Train Loss", linewidth=2)
    plt.plot(history.history["val_loss"], label="Val Loss", linewidth=2)
    plt.title("Training vs Validation Loss", fontsize=14, fontweight='bold')
    plt.xlabel("Epoch", fontsize=12)
    plt.ylabel("Loss", fontsize=12)
    plt.legend(fontsize=10)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "loss.png"), dpi=300)
    plt.close()
    
    # Precision and Recall
    plt.figure(figsize=(10, 6))
    plt.plot(history.history["precision"], label="Train Precision", linewidth=2)
    plt.plot(history.history["val_precision"], label="Val Precision", linewidth=2)
    plt.plot(history.history["recall"], label="Train Recall", linewidth=2)
    plt.plot(history.history["val_recall"], label="Val Recall", linewidth=2)
    plt.title("Precision & Recall Over Epochs", fontsize=14, fontweight='bold')
    plt.xlabel("Epoch", fontsize=12)
    plt.ylabel("Score", fontsize=12)
    plt.legend(fontsize=10)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "precision_recall.png"), dpi=300)
    plt.close()
    
    # AUC
    if "auc" in history.history:
        plt.figure(figsize=(10, 6))
        plt.plot(history.history["auc"], label="Train AUC", linewidth=2)
        plt.plot(history.history["val_auc"], label="Val AUC", linewidth=2)
        plt.title("AUC Score Over Epochs", fontsize=14, fontweight='bold')
        plt.xlabel("Epoch", fontsize=12)
        plt.ylabel("AUC", fontsize=12)
        plt.legend(fontsize=10)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(os.path.join(out_dir, "auc.png"), dpi=300)
        plt.close()


def main():
    df = load_data(DATA_PATH)

    # Split first to avoid data leakage in scaling/encoding
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df["match"].astype(int))

    # Fit encoders/scalers on train only
    X_train, y_train, encoder, scaler = preprocess(train_df)
    
    # Apply same feature engineering to test set
    test_df_eng = test_df.copy()
    test_df_eng['budget_fee_ratio'] = test_df_eng['budget'] / (test_df_eng['consultation_fee'] + 1)
    test_df_eng['experience_success'] = test_df_eng['experience'] * test_df_eng['success_rate']
    test_df_eng['urgency_complexity'] = test_df_eng['urgency_level'] * test_df_eng['case_complexity_score']
    test_df_eng['rating_availability'] = test_df_eng['rating'] * test_df_eng['availability']
    test_df_eng['budget_per_urgency'] = test_df_eng['budget'] / (test_df_eng['urgency_level'] + 1)
    test_df_eng['fee_rating_ratio'] = test_df_eng['consultation_fee'] / (test_df_eng['rating'] + 0.1)
    
    # Transform test using fitted encoders/scalers
    X_test_cat = encoder.transform(test_df_eng[["case_type", "location", "preferred_language", "specialization", "city"]].astype(str))
    X_test_num = scaler.transform(test_df_eng[["urgency_level", "budget", "case_complexity_score", "experience", "success_rate", "rating", "consultation_fee", "availability", "budget_fee_ratio", "experience_success", "urgency_complexity", "rating_availability", "budget_per_urgency", "fee_rating_ratio"]].astype(float))
    X_test = np.hstack([X_test_cat, X_test_num])
    y_test = test_df["match"].astype(int).values

    # Compute class weights to balance classes if imbalanced
    classes = np.unique(y_train)
    class_weights = compute_class_weight(class_weight="balanced", classes=classes, y=y_train)
    class_weight_dict = {int(c): float(w) for c, w in zip(classes, class_weights)}

    model = build_model(input_dim=X_train.shape[1])

    callbacks = [
        EarlyStopping(monitor="val_loss", patience=20, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor="val_loss", factor=0.3, patience=7, min_lr=1e-7, verbose=1),
        ModelCheckpoint(MODEL_PATH, monitor="val_accuracy", save_best_only=True, verbose=1),
    ]

    history = model.fit(
        X_train,
        y_train,
        validation_split=0.2,
        epochs=150,
        batch_size=64,
        class_weight=class_weight_dict,
        callbacks=callbacks,
        verbose=1,
    )

    # Save preprocessing artifacts
    joblib.dump(encoder, ENCODER_PATH)
    joblib.dump(scaler, SCALER_PATH)

    # Evaluate on test set
    y_prob = model.predict(X_test).ravel()
    y_pred = (y_prob >= 0.5).astype(int)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    auc = roc_auc_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "="*60)
    print("TEST SET EVALUATION")
    print("="*60)
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
    
    if acc >= 0.90:
        print("\n✓ EXCELLENT! Model exceeds target accuracy of 90%")
    elif acc >= 0.85:
        print("\n✓ GOOD! Model shows strong performance")
    elif acc >= 0.70:
        print("\n⚠ MODERATE performance. Consider additional tuning")
    else:
        print("\n⚠ Model needs further optimization")
    print("="*60)

    # Save plots
    plot_history(history, PLOTS_DIR)


if __name__ == "__main__":
    main()


