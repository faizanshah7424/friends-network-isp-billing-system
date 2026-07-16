from typing import Optional
from sqlalchemy.orm import Session
from backend.app.repositories.base import BaseRepository
from backend.app.models.package import Package

class PackageRepository(BaseRepository[Package]):
    def get_by_name(self, db: Session, name: str) -> Optional[Package]:
        return db.query(self.model).filter(self.model.name == name).first()

package_repository = PackageRepository(Package)
