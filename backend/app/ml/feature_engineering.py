"""
Feature engineering for ML model.

Converts raw login/transaction data into numerical features
that can be used by the scikit-learn model.
"""

from typing import Optional

from app.ml.risk_rules import is_unusual_hour


def extract_login_features(
    is_new_device: bool,
    is_new_location: bool,
    login_hour: int,
    failed_attempts: int,
    is_night_login: Optional[bool] = None,
) -> list[float]:
    """
    Extract features from login event data.

    Args:
        is_new_device: Whether this is a new device
        is_new_location: Whether this is a new location
        login_hour: Hour of login (0-23)
        failed_attempts: Number of failed attempts before this login
        is_night_login: Whether login is during night hours

    Returns:
        List of numerical features
    """
    if is_night_login is None:
        is_night_login = is_unusual_hour(login_hour)

    return [
        float(is_new_device),
        float(is_new_location),
        float(is_night_login),
        login_hour,
        failed_attempts,
    ]


def extract_transaction_features(
    amount: float,
    is_new_beneficiary: bool,
    transaction_hour: int,
    user_avg_amount: float = 0.0,
    user_std_amount: float = 1.0,
) -> list[float]:
    """
    Extract features from transaction data.

    Args:
        amount: Transaction amount
        is_new_beneficiary: Whether this is a new beneficiary
        transaction_hour: Hour of transaction (0-23)
        user_avg_amount: User's average transaction amount
        user_std_amount: User's transaction amount standard deviation

    Returns:
        List of numerical features
    """
    # Normalize amount relative to user's history
    if user_std_amount > 0:
        amount_zscore = (amount - user_avg_amount) / user_std_amount
    else:
        amount_zscore = 0.0

    return [
        amount,
        amount_zscore,
        float(is_new_beneficiary),
        transaction_hour,
        float(amount > 50000),  # High amount flag
    ]


def combine_features(
    login_features: list[float],
    transaction_features: Optional[list[float]] = None,
) -> list[float]:
    """
    Combine login and transaction features into a single feature vector.

    Args:
        login_features: Features from login event
        transaction_features: Optional features from transaction

    Returns:
        Combined feature vector
    """
    features = login_features.copy()

    if transaction_features:
        features.extend(transaction_features)
    else:
        # Pad with zeros if no transaction data
        features.extend([0.0] * 5)

    return features


def get_feature_names() -> list[str]:
    """Get feature names for model interpretability."""
    return [
        "is_new_device",
        "is_new_location",
        "is_night_login",
        "login_hour",
        "failed_attempts",
        "amount",
        "amount_zscore",
        "is_new_beneficiary",
        "transaction_hour",
        "is_high_amount",
    ]
