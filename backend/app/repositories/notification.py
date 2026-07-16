from typing import List
from sqlalchemy.orm import Session
from backend.app.repositories.base import BaseRepository
from backend.app.models.notification import Notification

class NotificationRepository(BaseRepository[Notification]):
    def get_unread(self, db: Session) -> List[Notification]:
        return db.query(self.model).filter(self.model.is_read == False).all()

notification_repository = NotificationRepository(Notification)
