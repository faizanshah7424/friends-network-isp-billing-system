from backend.app.repositories.base import BaseRepository
from backend.app.models.expense import Expense

class ExpenseRepository(BaseRepository[Expense]):
    pass

expense_repository = ExpenseRepository(Expense)
