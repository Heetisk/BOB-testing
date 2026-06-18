from fastapi import APIRouter

from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.risk import router as risk_router
from app.api.v1.routes.dashboard import router as dashboard_router
from app.api.v1.routes.transactions import router as transactions_router
from app.api.v1.routes.alerts import router as alerts_router
from app.api.v1.routes.cases import router as cases_router
from app.api.v1.routes.kyc import router as kyc_router
from app.api.v1.routes.recovery import router as recovery_router
from app.api.v1.routes.audit import router as audit_router
from app.api.v1.routes.session import router as session_router
from app.api.v1.routes.verification import router as verification_router
from app.api.v1.routes.privacy import router as privacy_router
from app.api.v1.routes.simulation import router as simulation_router

api_router = APIRouter()

# Include all route modules
api_router.include_router(auth_router)
api_router.include_router(risk_router)
api_router.include_router(dashboard_router)
api_router.include_router(transactions_router)
api_router.include_router(alerts_router)
api_router.include_router(cases_router)
api_router.include_router(kyc_router)
api_router.include_router(recovery_router)
api_router.include_router(audit_router)
api_router.include_router(session_router)
api_router.include_router(verification_router)
api_router.include_router(privacy_router)
api_router.include_router(simulation_router)


@api_router.get("/health")
async def api_health():
    return {"status": "healthy", "api_version": "v1"}
