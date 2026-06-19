"""
Traffic Simulator Service.

Generates realistic user activities (logins, transactions) and runs them
through the actual RiskService for live fraud detection demos.
"""

import asyncio
import logging
import random
import uuid
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.services.auth_service import AuthService
from app.services.risk_service import RiskService

logger = logging.getLogger(__name__)


CITIES = [
    "Surat", "Mumbai", "Delhi", "Bangalore", "Chennai",
    "Kolkata", "Hyderabad", "Pune", "Jaipur", "Lucknow",
]

DEVICES = [
    {"device_name": "Android_Pixel_7", "browser": "Chrome", "os": "Android"},
    {"device_name": "Windows_Chrome", "browser": "Chrome", "os": "Windows"},
    {"device_name": "iPhone_Safari", "browser": "Safari", "os": "iOS"},
    {"device_name": "Mac_Safari", "browser": "Safari", "os": "macOS"},
    {"device_name": "Linux_Firefox", "browser": "Firefox", "os": "Linux"},
    {"device_name": "Samsung_Galaxy", "browser": "Chrome", "os": "Android"},
    {"device_name": "Windows_Edge", "browser": "Edge", "os": "Windows"},
]

BENEFICIARIES = [
    ("B001", "Rajesh Kumar"),
    ("B002", "Sneha Patel"),
    ("B003", "Amit Singh"),
    ("B004", "Neha Gupta"),
    ("B005", "Vikram Mehta"),
    ("B006", "Priya Verma"),
    ("B007", "Rohan Joshi"),
    ("B099", "Unknown Beneficiary"),
]

SCENARIOS = [
    "normal_login",
    "new_city_login",
    "night_login",
    "impossible_travel",
    "failed_attempts",
    "large_transaction",
    "rapid_transactions",
    "normal_transaction",
    "suspicious_beneficiary",
]


@dataclass
class SimulationEvent:
    """A single simulation event."""
    event_id: str
    timestamp: str
    event_type: str  # "login" or "transaction"
    user_id: int
    user_name: str
    description: str
    city: str
    risk_score: int
    risk_level: str
    action_taken: str
    details: dict = field(default_factory=dict)


