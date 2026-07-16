from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.repositories.base import BaseRepository
from backend.app.models.router import Router

class RouterRepository(BaseRepository[Router]):
    def get_by_name(self, db: Session, name: str) -> Optional[Router]:
        return db.query(self.model).filter(self.model.name == name).first()

router_repository = RouterRepository(Router)
