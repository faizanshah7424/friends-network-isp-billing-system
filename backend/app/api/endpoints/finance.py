from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict
from datetime import datetime

from backend.app.api.deps import get_db, get_current_active_user, PermissionChecker
from backend.app.models.user import User
from backend.app.models.customer import Customer
from backend.app.models.payment import Payment
from backend.app.models.expense import Expense

router = APIRouter()

@router.get("/ledger")
def get_general_ledger(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    # Retrieve last 15 payments and expenses as double-entry ledger items
    payments = db.query(Payment).order_by(Payment.created_at.desc()).limit(10).all()
    expenses = db.query(Expense).order_by(Expense.created_at.desc()).limit(10).all()
    
    entries = []
    for p in payments:
        entries.append({
            "date": p.payment_date.split(" ")[0],
            "account": "Accounts Receivable",
            "description": f"Collection from {p.customer_name} ({p.customer_id})",
            "type": "Debit",
            "amount": p.amount_received
        })
        entries.append({
            "date": p.payment_date.split(" ")[0],
            "account": "Cash/Bank",
            "description": f"Payment via {p.payment_method} - Ref {p.receipt_number}",
            "type": "Credit",
            "amount": p.amount_received
        })
        
    for e in expenses:
        entries.append({
            "date": e.date,
            "account": "Expenses - " + e.category,
            "description": f"Paid for {e.title}",
            "type": "Debit",
            "amount": e.amount
        })
        entries.append({
            "date": e.date,
            "account": "Cash/Bank",
            "description": f"Disbursement - {e.description or e.title}",
            "type": "Credit",
            "amount": e.amount
        })
        
    # Sort entries by date desc
    entries = sorted(entries, key=lambda x: x["date"], reverse=True)
    return entries[:30]

@router.get("/cashbook")
def get_cashbook(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Cash vs Bank collections
    cash_collections = db.query(func.sum(Payment.amount_received)).filter(Payment.payment_method == "Cash").scalar() or 0
    bank_collections = db.query(func.sum(Payment.amount_received)).filter(Payment.payment_method != "Cash").scalar() or 0
    
    # Simple list of recent payments for Cash Book
    recent_collections = db.query(Payment).order_by(Payment.created_at.desc()).limit(10).all()
    
    return {
        "cashBalance": int(cash_collections),
        "bankBalance": int(bank_collections),
        "totalFunds": int(cash_collections + bank_collections),
        "transactions": [{
            "id": c.receipt_number,
            "date": c.payment_date,
            "customer": c.customer_name,
            "amount": c.amount_received,
            "method": c.payment_method
        } for c in recent_collections]
    }

@router.get("/profit-loss")
def get_profit_loss(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Calculate Profit and Loss for current period
    total_revenue = db.query(func.sum(Payment.amount_received)).scalar() or 0
    total_expenses = db.query(func.sum(Expense.amount)).scalar() or 0
    net_profit = total_revenue - total_expenses
    
    # Expenses categorized breakdown
    expense_breakdown = db.query(Expense.category, func.sum(Expense.amount)).group_by(Expense.category).all()
    
    return {
        "totalRevenue": int(total_revenue),
        "totalExpenses": int(total_expenses),
        "netProfit": int(net_profit),
        "profitMarginPercent": round((net_profit / total_revenue * 100) if total_revenue > 0 else 100, 2),
        "expensesCategorized": [{"category": r[0], "amount": int(r[1])} for r in expense_breakdown]
    }
