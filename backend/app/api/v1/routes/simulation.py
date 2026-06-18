"""
Simulation routes.

Provides endpoints to start/stop traffic simulation and stream events via SSE.
"""

import asyncio
import json
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from app.api.dependencies import require_admin
from app.models.user import User
from app.services.simulator_service import simulator


router = APIRouter(prefix="/simulation", tags=["Simulation"])


class SimulationStartRequest(BaseModel):
    speed: float = 2.0


@router.get("/status")
async def get_status(admin: User = Depends(require_admin)):
    """Get current simulation status."""
    return simulator.get_status()


@router.post("/start")
async def start_simulation(
    request: Optional[SimulationStartRequest] = None,
    admin: User = Depends(require_admin),
):
    """Start the traffic simulation."""
    speed = request.speed if request else 2.0
    await simulator.start(speed=speed)
    return {"message": "Simulation started", "speed": speed}


@router.post("/stop")
async def stop_simulation(admin: User = Depends(require_admin)):
    """Stop the traffic simulation."""
    await simulator.stop()
    return {"message": "Simulation stopped"}


@router.get("/stream")
async def stream_events(token: str = Query(...)):
    """Stream simulation events via Server-Sent Events."""
    # Authenticate via query token
    from app.core.security import decode_access_token
    from app.core.database import AsyncSessionLocal
    from sqlalchemy import select

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return {"error": "Invalid token"}

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.user_id == int(user_id)))
            user = result.scalar_one_or_none()
            if not user or user.role not in ("admin", "fraud_team"):
                return {"error": "Admin access required"}
    except Exception:
        return {"error": "Authentication failed"}

    queue = simulator.subscribe()

    async def event_generator():
        try:
            # Send initial status
            status = simulator.get_status()
            yield f"data: {json.dumps({'type': 'status', 'data': status})}\n\n"

            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30)
                    yield f"data: {json.dumps({'type': 'event', 'data': {
                        'event_id': event.event_id,
                        'timestamp': event.timestamp,
                        'event_type': event.event_type,
                        'user_id': event.user_id,
                        'user_name': event.user_name,
                        'description': event.description,
                        'city': event.city,
                        'risk_score': event.risk_score,
                        'risk_level': event.risk_level,
                        'action_taken': event.action_taken,
                        'details': event.details,
                    }})}\n\n"
                except asyncio.TimeoutError:
                    # Send heartbeat
                    yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            simulator.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
