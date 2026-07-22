from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from backend.app.api.deps import get_db, PermissionChecker
from backend.app.models.user import User
from backend.app.models.customer import Customer
from backend.app.models.invoice import Invoice
from backend.app.models.payment import Payment
from backend.app.models.complaint import Complaint
from backend.app.models.log import ActivityLog
from backend.app.models.package import Package
from backend.app.schemas.dashboard import DashboardStats

router = APIRouter()

@router.get("/dashboard-stats", response_model=DashboardStats)
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    total_cust = db.query(Customer).count()
    active_cust = db.query(Customer).filter(Customer.connection_status == "Active").count()
    suspended_cust = db.query(Customer).filter(Customer.connection_status == "Inactive").count()
    
    # Total monthly charges of active customers
    active_cust_list = db.query(Customer).filter(Customer.connection_status == "Active").all()
    monthly_rev = sum(c.monthly_charges for c in active_cust_list)
    
    # Unpaid invoices count and sum (for Active customers only)
    active_cust_ids = [c.customer_id for c in active_cust_list]
    unpaid_invoices = db.query(Invoice).filter(Invoice.payment_status == "Unpaid", Invoice.customer_id.in_(active_cust_ids)).all()
    unpaid_count = len(unpaid_invoices)
    unpaid_amount = sum(inv.outstanding_balance for inv in unpaid_invoices)
    
    # Support tickets pending details
    active_complaints = db.query(Complaint).filter(Complaint.status != "Resolved").count()
    
    # Fetch recent logs
    recent_logs = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(5).all()
    logs_data = []
    for log in recent_logs:
        logs_data.append({
            "id": log.id,
            "username": log.username,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        })

    # Core recovery calculations
    total_invoiced = sum(inv.grand_total for inv in db.query(Invoice).all())
    total_paid = sum(inv.amount_paid for inv in db.query(Invoice).all())
    recovery_rate = round((total_paid / total_invoiced * 100), 2) if total_invoiced > 0 else 100.0

    return DashboardStats(
        active_customers=active_cust,
        suspended_customers=suspended_cust,
        total_customers=total_cust,
        monthly_revenue=monthly_rev,
        recovery_rate=recovery_rate,
        unpaid_invoices_count=unpaid_count,
        total_unpaid_amount=unpaid_amount,
        active_complaints_count=active_complaints,
        recent_activity=logs_data
    )

@router.get("/filter-customers")
def get_filtered_customers(
    area: Optional[str] = None,
    category: Optional[str] = None,
    packageName: Optional[str] = None,
    connectionStatus: Optional[str] = None,
    paymentStatus: Optional[str] = None,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    query = db.query(Customer)
    if area and area != "All":
        query = query.filter(Customer.area == area)
    if connectionStatus and connectionStatus != "All":
        query = query.filter(Customer.connection_status == connectionStatus)
    if paymentStatus and paymentStatus != "All":
        query = query.filter(Customer.payment_status == paymentStatus)
    
    customers = query.all()
    
    # Filter by package category and package name
    if category and category != "All":
        customers = [
            c for c in customers
            if db.query(Package).filter(Package.id == c.package_id, Package.category == category).first()
        ]
    if packageName and packageName != "All":
        customers = [c for c in customers if c.package_name == packageName]
        
    # Date range activation boundaries
    if startDate:
        customers = [c for c in customers if c.connection_date >= startDate]
    if endDate:
        customers = [c for c in customers if c.connection_date <= endDate]

    return {
        "count": len(customers),
        "customers": [
            {
                "id": c.customer_id,
                "name": c.name,
                "phone": c.phone,
                "area": c.area,
                "packageName": c.package_name,
                "monthlyCharges": c.monthly_charges,
                "connectionStatus": c.connection_status,
                "paymentStatus": c.payment_status,
                "outstandingBalance": c.outstanding_balance
            }
            for c in customers
        ]
    }
