"""
Dashboard routes.

Handles dashboard summary and chart data endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.api.dependencies import require_admin, get_current_user
from app.schemas.common import DashboardSummary
from app.models.user import User
from app.models.login_event import LoginEvent
from app.models.transaction import Transaction
from app.models.alert import Alert
from app.models.fraud_case import FraudCase
from app.models.device import Device

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get dashboard summary statistics (admin only)."""
    # Count users
    user_count = await db.execute(select(func.count(User.user_id)))
    total_users = user_count.scalar() or 0

    # Count logins
    login_count = await db.execute(select(func.count(LoginEvent.login_id)))
    total_logins = login_count.scalar() or 0

    # Count transactions
    transaction_count = await db.execute(select(func.count(Transaction.transaction_id)))
    total_transactions = transaction_count.scalar() or 0

    # Count alerts
    alert_count = await db.execute(select(func.count(Alert.alert_id)))
    total_alerts = alert_count.scalar() or 0

    # Count cases
    case_count = await db.execute(select(func.count(FraudCase.case_id)))
    total_cases = case_count.scalar() or 0

    # Count by risk level
    high_risk = await db.execute(
        select(func.count(LoginEvent.login_id)).where(LoginEvent.risk_level == "High")
    )
    medium_risk = await db.execute(
        select(func.count(LoginEvent.login_id)).where(LoginEvent.risk_level == "Medium")
    )
    low_risk = await db.execute(
        select(func.count(LoginEvent.login_id)).where(LoginEvent.risk_level == "Low")
    )

    # Count blocked transactions
    blocked = await db.execute(
        select(func.count(Transaction.transaction_id)).where(Transaction.status == "blocked")
    )

    return DashboardSummary(
        total_users=total_users,
        total_logins=total_logins,
        total_transactions=total_transactions,
        total_alerts=total_alerts,
        total_cases=total_cases,
        high_risk_logins=high_risk.scalar() or 0,
        medium_risk_logins=medium_risk.scalar() or 0,
        low_risk_logins=low_risk.scalar() or 0,
        blocked_transactions=blocked.scalar() or 0,
    )


