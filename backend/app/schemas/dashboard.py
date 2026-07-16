from backend.app.schemas.base import CamelModel
from typing import List, Dict, Any

class DashboardStats(CamelModel):
    active_customers: int
    suspended_customers: int
    total_customers: int
    monthly_revenue: int
    recovery_rate: float
    unpaid_invoices_count: int
    total_unpaid_amount: int
    active_complaints_count: int
    recent_activity: List[Dict[str, Any]]
