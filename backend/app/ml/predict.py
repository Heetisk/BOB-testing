"""
ML prediction module.

Loads trained model and makes predictions on new data.
"""

import os
import numpy as np
import joblib
from typing import Optional

from app.core.config import get_settings
from app.ml.feature_engineering import extract_login_features, extract_transaction_features, combine_features
from app.ml.risk_rules import is_unusual_hour

settings = get_settings()


class FraudPredictor:
    """Fraud prediction using trained ML model."""

    def __init__(self):
        self.model = None
        self.scaler = None
        self._loaded = False

    def load_model(self) -> bool:
        """Load the trained model and scaler from disk."""
        try:
            model_path = settings.MODEL_PATH
            scaler_path = settings.SCALER_PATH

            if not os.path.exists(model_path) or not os.path.exists(scaler_path):
                return False

            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            self._loaded = True
            return True
        except Exception:
            return False

    def predict(
        self,
        is_new_device: bool,
        is_new_location: bool,
        login_hour: int,
        failed_attempts: int,
        amount: float = 0.0,
        is_new_beneficiary: bool = False,
        transaction_hour: Optional[int] = None,
    ) -> dict:
        """
        Predict fraud probability for a login/transaction event.

        Args:
            is_new_device: Whether this is a new device
            is_new_location: Whether this is a new location
            login_hour: Hour of login (0-23)
            failed_attempts: Number of failed attempts
            amount: Transaction amount (0 if no transaction)
            is_new_beneficiary: Whether this is a new beneficiary
            transaction_hour: Hour of transaction (defaults to login_hour)

        Returns:
            Dictionary with prediction results
        """
        if not self._loaded:
            if not self.load_model():
                # Fallback to rule-based if model not available
                return self._fallback_prediction(
                    is_new_device, is_new_location, login_hour, failed_attempts
                )

        # Extract features
        login_features = extract_login_features(
            is_new_device=is_new_device,
            is_new_location=is_new_location,
            login_hour=login_hour,
            failed_attempts=failed_attempts,
        )

        transaction_features = extract_transaction_features(
            amount=amount,
            is_new_beneficiary=is_new_beneficiary,
            transaction_hour=transaction_hour or login_hour,
        )

        features = combine_features(login_features, transaction_features)
        features_array = np.array(features).reshape(1, -1)

        # Scale and predict
        features_scaled = self.scaler.transform(features_array)
        fraud_probability = self.model.predict_proba(features_scaled)[0][1]

        # Convert to risk score (0-100)
        risk_score = int(fraud_probability * 100)

        return {
            "fraud_probability": float(fraud_probability),
            "risk_score": risk_score,
            "model_used": "ml",
        }

    def _fallback_prediction(
        self,
        is_new_device: bool,
        is_new_location: bool,
        login_hour: int,
        failed_attempts: int,
    ) -> dict:
        """Simple rule-based fallback when ML model is not available."""
        score = 0
        if is_new_device:
            score += 25
        if is_new_location:
            score += 20
        if is_unusual_hour(login_hour):
            score += 10
        score += min(failed_attempts * 5, 20)

        return {
            "fraud_probability": score / 100.0,
            "risk_score": min(score, 100),
            "model_used": "rule_based_fallback",
        }


# Singleton instance
predictor = FraudPredictor()


def predict_fraud(
    is_new_device: bool,
    is_new_location: bool,
    login_hour: int,
    failed_attempts: int,
    amount: float = 0.0,
    is_new_beneficiary: bool = False,
    transaction_hour: Optional[int] = None,
) -> dict:
    """
    Predict fraud probability (convenience function).

    Returns:
        Dictionary with fraud_probability, risk_score, model_used
    """
    return predictor.predict(
        is_new_device=is_new_device,
        is_new_location=is_new_location,
        login_hour=login_hour,
        failed_attempts=failed_attempts,
        amount=amount,
        is_new_beneficiary=is_new_beneficiary,
        transaction_hour=transaction_hour,
    )
