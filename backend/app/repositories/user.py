from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from backend.app.repositories.base import BaseRepository
from backend.app.models.user import User

class UserRepository(BaseRepository[User]):
    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        if not username:
            return None
        clean_username = username.strip().lower()
        if "@" in clean_username:
            clean_username = clean_username.split("@")[0]
            
        return (
            db.query(self.model)
            .execution_options(bypass_tenant=True)
            .filter(func.lower(self.model.username) == clean_username)
            .first()
        )

user_repository = UserRepository(User)
