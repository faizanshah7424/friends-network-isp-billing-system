from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt
from backend.app.core.config import settings
from backend.app.api.api import api_router
from backend.app.database.session import engine, SessionLocal
from backend.app.database.base import Base
from backend.app.core.tenant import tenant_context, resolve_tenant_by_host
from backend.app.models.user import User

# Auto-initialize database tables (for local SQLite/PostgreSQL running out of the box)
Base.metadata.create_all(bind=engine)

from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Mount static folder
os.makedirs("backend/static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

# Enable CORS for the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tenant Isolation Middleware
@app.middleware("http")
async def tenant_middleware(request: Request, call_next):
    tenant_id = "friends_network"
    
    # We resolve from the Host header or user JWT token
    db = SessionLocal()
    try:
        # Resolve by Host header for custom domains/branding
        host = request.headers.get("host", "")
        if host:
            resolved_tenant = resolve_tenant_by_host(db, host)
            if resolved_tenant:
                tenant_id = resolved_tenant.id
                
        # Resolve by JWT Authorization token
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(
                    token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
                )
                user_id = payload.get("sub")
                if user_id:
                    # Query user bypassing tenant filter
                    user = db.query(User).execution_options(bypass_tenant=True).filter(User.id == user_id).first()
                    if user and user.tenant_id:
                        tenant_id = user.tenant_id
            except Exception:
                pass
    finally:
        db.close()
        
    # Set context for SQLAlchemy
    ctx_token = tenant_context.set(tenant_id)
    try:
        response = await call_next(request)
        # Inject tenant details in response headers for frontend checking
        response.headers["X-Tenant-Id"] = tenant_id
        return response
    finally:
        tenant_context.reset(ctx_token)

app.include_router(api_router, prefix=settings.API_V1_STR)

from backend.app.api.endpoints import websocket as ws_router
app.include_router(ws_router.router)

from backend.app.api.api_v2 import api_router_v2
app.include_router(api_router_v2, prefix="/api/v2")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "version": "4.0.0",
        "documentation": "/docs"
    }

# Observability Metrics endpoint (Module 14)
from backend.app.core.observability import observability
from fastapi.responses import PlainTextResponse

@app.get("/metrics")
def get_metrics():
    return PlainTextResponse(observability.get_metrics_text())

# Latency tracking middleware
import time
@app.middleware("http")
async def latency_tracker_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    observability.log_request_time(duration)
    return response

import asyncio
from backend.app.core.scheduler import scheduler_loop
from backend.app.core.plugins import plugin_manager

@app.on_event("startup")
async def startup_event():
    # Load dynamically registered plugins
    plugin_manager.scan_and_load_plugins()
    # Start scheduled periodic worker
    asyncio.create_task(scheduler_loop())
