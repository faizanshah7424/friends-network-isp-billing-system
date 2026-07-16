from typing import Optional
from sqlalchemy.orm import Session
from backend.app.repositories.base import BaseRepository
from backend.app.models.tenant import Tenant

class TenantRepository(BaseRepository[Tenant]):
    def get_by_name(self, db: Session, name: str) -> Optional[Tenant]:
        return db.query(self.model).filter(self.model.name == name).first()

    def get_by_domain(self, db: Session, domain: str) -> Optional[Tenant]:
        return db.query(self.model).filter(self.model.domain == domain).first()

tenant_repository = TenantRepository(Tenant)
