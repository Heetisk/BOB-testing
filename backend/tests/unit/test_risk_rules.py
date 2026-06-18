"""
Tests for rule-based risk scoring engine.
"""

import pytest
from app.ml.risk_rules import (
    calculate_risk_score,
    get_risk_level,
    get_recommended_action,
    RiskFactors,
)


class TestRiskScoreCalculation:
    """Test cases for risk score calculation."""

    def test_low_risk_all_clear(self):
        """Test low risk when no risk factors present."""
        factors = RiskFactors()
        result = calculate_risk_score(factors)

        assert result.risk_score == 0
        assert result.risk_level == "Low"
        assert result.recommended_action == "Allow"
        assert len(result.risk_reasons) == 0

    def test_new_device_risk(self):
        """Test risk increase for new device."""
        factors = RiskFactors(is_new_device=True)
        result = calculate_risk_score(factors)

        assert result.risk_score == 25
        assert "New device detected" in result.risk_reasons

    def test_new_location_risk(self):
        """Test risk increase for new location."""
        factors = RiskFactors(is_new_location=True)
        result = calculate_risk_score(factors)

        assert result.risk_score == 20
        assert "Login from unusual location" in result.risk_reasons

    def test_night_login_risk(self):
        """Test risk increase for night login."""
        factors = RiskFactors(is_night_login=True)
        result = calculate_risk_score(factors)

        assert result.risk_score == 10
        assert "Unusual login time (night)" in result.risk_reasons

    def test_failed_attempts_risk(self):
        """Test risk increase for failed attempts."""
        factors = RiskFactors(failed_attempts=3)
        result = calculate_risk_score(factors)

        assert result.risk_score == 15  # 3 * 5
        assert "3 failed login attempt(s)" in result.risk_reasons

    def test_high_amount_risk(self):
        """Test risk increase for high transaction amount."""
        factors = RiskFactors(is_high_amount=True, transaction_amount=75000)
        result = calculate_risk_score(factors)

        assert result.risk_score == 25
        assert any("75,000" in reason for reason in result.risk_reasons)

    def test_new_beneficiary_risk(self):
        """Test risk increase for new beneficiary."""
        factors = RiskFactors(is_new_beneficiary=True)
        result = calculate_risk_score(factors)

        assert result.risk_score == 20
        assert "New beneficiary added" in result.risk_reasons

    def test_impossible_travel_risk(self):
        """Test risk increase for impossible travel."""
        factors = RiskFactors(is_impossible_travel=True)
        result = calculate_risk_score(factors)

        assert result.risk_score == 30
        assert "Impossible travel detected" in result.risk_reasons

    def test_medium_risk_combined(self):
        """Test medium risk with multiple factors."""
        factors = RiskFactors(
            is_new_device=True,
            is_new_location=True,
            is_night_login=True,
        )
        result = calculate_risk_score(factors)

        assert 30 < result.risk_score <= 70
        assert result.risk_level == "Medium"
        assert result.recommended_action == "Step-up verification"

    def test_high_risk_combined(self):
        """Test high risk with many factors."""
        factors = RiskFactors(
            is_new_device=True,
            is_new_location=True,
            is_night_login=True,
            failed_attempts=3,
            is_high_amount=True,
            is_new_beneficiary=True,
            transaction_amount=90000,
        )
        result = calculate_risk_score(factors)

        assert result.risk_score > 70
        assert result.risk_level == "High"
        assert result.recommended_action == "Block and alert"

    def test_score_capped_at_100(self):
        """Test that risk score is capped at 100."""
        factors = RiskFactors(
            is_new_device=True,
            is_new_location=True,
            is_night_login=True,
            failed_attempts=5,
            is_high_amount=True,
            is_new_beneficiary=True,
            is_impossible_travel=True,
            transaction_amount=100000,
        )
        result = calculate_risk_score(factors)

        assert result.risk_score <= 100


class TestRiskLevel:
    """Test cases for risk level determination."""

    def test_low_level(self):
        assert get_risk_level(0) == "Low"
        assert get_risk_level(15) == "Low"
        assert get_risk_level(30) == "Low"

    def test_medium_level(self):
        assert get_risk_level(31) == "Medium"
        assert get_risk_level(50) == "Medium"
        assert get_risk_level(70) == "Medium"

    def test_high_level(self):
        assert get_risk_level(71) == "High"
        assert get_risk_level(90) == "High"
        assert get_risk_level(100) == "High"


class TestRecommendedAction:
    """Test cases for recommended action."""

    def test_low_action(self):
        assert get_recommended_action("Low") == "Allow"

    def test_medium_action(self):
        assert get_recommended_action("Medium") == "Step-up verification"

    def test_high_action(self):
        assert get_recommended_action("High") == "Block and alert"
