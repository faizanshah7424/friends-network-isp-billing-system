from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.repositories.base import BaseRepository
from backend.app.models.payment import Payment

class PaymentRepository(BaseRepository[Payment]):
    def get_by_receipt_number(self, db: Session, receipt_number: str) -> Optional[Payment]:
        return db.query(self.model).filter(self.model.receipt_number == receipt_number).first()

    def get_by_customer_id(self, db: Session, customer_id: str) -> List[Payment]:
        return db.query(self.model).filter(self.model.customer_id == customer_id).all()

payment_repository = PaymentRepository(Payment)
