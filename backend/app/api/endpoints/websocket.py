from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from jose import jwt
from sqlalchemy.orm import Session

from backend.app.core.events import manager
from backend.app.core.config import settings
from backend.app.database.session import SessionLocal
from backend.app.models.user import User

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    # Authenticate token and extract tenant_id
    db = SessionLocal()
    tenant_id = "friends_network"
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id:
            user = db.query(User).execution_options(bypass_tenant=True).filter(User.id == user_id).first()
            if user and user.tenant_id:
                tenant_id = user.tenant_id
    except Exception:
        # Invalid token, reject connection
        await websocket.close(code=4003)
        db.close()
        return
        
    db.close()
    
    # Accept and register connection
    await manager.connect(websocket, tenant_id)
    try:
        while True:
            # Keep-alive loop
            data = await websocket.receive_text()
            # Echo back or handle client heartbeats
            await websocket.send_text(f"heartbeat_ack")
    except WebSocketDisconnect:
        manager.disconnect(websocket, tenant_id)
    except Exception:
        manager.disconnect(websocket, tenant_id)
