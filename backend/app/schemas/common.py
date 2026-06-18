from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Standard error response schema."""
    detail: str
    status_code: int


class PaginationParams(BaseModel):
    """Pagination parameters."""
    page: int = 1
    page_size: int = 50


class DashboardSummary(BaseModel):
    """Dashboard summary statistics."""
    total_users: int
    total_logins: int
    total_transactions: int
    total_alerts: int
    total_cases: int
    high_risk_logins: int
    medium_risk_logins: int
    low_risk_logins: int
    blocked_transactions: int
