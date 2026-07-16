from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.repositories.base import BaseRepository
from backend.app.models.complaint import Complaint

class ComplaintRepository(BaseRepository[Complaint]):
    def get_by_ticket_number(self, db: Session, ticket_number: str) -> Optional[Complaint]:
        return db.query(self.model).filter(self.model.ticket_number == ticket_number).first()

    def get_by_customer_id(self, db: Session, customer_id: str) -> List[Complaint]:
        return db.query(self.model).filter(self.model.customer_id == customer_id).all()

complaint_repository = ComplaintRepository(Complaint)
