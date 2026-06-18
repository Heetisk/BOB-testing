from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.risk import router as risk_router
from app.api.v1.routes.dashboard import router as dashboard_router
from app.api.v1.routes.transactions import router as transactions_router
from app.api.v1.routes.alerts import router as alerts_router
from app.api.v1.routes.cases import router as cases_router

__all__ = [
    "auth_router",
    "risk_router",
    "dashboard_router",
    "transactions_router",
    "alerts_router",
    "cases_router",
]
