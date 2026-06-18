"""
Tests for ML prediction module.
"""

import pytest
from app.ml.predict import predict_fraud, FraudPredictor


class TestMLPrediction:
    """Test cases for ML fraud prediction."""

    def test_prediction_returns_expected_keys(self):
        """Test that prediction returns all expected keys."""
        result = predict_fraud(
            is_new_device=True,
            is_new_location=False,
            login_hour=14,
            failed_attempts=0,
        )

        assert "fraud_probability" in result
        assert "risk_score" in result
        assert "model_used" in result

    def test_prediction_probability_range(self):
        """Test that fraud probability is between 0 and 1."""
        result = predict_fraud(
            is_new_device=False,
            is_new_location=False,
            login_hour=12,
            failed_attempts=0,
        )

        assert 0 <= result["fraud_probability"] <= 1

    def test_prediction_score_range(self):
        """Test that risk score is between 0 and 100."""
        result = predict_fraud(
            is_new_device=True,
            is_new_location=True,
            login_hour=3,
            failed_attempts=2,
            amount=90000,
            is_new_beneficiary=True,
        )

        assert 0 <= result["risk_score"] <= 100

    def test_high_risk_prediction(self):
        """Test that suspicious factors increase fraud probability."""
        low_risk = predict_fraud(
            is_new_device=False,
            is_new_location=False,
            login_hour=12,
            failed_attempts=0,
        )

        high_risk = predict_fraud(
            is_new_device=True,
            is_new_location=True,
            login_hour=3,
            failed_attempts=3,
            amount=100000,
            is_new_beneficiary=True,
        )

        assert high_risk["fraud_probability"] > low_risk["fraud_probability"]

    def test_fallback_prediction(self):
        """Test fallback when model is not available."""
        predictor = FraudPredictor()
        predictor.model = None
        predictor.scaler = None
        predictor._loaded = False

        result = predictor._fallback_prediction(
            is_new_device=True,
            is_new_location=True,
            login_hour=3,
            failed_attempts=2,
        )

        assert result["model_used"] == "rule_based_fallback"
        assert result["risk_score"] == 65  # 25 (new device) + 20 (new location) + 10 (night) + 10 (2 failed * 5)
