from fastapi import WebSocket
from typing import List, Dict
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        # Maps tenant_id -> list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, tenant_id: str):
        await websocket.accept()
        if tenant_id not in self.active_connections:
            self.active_connections[tenant_id] = []
        self.active_connections[tenant_id].append(websocket)

    def disconnect(self, websocket: WebSocket, tenant_id: str):
        if tenant_id in self.active_connections:
            if websocket in self.active_connections[tenant_id]:
                self.active_connections[tenant_id].remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_tenant(self, tenant_id: str, message: dict):
        if tenant_id in self.active_connections:
            msg_str = json.dumps(message)
            # Iterate over a copy to avoid modification issues during iteration
            for connection in list(self.active_connections[tenant_id]):
                try:
                    await connection.send_text(msg_str)
                except Exception:
                    # Connection might be stale, we remove it
                    try:
                        self.active_connections[tenant_id].remove(connection)
                    except Exception:
                        pass

manager = ConnectionManager()

class EventSystem:
    async def trigger_event(
        self, 
        db, 
        tenant_id: str, 
        event_type: str, 
        title: str, 
        message: str, 
        details: str = None, 
        user_id: str = None, 
        username: str = "System"
    ):
        # 1. Create audit log
        from backend.app.models.log import ActivityLog
        log = ActivityLog(
            tenant_id=tenant_id,
            user_id=user_id,
            username=username,
            action=event_type,
            details=details or message
        )
        db.add(log)
        
        # 2. Create notification
        from backend.app.models.notification import Notification
        notif = Notification(
            tenant_id=tenant_id,
            type=event_type.lower().replace(" ", "_"),
            title=title,
            message=message,
            date=datetime.now().strftime("%Y-%m-%d %I:%M %p"),
            is_read=False
        )
        db.add(notif)
        
        try:
            db.commit()
            db.refresh(notif)
        except Exception as e:
            db.rollback()
            print(f"Error persisting event notification/log: {e}")
            return
        
        # 3. Broadcast real-time websocket update to the tenant's active channel
        await manager.broadcast_to_tenant(tenant_id, {
            "event": event_type,
            "title": title,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "notification": {
                "id": notif.id,
                "type": notif.type,
                "title": notif.title,
                "message": notif.message,
                "date": notif.date,
                "isRead": notif.is_read
            }
        })

    def trigger_event_sync(
        self,
        db,
        tenant_id: str,
        event_type: str,
        title: str,
        message: str,
        details: str = None,
        user_id: str = None,
        username: str = "System"
    ):
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(self.trigger_event(db, tenant_id, event_type, title, message, details, user_id, username))
            else:
                loop.run_until_complete(self.trigger_event(db, tenant_id, event_type, title, message, details, user_id, username))
        except Exception as e:
            print(f"Error triggering event sync: {e}")

event_system = EventSystem()
