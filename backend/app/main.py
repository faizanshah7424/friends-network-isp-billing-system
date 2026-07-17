import logging
import os
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from jose import jwt
from alembic.config import Config
from alembic import command

from backend.app.core.config import settings
from backend.app.api.api import api_router
from backend.app.database.session import engine, SessionLocal
from backend.app.database.base import Base
from backend.app.core.tenant import tenant_context, resolve_tenant_by_host
from backend.app.models.user import User

START_TIME = time.time()

# Configure Logging (Phase 5)
log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
logging.basicConfig(
    level=log_level,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("backend")
logger.info(f"Starting application in {settings.ENVIRONMENT} mode")

# Auto-initialize database tables (for local SQLite/PostgreSQL running out of the box)
Base.metadata.create_all(bind=engine)

def run_migrations():
    # Try finding alembic.ini in multiple locations (Phase 4 / Phase 9)
    ini_path = "alembic.ini"
    if not os.path.exists(ini_path):
        ini_path = "backend/alembic.ini"
    
    if os.path.exists(ini_path):
        try:
            logger.info(f"Running database migrations using {ini_path}...")
            alembic_cfg = Config(ini_path)
            alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
            command.upgrade(alembic_cfg, "head")
            logger.info("Database migrations completed successfully.")
        except Exception as e:
            logger.error(f"Error running database migrations: {e}")
    else:
        logger.warning("alembic.ini not found. Skipping auto-migrations.")

def validate_startup_settings():
    logger.info("Validating startup configuration...")
    if settings.ENVIRONMENT == "production":
        if settings.SECRET_KEY == "friends-network-super-secret-key-change-in-production-fnb":
            logger.warning("WARNING: SECRET_KEY is set to the default value in production. Please change it immediately!")
    
    # Try connecting to the database
    db = SessionLocal()
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        logger.info("Database connection validated successfully.")
    except Exception as e:
        logger.critical(f"Database connection validation failed: {e}")
    finally:
        db.close()

def seed_database_if_empty():
    db = SessionLocal()
    try:
        from backend.app.models.user import User
        user_count = db.query(User).count()
        if user_count == 0:
            logger.info("Users table is empty. Running database seed...")
            from backend.app.seed.seed import seed_db
            seed_db()
            logger.info("Database seed completed successfully.")
        else:
            logger.info("Database already contains users. Skipping seed.")
    except Exception as e:
        logger.error(f"Error seeding database on startup: {e}")
    finally:
        db.close()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    debug=(settings.ENVIRONMENT == "development")
)

# Mount static folder and verify static directories (Phase 8)
static_dir = settings.STATIC_DIR
os.makedirs(os.path.join(static_dir, "uploads"), exist_ok=True)
os.makedirs(os.path.join(static_dir, "documents"), exist_ok=True)
os.makedirs(os.path.join(static_dir, "logos"), exist_ok=True)
os.makedirs(os.path.join(static_dir, "receipts"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Enable CORS for the frontend origin (Phase 7)
cors_origins = [str(origin).strip("/") for origin in settings.cors_origins]
allow_all = "*" in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers (Phase 5)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception during request {request.url.path}: {exc}", exc_info=True)
    if settings.ENVIRONMENT == "development":
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc), "type": type(exc).__name__}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
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

# Health Check (Phase 6)
@app.get("/health")
def health_check_root():
    db_status = "healthy"
    db = SessionLocal()
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    finally:
        db.close()

    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "database": db_status,
        "version": "4.0.0",
        "uptime": time.time() - START_TIME
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
    # Run database migrations (Phase 4 / Phase 9)
    run_migrations()
    # Validate startup configuration (Phase 5)
    validate_startup_settings()
    # Seed database if empty (Audit & Production Seeding)
    seed_database_if_empty()
    # Load dynamically registered plugins
    plugin_manager.scan_and_load_plugins()
    # Start scheduled periodic worker
    asyncio.create_task(scheduler_loop())

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down application...")
    engine.dispose()
    logger.info("Application shut down successfully.")

