"""
Rule-based risk scoring engine.

Each risk factor contributes points to the total risk score (0-100).
This approach is explainable and easy to demo in presentations.
"""

from dataclasses import dataclass


@dataclass
class RiskFactors:
    """Container for all risk factors that affect the risk score."""
    is_new_device: bool = False
    is_new_location: bool = False
    is_night_login: bool = False
    failed_attempts: int = 0
    is_high_amount: bool = False
    is_new_beneficiary: bool = False
    is_impossible_travel: bool = False
    transaction_amount: float = 0.0


@dataclass
class RiskResult:
    """Container for risk calculation results."""
    risk_score: int
    risk_level: str
    risk_reasons: list[str]
    recommended_action: str


# Risk point values for each factor
RISK_WEIGHTS = {
    "new_device": 25,
    "new_location": 20,
    "night_login": 10,
    "failed_attempts_per_attempt": 5,
    "high_amount": 25,
    "new_beneficiary": 20,
    "impossible_travel": 30,
}

# Thresholds for risk levels
RISK_THRESHOLDS = {
    "low": 30,
    "medium": 70,
    "high": 100,
}

# Actions based on risk level
RISK_ACTIONS = {
    "Low": "Allow",
    "Medium": "Step-up verification",
    "High": "Block and alert",
}


def calculate_risk_score(factors: RiskFactors) -> RiskResult:
    """
    Calculate risk score based on multiple factors.

    Args:
        factors: RiskFactors dataclass containing all risk indicators

    Returns:
        RiskResult with score, level, reasons, and recommended action
    """
    score = 0
    reasons = []

    # New device detection
    if factors.is_new_device:
        score += RISK_WEIGHTS["new_device"]
        reasons.append("New device detected")

    # New location detection
    if factors.is_new_location:
        score += RISK_WEIGHTS["new_location"]
        reasons.append("Login from unusual location")

    # Night login detection (10 PM - 5 AM)
    if factors.is_night_login:
        score += RISK_WEIGHTS["night_login"]
        reasons.append("Unusual login time (night)")

    # Failed login attempts
    if factors.failed_attempts > 0:
        attempt_points = min(factors.failed_attempts * RISK_WEIGHTS["failed_attempts_per_attempt"], 20)
        score += attempt_points
        reasons.append(f"{factors.failed_attempts} failed login attempt(s)")

    # High transaction amount
    if factors.is_high_amount:
        score += RISK_WEIGHTS["high_amount"]
        reasons.append(f"High-value transaction (INR {factors.transaction_amount:,.0f})")

    # New beneficiary
    if factors.is_new_beneficiary:
        score += RISK_WEIGHTS["new_beneficiary"]
        reasons.append("New beneficiary added")

    # Impossible travel (different city in short time)
    if factors.is_impossible_travel:
        score += RISK_WEIGHTS["impossible_travel"]
        reasons.append("Impossible travel detected")

    # Cap score at 100
    score = min(score, 100)

    risk_level = get_risk_level(score)
    action = get_recommended_action(risk_level)

    return RiskResult(
        risk_score=score,
        risk_level=risk_level,
        risk_reasons=reasons,
        recommended_action=action,
    )


def get_risk_level(score: int) -> str:
    """Convert numeric risk score to risk level string."""
    if score <= RISK_THRESHOLDS["low"]:
        return "Low"
    elif score <= RISK_THRESHOLDS["medium"]:
        return "Medium"
    else:
        return "High"


def get_recommended_action(risk_level: str) -> str:
    """Get recommended action based on risk level."""
    return RISK_ACTIONS.get(risk_level, "Allow")


def get_risk_level_and_action(score: int) -> tuple[str, str]:
    """Convert numeric score to (risk_level, recommended_action) tuple."""
    level = get_risk_level(score)
    action = get_recommended_action(level)
    return level, action


def is_unusual_hour(hour: int) -> bool:
    """Check if an hour falls in the unusual/night window (10 PM - 5 AM)."""
    return hour < 6 or hour >= 22
