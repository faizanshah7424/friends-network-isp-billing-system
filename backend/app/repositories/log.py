from backend.app.repositories.base import BaseRepository
from backend.app.models.log import ActivityLog

from sqlalchemy.orm import Session
from fastapi import Request

class ActivityLogRepository(BaseRepository[ActivityLog]):
    def log_action(
        self,
        db: Session,
        user_id: str,
        username: str,
        action: str,
        details: str,
        request: Request = None
    ) -> ActivityLog:
        ip_addr = None
        user_agent = None
        if request:
            ip_addr = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")
            
        log_obj = ActivityLog(
            user_id=user_id,
            username=username,
            action=action,
            details=details,
            ip_address=ip_addr,
            browser=user_agent
        )
        return self.create(db, db_obj=log_obj)

activity_log_repository = ActivityLogRepository(ActivityLog)
