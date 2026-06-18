"""
ML model training script.

Trains a RandomForest classifier on synthetic fraud data
and saves the model for prediction.
"""

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import StandardScaler
import joblib

from app.ml.feature_engineering import get_feature_names


def generate_synthetic_data(n_samples: int = 5000) -> pd.DataFrame:
    """
    Generate synthetic fraud detection training data.

    Args:
        n_samples: Number of samples to generate

    Returns:
        DataFrame with features and target
    """
    np.random.seed(42)

    amounts = np.random.exponential(scale=10000, size=n_samples)
    amount_mean = np.mean(amounts)
    amount_std = np.std(amounts) if np.std(amounts) > 0 else 1.0

    data = {
        "is_new_device": np.random.choice([0, 1], size=n_samples, p=[0.7, 0.3]),
        "is_new_location": np.random.choice([0, 1], size=n_samples, p=[0.75, 0.25]),
        "is_night_login": np.random.choice([0, 1], size=n_samples, p=[0.8, 0.2]),
        "login_hour": np.random.randint(0, 24, size=n_samples),
        "failed_attempts": np.random.choice([0, 1, 2, 3, 4, 5], size=n_samples, p=[0.5, 0.2, 0.1, 0.1, 0.05, 0.05]),
        "amount": amounts,
        "amount_zscore": (amounts - amount_mean) / amount_std,
        "is_new_beneficiary": np.random.choice([0, 1], size=n_samples, p=[0.8, 0.2]),
        "transaction_hour": np.random.randint(0, 24, size=n_samples),
        "is_high_amount": np.random.choice([0, 1], size=n_samples, p=[0.85, 0.15]),
    }

    df = pd.DataFrame(data)

    # Generate fraud labels based on rules (for synthetic data)
    fraud_probability = (
        df["is_new_device"] * 0.25 +
        df["is_new_location"] * 0.20 +
        df["is_night_login"] * 0.15 +
        (df["failed_attempts"] / 5) * 0.15 +
        df["is_high_amount"] * 0.15 +
        df["is_new_beneficiary"] * 0.10
    )

    # Add some noise
    fraud_probability += np.random.normal(0, 0.05, size=n_samples)
    fraud_probability = np.clip(fraud_probability, 0, 1)

    # Label as fraud if probability > 0.4
    df["is_fraud"] = (fraud_probability > 0.4).astype(int)

    return df


def train_model() -> dict:
    """
    Train the fraud detection model.

    Returns:
        Dictionary with training metrics
    """
    # Generate data
    df = generate_synthetic_data(5000)

    feature_names = get_feature_names()
    X = df[feature_names].values
    y = df["is_fraud"].values

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train_scaled, y_train)

    # Evaluate
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)

    # Save model and scaler
    model_dir = os.path.join(os.path.dirname(__file__), "model")
    os.makedirs(model_dir, exist_ok=True)

    model_path = os.path.join(model_dir, "model.pkl")
    scaler_path = os.path.join(model_dir, "scaler.pkl")

    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)

    return {
        "accuracy": accuracy,
        "precision": report["1"]["precision"],
        "recall": report["1"]["recall"],
        "f1_score": report["1"]["f1-score"],
        "model_path": model_path,
        "scaler_path": scaler_path,
    }


if __name__ == "__main__":
    metrics = train_model()
    print("Model trained successfully!")
    print(f"Accuracy: {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall: {metrics['recall']:.4f}")
    print(f"F1 Score: {metrics['f1_score']:.4f}")
