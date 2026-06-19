"""
Risk service.

Main risk calculation engine that combines device, location,
transaction, and ML analysis to produce a comprehensive risk score.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass
import asyncio

from app.services.device_service import DeviceService
from app.services.location_service import LocationService
from app.services.transaction_service import TransactionService
from app.services.alert_service import AlertService
from app.services.case_service import CaseService
from app.ml.risk_rules import calculate_risk_score, RiskFactors, get_risk_level_and_action, is_unusual_hour
from app.ml.predict import predict_fraud
from app.models.user import User
from app.models.login_event import LoginEvent


@dataclass
class LoginRiskResult:
    """Result of login risk analysis."""
    risk_score: int
    risk_level: str
    risk_reasons: list[str]
    recommended_action: str
    is_new_device: bool
    is_new_location: bool
    login_time: datetime
    ml_prediction: Optional[dict] = None


@dataclass
class TransactionRiskResult:
    """Result of transaction risk analysis."""
    risk_score: int
    risk_level: str
    risk_reasons: list[str]
    recommended_action: str
    is_high_amount: bool
    is_new_beneficiary: bool


class RiskService:
    """Service for comprehensive risk analysis."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.device_service = DeviceService(db)
        self.location_service = LocationService(db)
        self.transaction_service = TransactionService(db)
        self.alert_service = AlertService(db)
        self.case_service = CaseService(db)

    async def _get_failed_attempts(self, user_id: int, hours: int = 24) -> int:
        """Count failed login attempts in the last N hours."""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        result = await self.db.execute(
            select(func.count(LoginEvent.login_id)).where(
                LoginEvent.user_id == user_id,
                LoginEvent.is_successful == False,
                LoginEvent.login_time >= cutoff,
            )
        )
        return result.scalar() or 0

    async def _save_login_event(
        self,
        user_id: int,
        device_id: str,
        browser: str,
        os: str,
        city: str,
        ip_address: str,
        login_time: datetime,
        is_successful: bool,
        risk_score: int,
        risk_level: str,
        action_taken: str,
        is_new_device: bool,
        is_new_location: bool,
    ) -> LoginEvent:
        """Persist a login event record."""
        login_event = LoginEvent(
            user_id=user_id,
            ip_address=ip_address,
            city=city,
            country="India",
            device_id=device_id,
            browser=browser,
            os=os,
            login_time=login_time,
            is_successful=is_successful,
            risk_score=risk_score,
            risk_level=risk_level,
            action_taken=action_taken,
            is_new_device=is_new_device,
            is_new_location=is_new_location,
        )
        self.db.add(login_event)
        await self.db.flush()
        return login_event

    async def analyze_login_risk(
        self,
        user: User,
        device_id: str,
        device_name: str,
        browser: str,
        os: str,
        city: str,
        ip_address: str,
        login_time: Optional[datetime] = None,
    ) -> LoginRiskResult:
        """
        Comprehensive login risk analysis.

        Combines rule-based and ML-based analysis to produce
        a risk score with explainable reasons.
        """
        if login_time is None:
            login_time = datetime.utcnow()

        # Parallelize independent DB reads
        is_new_device, is_trusted, is_new_location, is_impossible_travel, failed_attempts = await asyncio.gather(
            self.device_service.is_new_device(user.user_id, device_id),
            self.device_service.is_trusted_device(user.user_id, device_id),
            self.location_service.is_new_location(user.user_id, city),
            self.location_service.is_impossible_travel(user.user_id, city, login_time),
            self._get_failed_attempts(user.user_id),
        )

        # Check night login (10 PM - 5 AM)
        is_night_login = is_unusual_hour(login_time.hour)

        # Rule-based risk calculation
        risk_factors = RiskFactors(
            is_new_device=is_new_device,
            is_new_location=is_new_location,
            is_night_login=is_night_login,
            failed_attempts=failed_attempts,
            is_impossible_travel=is_impossible_travel,
        )
        rule_result = calculate_risk_score(risk_factors)

        # ML prediction
        ml_prediction = predict_fraud(
            is_new_device=is_new_device,
            is_new_location=is_new_location,
            login_hour=login_time.hour,
            failed_attempts=failed_attempts,
        )

        # Combine scores (weighted average: 60% rules, 40% ML)
        combined_score = int(rule_result.risk_score * 0.6 + ml_prediction["risk_score"] * 0.4)
        combined_score = min(combined_score, 100)

        # Determine final risk level and action
        risk_level, action = get_risk_level_and_action(combined_score)

        # Build reasons list
        reasons = rule_result.risk_reasons.copy()
        if ml_prediction["model_used"] == "ml" and ml_prediction["fraud_probability"] > 0.7:
            reasons.append("ML model flagged high fraud probability")

        # Save device record and login event in parallel
        await asyncio.gather(
            self.device_service.save_device(
                user_id=user.user_id,
                device_id=device_id,
                device_name=device_name,
                browser=browser,
                os=os,
                is_trusted=is_trusted,
            ),
            self._save_login_event(
                user_id=user.user_id,
                device_id=device_id,
                browser=browser,
                os=os,
                city=city,
                ip_address=ip_address,
                login_time=login_time,
                is_successful=True,
                risk_score=combined_score,
                risk_level=risk_level,
                action_taken=action,
                is_new_device=is_new_device,
                is_new_location=is_new_location,
            ),
        )

        # Create alert for medium/high risk (single alert, not duplicate)
        if risk_level in ["Medium", "High"]:
            alert_type = "new_device" if is_new_device else "unusual_location"
            if is_impossible_travel:
                alert_type = "impossible_travel"
            elif risk_level == "High":
                alert_type = "high_risk_login"

            alert = await self.alert_service.create_alert(
                user_id=user.user_id,
                alert_type=alert_type,
                risk_level=risk_level,
                message=f"Login risk detected: {', '.join(reasons)}",
            )

            # Create fraud case for high risk (reuse the same alert)
            if risk_level == "High":
                await self.case_service.create_case(
                    user_id=user.user_id,
                    alert_id=alert.alert_id,
                    risk_score=combined_score,
                )

        return LoginRiskResult(
            risk_score=combined_score,
            risk_level=risk_level,
            risk_reasons=reasons,
            recommended_action=action,
            is_new_device=is_new_device,
            is_new_location=is_new_location,
            login_time=login_time,
            ml_prediction=ml_prediction,
        )

    async def analyze_transaction_risk(
        self,
        user: User,
        amount: float,
        beneficiary_id: str,
        beneficiary_name: str,
        city: str,
    ) -> TransactionRiskResult:
        """
        Analyze transaction risk.

        Checks amount, beneficiary, and location factors.
        Creates alerts and fraud cases for high-risk transactions.
        """
        # Check transaction factors
        is_high_amount = await self.transaction_service.is_high_amount(user.user_id, amount)
        is_new_beneficiary = await self.transaction_service.is_new_beneficiary(
            user.user_id, beneficiary_id
        )

        # Check location risk
        is_new_location = await self.location_service.is_new_location(user.user_id, city)

        # Rule-based scoring for transaction
        risk_factors = RiskFactors(
            is_new_location=is_new_location,
            is_high_amount=is_high_amount,
            is_new_beneficiary=is_new_beneficiary,
            transaction_amount=amount,
        )
        rule_result = calculate_risk_score(risk_factors)

        # ML prediction for transaction
        ml_prediction = predict_fraud(
            is_new_device=False,
            is_new_location=is_new_location,
            login_hour=datetime.utcnow().hour,
            failed_attempts=0,
            amount=amount,
            is_new_beneficiary=is_new_beneficiary,
            transaction_hour=datetime.utcnow().hour,
        )

        # Combine scores
        combined_score = int(rule_result.risk_score * 0.6 + ml_prediction["risk_score"] * 0.4)
        combined_score = min(combined_score, 100)

        # Determine risk level
        risk_level, action = get_risk_level_and_action(combined_score)

        reasons = rule_result.risk_reasons.copy()

        # Create alert for medium/high risk transactions
        if risk_level in ["Medium", "High"]:
            alert_type = "suspicious_transaction"
            if is_high_amount and is_new_beneficiary:
                alert_type = "high_value_new_beneficiary"

            alert = await self.alert_service.create_alert(
                user_id=user.user_id,
                alert_type=alert_type,
                risk_level=risk_level,
                message=f"Transaction risk detected (INR {amount:,.0f}): {', '.join(reasons)}",
            )

            # Create fraud case for high risk transactions
            if risk_level == "High":
                await self.case_service.create_case(
                    user_id=user.user_id,
                    alert_id=alert.alert_id,
                    risk_score=combined_score,
                )

        return TransactionRiskResult(
            risk_score=combined_score,
            risk_level=risk_level,
            risk_reasons=reasons,
            recommended_action=action,
            is_high_amount=is_high_amount,
            is_new_beneficiary=is_new_beneficiary,
        )
