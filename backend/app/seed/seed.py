"""
Seed data for AccountGuard AI demo.

Creates demo users, devices, login events, transactions,
alerts, fraud cases, and new feature data for hackathon demonstration.
"""

import asyncio
import random
from datetime import datetime, timedelta, timezone
import hashlib

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import User
from app.models.device import Device
from app.models.login_event import LoginEvent
from app.models.transaction import Transaction
from app.models.alert import Alert
from app.models.fraud_case import FraudCase
from app.models.kyc_verification import KycVerification
from app.models.password_reset import PasswordReset
from app.models.audit_log import AuditLog
from app.models.session_event import SessionEvent
from app.models.verification_request import VerificationRequest
from app.models.privacy import ConsentRecord, DataAccessLog


# Demo users
USERS = [
    {
        "name": "Jyot Patel",
        "email": "user@example.com",
        "password": "password123",
        "phone": "+91 98765 43210",
        "role": "customer",
        "usual_city": "Surat",
        "usual_device": "Android_Pixel_7",
    },
    {
        "name": "Rahul Sharma",
        "email": "rahul@example.com",
        "password": "password123",
        "phone": "+91 87654 32109",
        "role": "customer",
        "usual_city": "Mumbai",
        "usual_device": "Windows_Chrome",
    },
    {
        "name": "Priyanshi",
        "email": "priyanshi@example.com",
        "password": "password123",
        "phone": "+91 76543 21098",
        "role": "customer",
        "usual_city": "Delhi",
        "usual_device": "iPhone_Safari",
    },
    {
        "name": "Admin User",
        "email": "admin@example.com",
        "password": "admin123",
        "phone": "+91 65432 10987",
        "role": "admin",
        "usual_city": "Bangalore",
        "usual_device": "Windows_Chrome",
    },
    {
        "name": "Fraud Analyst",
        "email": "fraud@example.com",
        "password": "fraud123",
        "phone": "+91 54321 09876",
        "role": "fraud_team",
        "usual_city": "Chennai",
        "usual_device": "Mac_Safari",
    },
]

CITIES = ["Surat", "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune"]

DEVICES = [
    {"device_name": "Android_Pixel_7", "browser": "Chrome", "os": "Android"},
    {"device_name": "Windows_Chrome", "browser": "Chrome", "os": "Windows"},
    {"device_name": "iPhone_Safari", "browser": "Safari", "os": "iOS"},
    {"device_name": "Mac_Safari", "browser": "Safari", "os": "macOS"},
    {"device_name": "Linux_Firefox", "browser": "Firefox", "os": "Linux"},
]