class SimulatorService:
    """Generates realistic traffic and runs through actual risk engine."""

    def __init__(self):
        self.running = False
        self.events: list[SimulationEvent] = []
        self.event_count = 0
        self.login_count = 0
        self.transaction_count = 0
        self.alert_count = 0
        self.task: Optional[asyncio.Task] = None
        self.speed = 2.0  # seconds between events
        self._subscribers: list[asyncio.Queue] = []

    def subscribe(self) -> asyncio.Queue:
        """Subscribe to real-time event stream."""
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue):
        """Unsubscribe from event stream."""
        if queue in self._subscribers:
            self._subscribers.remove(queue)

    async def _broadcast(self, event: SimulationEvent):
        """Broadcast event to all subscribers."""
        for queue in self._subscribers:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                pass

    async def start(self, speed: float = 2.0):
        """Start the traffic simulation."""
        if self.running:
            return
        self.running = True
        self.speed = speed
        self.task = asyncio.create_task(self._run())

    async def stop(self):
        """Stop the traffic simulation."""
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
            self.task = None

    async def _run(self):
        """Main simulation loop."""
        while self.running:
            try:
                await self._generate_event()
                await asyncio.sleep(self.speed)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Simulation error: %s", e)
                await asyncio.sleep(1)

    async def _generate_event(self):
        """Generate a single simulation event."""
        async with AsyncSessionLocal() as db:
            try:
                # Pick a random customer user
                result = await db.execute(
                    select(User).where(User.role == "customer")
                )
                users = result.scalars().all()
                if not users:
                    return

                user = random.choice(users)
                scenario = random.choice(SCENARIOS)

                if scenario in ("large_transaction", "rapid_transactions", "normal_transaction", "suspicious_beneficiary"):
                    await self._generate_transaction(db, user, scenario)
                else:
                    await self._generate_login(db, user, scenario)

                await db.commit()
            except Exception as e:
                await db.rollback()
                logger.error("Event generation error: %s", e)

    async def _generate_login(self, db: AsyncSession, user: User, scenario: str):
        """Generate a login event."""
        risk_service = RiskService(db)
        device = random.choice(DEVICES)

        # Determine city and device based on scenario
        if scenario == "normal_login":
            city = user.usual_city or random.choice(CITIES)
            device_id = f"device_{user.user_id}_0"
            login_time = datetime.utcnow()
        elif scenario == "new_city_login":
            other_cities = [c for c in CITIES if c != user.usual_city]
            city = random.choice(other_cities)
            device_id = f"device_{user.user_id}_0"
            login_time = datetime.utcnow()
        elif scenario == "night_login":
            city = user.usual_city or random.choice(CITIES)
            device_id = f"device_{user.user_id}_0"
            hour = random.choice([1, 2, 3, 4, 23])
            login_time = datetime.utcnow().replace(hour=hour, minute=random.randint(0, 59))
        elif scenario == "impossible_travel":
            other_cities = [c for c in CITIES if c != user.usual_city]
            city = random.choice(other_cities)
            device_id = f"device_unknown_{user.user_id}"
            login_time = datetime.utcnow()
        elif scenario == "failed_attempts":
            city = random.choice(CITIES)
            device_id = f"device_unknown_{user.user_id}"
            login_time = datetime.utcnow()
        else:
            city = random.choice(CITIES)
            device_id = f"device_{user.user_id}_{random.randint(0, 2)}"
            login_time = datetime.utcnow()

        ip_address = f"{random.randint(10, 200)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"

        # Run through actual risk engine
        risk_result = await risk_service.analyze_login_risk(
            user=user,
            device_id=device_id,
            device_name=device["device_name"],
            browser=device["browser"],
            os=device["os"],
            city=city,
            ip_address=ip_address,
            login_time=login_time,
        )

        self.login_count += 1
        self.event_count += 1
        if risk_result.risk_level in ("Medium", "High"):
            self.alert_count += 1

        event = SimulationEvent(
            event_id=str(uuid.uuid4())[:8],
            timestamp=datetime.utcnow().isoformat(),
            event_type="login",
            user_id=user.user_id,
            user_name=user.name,
            description=f"Login from {city}",
            city=city,
            risk_score=risk_result.risk_score,
            risk_level=risk_result.risk_level,
            action_taken=risk_result.recommended_action,
            details={
                "device": device["device_name"],
                "browser": device["browser"],
                "os": device["os"],
                "ip": ip_address,
                "is_new_device": risk_result.is_new_device,
                "is_new_location": risk_result.is_new_location,
                "reasons": risk_result.risk_reasons,
            },
        )

        self.events.append(event)
        if len(self.events) > 100:
            self.events = self.events[-100:]

        await self._broadcast(event)

    async def _generate_transaction(self, db: AsyncSession, user: User, scenario: str):
        """Generate a transaction event."""
        risk_service = RiskService(db)

        if scenario == "large_transaction":
            amount = random.uniform(75000, 250000)
            beneficiary = random.choice(BENEFICIARIES)
            city = random.choice(CITIES)
        elif scenario == "rapid_transactions":
            amount = random.uniform(10000, 50000)
            beneficiary = random.choice(BENEFICIARIES[:5])
            city = user.usual_city or random.choice(CITIES)
        elif scenario == "suspicious_beneficiary":
            amount = random.uniform(30000, 80000)
            beneficiary = ("B099", "Unknown Beneficiary")
            city = random.choice(CITIES)
        else:
            amount = random.uniform(500, 20000)
            beneficiary = random.choice(BENEFICIARIES[:5])
            city = user.usual_city or random.choice(CITIES)

        # Run through actual risk engine
        risk_result = await risk_service.analyze_transaction_risk(
            user=user,
            amount=amount,
            beneficiary_id=beneficiary[0],
            beneficiary_name=beneficiary[1],
            city=city,
        )

        self.transaction_count += 1
        self.event_count += 1
        if risk_result.risk_level in ("Medium", "High"):
            self.alert_count += 1

        event = SimulationEvent(
            event_id=str(uuid.uuid4())[:8],
            timestamp=datetime.utcnow().isoformat(),
            event_type="transaction",
            user_id=user.user_id,
            user_name=user.name,
            description=f"Rs. {amount:,.0f} to {beneficiary[1]}",
            city=city,
            risk_score=risk_result.risk_score,
            risk_level=risk_result.risk_level,
            action_taken=risk_result.recommended_action,
            details={
                "amount": round(amount, 2),
                "beneficiary_id": beneficiary[0],
                "beneficiary_name": beneficiary[1],
                "is_high_amount": risk_result.is_high_amount,
                "is_new_beneficiary": risk_result.is_new_beneficiary,
                "reasons": risk_result.risk_reasons,
            },
        )

        self.events.append(event)
        if len(self.events) > 100:
            self.events = self.events[-100:]

        await self._broadcast(event)

    def get_status(self) -> dict:
        """Get current simulation status."""
        return {
            "running": self.running,
            "speed": self.speed,
            "total_events": self.event_count,
            "login_count": self.login_count,
            "transaction_count": self.transaction_count,
            "alert_count": self.alert_count,
            "recent_events": [
                {
                    "event_id": e.event_id,
                    "timestamp": e.timestamp,
                    "event_type": e.event_type,
                    "user_id": e.user_id,
                    "user_name": e.user_name,
                    "description": e.description,
                    "city": e.city,
                    "risk_score": e.risk_score,
                    "risk_level": e.risk_level,
                    "action_taken": e.action_taken,
                    "details": e.details,
                }
                for e in reversed(self.events[-20:])
            ],
        }


# Singleton instance
simulator = SimulatorService()