@router.get("/risk-distribution")
async def get_risk_distribution(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get risk level distribution for charts."""
    result = await db.execute(
        select(LoginEvent.risk_level, func.count(LoginEvent.login_id))
        .where(LoginEvent.risk_level.isnot(None))
        .group_by(LoginEvent.risk_level)
    )
    distribution = {row[0]: row[1] for row in result.all()}

    return {
        "labels": ["Low", "Medium", "High"],
        "values": [
            distribution.get("Low", 0),
            distribution.get("Medium", 0),
            distribution.get("High", 0),
        ],
    }


@router.get("/fraud-reasons")
async def get_fraud_reasons(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get common fraud alert types for charts."""
    result = await db.execute(
        select(Alert.alert_type, func.count(Alert.alert_id))
        .group_by(Alert.alert_type)
        .order_by(func.count(Alert.alert_id).desc())
        .limit(5)
    )
    data = [{"type": row[0], "count": row[1]} for row in result.all()]

    return {
        "labels": [item["type"] for item in data],
        "values": [item["count"] for item in data],
    }


@router.get("/login-trends")
async def get_login_trends(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get login attempt trends over time (simplified for demo)."""
    # For demo, return hourly distribution
    result = await db.execute(
        select(
            func.extract("hour", LoginEvent.login_time).label("hour"),
            func.count(LoginEvent.login_id),
        )
        .group_by("hour")
        .order_by("hour")
    )
    data = [{"hour": row[0], "count": row[1]} for row in result.all()]

    return {
        "labels": [item["hour"] for item in data],
        "values": [item["count"] for item in data],
    }


# ── Customer Dashboard ──────────────────────────────────────────────


@router.get("/customer/summary")
async def get_customer_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get customer's own dashboard summary."""
    user_id = current_user.user_id

    # Own logins
    login_count = await db.execute(
        select(func.count(LoginEvent.login_id)).where(LoginEvent.user_id == user_id)
    )
    total_logins = login_count.scalar() or 0

    # Own transactions
    tx_count = await db.execute(
        select(func.count(Transaction.transaction_id)).where(Transaction.user_id == user_id)
    )
    total_transactions = tx_count.scalar() or 0

    # Own alerts
    alert_count = await db.execute(
        select(func.count(Alert.alert_id)).where(Alert.user_id == user_id)
    )
    total_alerts = alert_count.scalar() or 0

    # High risk logins
    high_risk = await db.execute(
        select(func.count(LoginEvent.login_id)).where(
            LoginEvent.user_id == user_id, LoginEvent.risk_level == "High"
        )
    )

    # Blocked transactions
    blocked = await db.execute(
        select(func.count(Transaction.transaction_id)).where(
            Transaction.user_id == user_id, Transaction.status == "blocked"
        )
    )

    # Trusted devices
    devices = await db.execute(
        select(func.count(Device.id)).where(Device.user_id == user_id, Device.is_trusted == True)
    )

    # Average risk score
    avg_risk = await db.execute(
        select(func.avg(LoginEvent.risk_score)).where(
            LoginEvent.user_id == user_id, LoginEvent.risk_score.isnot(None)
        )
    )
    avg = avg_risk.scalar()
    avg_risk_score = round(avg) if avg else 0

    return {
        "total_logins": total_logins,
        "total_transactions": total_transactions,
        "total_alerts": total_alerts,
        "high_risk_logins": high_risk.scalar() or 0,
        "blocked_transactions": blocked.scalar() or 0,
        "trusted_devices": devices.scalar() or 0,
        "avg_risk_score": avg_risk_score,
    }


@router.get("/customer/recent-logins")
async def get_customer_recent_logins(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get customer's recent login events."""
    result = await db.execute(
        select(LoginEvent)
        .where(LoginEvent.user_id == current_user.user_id)
        .order_by(LoginEvent.login_time.desc())
        .limit(10)
    )
    logins = []
    for le in result.scalars().all():
        logins.append({
            "login_id": le.login_id,
            "ip_address": le.ip_address,
            "city": le.city,
            "device_id": le.device_id,
            "browser": le.browser,
            "os": le.os,
            "login_time": le.login_time.isoformat() if le.login_time else None,
            "is_successful": le.is_successful,
            "risk_score": le.risk_score,
            "risk_level": le.risk_level,
            "is_new_device": le.is_new_device,
            "is_new_location": le.is_new_location,
        })
    return {"logins": logins}


@router.get("/customer/recent-transactions")
async def get_customer_recent_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get customer's recent transactions."""
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == current_user.user_id)
        .order_by(Transaction.transaction_time.desc())
        .limit(10)
    )
    txs = []
    for tx in result.scalars().all():
        txs.append({
            "transaction_id": tx.transaction_id,
            "amount": float(tx.amount),
            "beneficiary_name": tx.beneficiary_name,
            "city": tx.city,
            "status": tx.status,
            "risk_score": tx.risk_score,
            "transaction_time": tx.transaction_time.isoformat() if tx.transaction_time else None,
        })
    return {"transactions": txs}


@router.get("/customer/devices")
async def get_customer_devices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get customer's registered devices."""
    result = await db.execute(
        select(Device)
        .where(Device.user_id == current_user.user_id)
        .order_by(Device.last_seen.desc())
    )
    devices = []
    for d in result.scalars().all():
        devices.append({
            "device_id": d.device_id,
            "device_name": d.device_name,
            "browser": d.browser,
            "os": d.os,
            "is_trusted": d.is_trusted,
            "first_seen": d.first_seen.isoformat() if d.first_seen else None,
            "last_seen": d.last_seen.isoformat() if d.last_seen else None,
        })
    return {"devices": devices}


@router.get("/customer/alerts")
async def get_customer_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get customer's own alerts."""
    result = await db.execute(
        select(Alert)
        .where(Alert.user_id == current_user.user_id)
        .order_by(Alert.created_at.desc())
        .limit(10)
    )
    alerts = []
    for a in result.scalars().all():
        alerts.append({
            "alert_id": a.alert_id,
            "alert_type": a.alert_type,
            "risk_level": a.risk_level,
            "message": a.message,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })
    return {"alerts": alerts}