async def seed_database():
    """Seed the database with demo data."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        from sqlalchemy import select, func
        result = await db.execute(select(func.count(User.user_id)))
        if result.scalar() > 0:
            print("Database already seeded. Skipping...")
            return

        print("Seeding database...")
        now = datetime.now(timezone.utc)

        # Create users
        users = []
        for user_data in USERS:
            user = User(
                name=user_data["name"],
                email=user_data["email"],
                password_hash=hash_password(user_data["password"]),
                phone=user_data["phone"],
                role=user_data["role"],
                usual_city=user_data["usual_city"],
                usual_device=user_data["usual_device"],
            )
            db.add(user)
            users.append(user)
        await db.flush()

        # Create devices
        devices = []
        for i, user in enumerate(users[:3]):
            for j in range(2):
                device_template = DEVICES[j % len(DEVICES)]
                device = Device(
                    device_id=f"device_{user.user_id}_{j}",
                    user_id=user.user_id,
                    device_name=device_template["device_name"],
                    browser=device_template["browser"],
                    os=device_template["os"],
                    is_trusted=(j == 0),
                )
                db.add(device)
                devices.append(device)
        await db.flush()

        # Create login events
        login_events = []
        for user in users[:3]:
            for k in range(5):
                login = LoginEvent(
                    user_id=user.user_id,
                    ip_address=f"192.168.1.{random.randint(1, 254)}",
                    city=user.usual_city,
                    country="India",
                    device_id=f"device_{user.user_id}_0",
                    browser="Chrome",
                    os="Windows",
                    login_time=now - timedelta(days=random.randint(0, 7), hours=random.randint(6, 22)),
                    is_successful=True,
                    risk_score=random.randint(5, 25),
                    risk_level="Low",
                    action_taken="Allow",
                    is_new_device=False,
                    is_new_location=False,
                )
                db.add(login)
                login_events.append(login)

            suspicious_cities = [c for c in CITIES if c != user.usual_city]
            login_medium = LoginEvent(
                user_id=user.user_id,
                ip_address=f"10.0.0.{random.randint(1, 254)}",
                city=random.choice(suspicious_cities),
                country="India",
                device_id=f"device_{user.user_id}_1",
                browser="Firefox",
                os="Linux",
                login_time=now - timedelta(days=1, hours=3),
                is_successful=True,
                risk_score=random.randint(40, 65),
                risk_level="Medium",
                action_taken="Step-up verification",
                is_new_device=True,
                is_new_location=True,
            )
            db.add(login_medium)
            login_events.append(login_medium)

            login_high = LoginEvent(
                user_id=user.user_id,
                ip_address=f"45.67.{random.randint(1, 254)}.{random.randint(1, 254)}",
                city=random.choice(suspicious_cities),
                country="USA",
                device_id=f"device_unknown_{user.user_id}",
                browser="Unknown",
                os="Unknown",
                login_time=now - timedelta(hours=2),
                is_successful=True,
                risk_score=random.randint(75, 95),
                risk_level="High",
                action_taken="Block and alert",
                is_new_device=True,
                is_new_location=True,
            )
            db.add(login_high)
            login_events.append(login_high)
        await db.flush()

        # Create transactions
        transactions = []
        beneficiaries = [
            ("B001", "Rajesh Kumar"), ("B002", "Sneha Patel"),
            ("B003", "Amit Singh"), ("B004", "Neha Gupta"), ("B005", "Vikram Mehta"),
        ]
        for user in users[:3]:
            for k in range(3):
                amount = random.uniform(500, 10000)
                beneficiary = random.choice(beneficiaries)
                tx = Transaction(
                    user_id=user.user_id, amount=amount,
                    beneficiary_id=beneficiary[0], beneficiary_name=beneficiary[1],
                    transaction_type="transfer", city=user.usual_city,
                    transaction_time=now - timedelta(days=random.randint(0, 14)),
                    risk_score=random.randint(5, 20), status="approved",
                    is_new_beneficiary=False,
                )
                db.add(tx)
                transactions.append(tx)

            tx_suspicious = Transaction(
                user_id=user.user_id, amount=random.uniform(50000, 100000),
                beneficiary_id="B099", beneficiary_name="Unknown Beneficiary",
                transaction_type="transfer",
                city=random.choice([c for c in CITIES if c != user.usual_city]),
                transaction_time=now - timedelta(hours=1),
                risk_score=random.randint(70, 90), status="flagged",
                is_new_beneficiary=True,
            )
            db.add(tx_suspicious)
            transactions.append(tx_suspicious)
        await db.flush()

        # Create alerts
        alerts = []
        alert_types = [
            ("new_device", "Medium", "New device detected"),
            ("unusual_location", "Medium", "Login from unusual location"),
            ("high_risk_login", "High", "High-risk login blocked"),
            ("suspicious_transaction", "High", "Suspicious transaction flagged"),
            ("kyc_fraud", "High", "Suspicious KYC attempt"),
        ]
        for user in users[:3]:
            for alert_type, risk_level, message_prefix in alert_types[:3]:
                alert = Alert(
                    user_id=user.user_id, alert_type=alert_type,
                    risk_level=risk_level, message=f"{message_prefix} ({user.name})",
                    status=random.choice(["open", "reviewing", "resolved"]),
                )
                db.add(alert)
                alerts.append(alert)
        await db.flush()

        # Create fraud cases
        cases = []
        for alert in [a for a in alerts if a.risk_level in ["High"]][:3]:
            case = FraudCase(
                user_id=alert.user_id, alert_id=alert.alert_id,
                risk_score=random.randint(75, 95),
                case_status=random.choice(["open", "investigating"]),
                admin_notes="Auto-created from high-risk alert",
            )
            db.add(case)
            cases.append(case)
        await db.flush()

        # === NEW FEATURES SEED DATA ===

        # KYC verifications
        kyc_records = []
        doc_types = ["Aadhaar", "PAN", "Passport"]
        for user in users[:3]:
            kyc = KycVerification(
                user_id=user.user_id,
                document_type=random.choice(doc_types),
                document_number_hash=hashlib.sha256(f"DOC{user.user_id}".encode()).hexdigest(),
                submission_ip=f"192.168.1.{random.randint(1, 254)}",
                submission_city=user.usual_city,
                status=random.choice(["approved", "pending", "suspicious"]),
                risk_score=random.randint(5, 80),
            )
            db.add(kyc)
            kyc_records.append(kyc)
        await db.flush()

        # Password resets
        resets = []
        for user in users[:3]:
            reset = PasswordReset(
                user_id=user.user_id,
                reset_token=f"reset_token_{user.user_id}_{random.randint(1000, 9999)}",
                device_id=f"device_{user.user_id}_0",
                city=user.usual_city,
                ip_address=f"192.168.1.{random.randint(1, 254)}",
                expires_at=now + timedelta(hours=1),
                is_used=random.choice([True, False]),
                risk_score=random.randint(5, 60),
                risk_level=random.choice(["Low", "Medium"]),
            )
            db.add(reset)
            resets.append(reset)
        await db.flush()

        # Audit logs
        audit_logs = []
        actions = ["login", "logout", "export_data", "modify_user", "view_dashboard"]
        for user in users[3:]:  # Admin and fraud team
            for action in actions[:3]:
                log = AuditLog(
                    user_id=user.user_id,
                    action=action,
                    resource_type="system",
                    ip_address=f"10.0.0.{random.randint(1, 254)}",
                    city=user.usual_city,
                    risk_score=random.randint(5, 40),
                )
                db.add(log)
                audit_logs.append(log)
        await db.flush()

        # Session events
        session_events = []
        for user in users[:3]:
            for k in range(3):
                event = SessionEvent(
                    user_id=user.user_id,
                    session_token=f"session_{user.user_id}_{k}",
                    event_type=random.choice(["page_view", "action", "api_call"]),
                    city=user.usual_city,
                    ip_address=f"192.168.1.{random.randint(1, 254)}",
                    device_id=f"device_{user.user_id}_0",
                    risk_score=random.randint(5, 30),
                    is_suspicious=False,
                )
                db.add(event)
                session_events.append(event)
        await db.flush()

        # Verification requests
        verifications = []
        for user in users[:3]:
            v = VerificationRequest(
                user_id=user.user_id,
                verification_type="otp_sms",
                code_hash=hashlib.sha256("123456".encode()).hexdigest(),
                device_id=f"device_{user.user_id}_0",
                city=user.usual_city,
                ip_address=f"192.168.1.{random.randint(1, 254)}",
                expires_at=now + timedelta(minutes=5),
                is_verified=True,
                risk_score=random.randint(5, 20),
            )
            db.add(v)
            verifications.append(v)
        await db.flush()

        # Consent records
        consents = []
        consent_types = ["data_processing", "marketing", "third_party_sharing"]
        for user in users[:3]:
            for ct in consent_types[:2]:
                consent = ConsentRecord(
                    user_id=user.user_id,
                    consent_type=ct,
                    is_granted=random.choice([True, True, False]),
                    ip_address=f"192.168.1.{random.randint(1, 254)}",
                )
                db.add(consent)
                consents.append(consent)
        await db.flush()

        await db.commit()

        print(f"Seeded:")
        print(f"  - {len(users)} users")
        print(f"  - {len(devices)} devices")
        print(f"  - {len(login_events)} login events")
        print(f"  - {len(transactions)} transactions")
        print(f"  - {len(alerts)} alerts")
        print(f"  - {len(cases)} fraud cases")
        print(f"  - {len(kyc_records)} KYC verifications")
        print(f"  - {len(resets)} password resets")
        print(f"  - {len(audit_logs)} audit logs")
        print(f"  - {len(session_events)} session events")
        print(f"  - {len(verifications)} verification requests")
        print(f"  - {len(consents)} consent records")
        print("Database seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_database())
