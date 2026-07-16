from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from backend.app.api.deps import get_db, PermissionChecker
from backend.app.models.user import User
from backend.app.models.expense import Expense
from backend.app.models.payment import Payment
from backend.app.repositories.expense import expense_repository
from backend.app.repositories.log import activity_log_repository
from backend.app.models.log import ActivityLog
from backend.app.schemas.expense import ExpenseSchema, ExpenseCreate

router = APIRouter()

@router.get("/summary")
def get_balance_sheet_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    # Total Income: Sum of all payments received
    total_income = db.query(Payment).with_entities(Payment.amount_received).all()
    income_sum = sum(p.amount_received for p in total_income)

    # Total Expenses: Sum of all registered expenses
    total_expenses = db.query(Expense).with_entities(Expense.amount).all()
    expenses_sum = sum(e.amount for e in total_expenses)

    running_balance = income_sum - expenses_sum

    return {
        "totalIncome": income_sum,
        "totalExpenses": expenses_sum,
        "runningBalance": running_balance
    }

@router.get("/expenses", response_model=List[ExpenseSchema])
def list_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    return expense_repository.get_multi(db)

@router.post("/expenses", response_model=ExpenseSchema)
def create_expense(
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    expense_db = Expense(
        title=expense_in.title,
        category=expense_in.category,
        amount=expense_in.amount,
        date=expense_in.date,
        description=expense_in.description
    )
    created = expense_repository.create(db, db_obj=expense_db)

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Expense Added",
        details=f"Recorded operating expense: {created.title} ({created.category}) - PKR {created.amount}"
    )
    activity_log_repository.create(db, db_obj=log)

    return created

@router.delete("/expenses/{id}", response_model=ExpenseSchema)
def delete_expense(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    expense = expense_repository.get(db, id=id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    deleted = expense_repository.remove(db, id=id)

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Expense Deleted",
        details=f"Deleted operating expense entry: {deleted.title}"
    )
    activity_log_repository.create(db, db_obj=log)

    return deleted
