from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base, Session, with_loader_criteria
from backend.app.core.config import settings

# Configure database engine connection
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=settings.DB_POOL_PRE_PING
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_recycle=settings.DB_POOL_RECYCLE,
        pool_pre_ping=settings.DB_POOL_PRE_PING
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Multi-tenancy event listener for filtering queries
@event.listens_for(Session, "do_orm_execute")
def _add_tenant_filter(execute_state):
    from backend.app.core.tenant import tenant_context
    tenant_id = tenant_context.get()
    bypass = execute_state.execution_options.get("bypass_tenant", False)
    
    if tenant_id and not bypass:
        if execute_state.is_select and hasattr(execute_state.statement, "options"):
            execute_state.statement = execute_state.statement.options(
                with_loader_criteria(
                    Base,
                    lambda cls: cls.tenant_id == tenant_id if hasattr(cls, "tenant_id") else True,
                    include_aliases=True,
                    track_closure_variables=False
                )
            )

# Multi-tenancy event listener for setting tenant_id on insert/update
@event.listens_for(Session, "before_flush")
def _set_tenant_id(session, flush_context, instances):
    from backend.app.core.tenant import tenant_context
    tenant_id = tenant_context.get()
    if tenant_id:
        for obj in session.new:
            if hasattr(obj, "tenant_id") and getattr(obj, "tenant_id") is None:
                obj.tenant_id = tenant_id

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
