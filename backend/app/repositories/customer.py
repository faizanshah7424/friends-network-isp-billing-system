from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.repositories.base import BaseRepository
from backend.app.models.customer import Customer

class CustomerRepository(BaseRepository[Customer]):
    def get_by_customer_id(self, db: Session, customer_id: str) -> Optional[Customer]:
        return db.query(self.model).filter(self.model.customer_id == customer_id).first()

    def get_by_phone(self, db: Session, phone: str) -> Optional[Customer]:
        return db.query(self.model).filter(self.model.phone == phone).first()

customer_repository = CustomerRepository(Customer)
