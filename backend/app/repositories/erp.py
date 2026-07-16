from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.repositories.base import BaseRepository
from backend.app.models.erp import Branch, InventoryItem, Technician

class BranchRepository(BaseRepository[Branch]):
    def get_by_name(self, db: Session, name: str) -> Optional[Branch]:
        return db.query(self.model).filter(self.model.name == name).first()

class InventoryRepository(BaseRepository[InventoryItem]):
    def get_by_serial(self, db: Session, serial_number: str) -> Optional[InventoryItem]:
        return db.query(self.model).filter(self.model.serial_number == serial_number).first()

    def get_by_branch(self, db: Session, branch_id: str) -> List[InventoryItem]:
        return db.query(self.model).filter(self.model.branch_id == branch_id).all()

class TechnicianRepository(BaseRepository[Technician]):
    def get_by_phone(self, db: Session, phone: str) -> Optional[Technician]:
        return db.query(self.model).filter(self.model.phone == phone).first()

    def get_by_branch(self, db: Session, branch_id: str) -> List[Technician]:
        return db.query(self.model).filter(self.model.branch_id == branch_id).all()

branch_repository = BranchRepository(Branch)
inventory_repository = InventoryRepository(InventoryItem)
technician_repository = TechnicianRepository(Technician)
