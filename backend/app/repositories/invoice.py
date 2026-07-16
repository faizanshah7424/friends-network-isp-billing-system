from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.repositories.base import BaseRepository
from backend.app.models.invoice import Invoice

class InvoiceRepository(BaseRepository[Invoice]):
    def get_by_invoice_number(self, db: Session, invoice_number: str) -> Optional[Invoice]:
        return db.query(self.model).filter(self.model.invoice_number == invoice_number).first()

    def get_by_customer_id(self, db: Session, customer_id: str) -> List[Invoice]:
        return db.query(self.model).filter(self.model.customer_id == customer_id).all()

invoice_repository = InvoiceRepository(Invoice)
