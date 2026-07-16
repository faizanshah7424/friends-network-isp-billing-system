from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import shutil
import time

from backend.app.api.deps import get_db
from backend.app.models.router import Router

router = APIRouter()

@router.get("/")
def health_check(db: Session = Depends(get_db)):
    # 1. Database Roundtrip Latency Check
    db_status = "Healthy"
    db_latency_ms = 0.0
    try:
        t1 = time.time()
        db.execute("SELECT 1")
        db_latency_ms = round((time.time() - t1) * 1000, 2)
    except Exception as e:
        db_status = f"Unhealthy: {str(e)}"

    # 2. Disk Space Usage Check
    try:
        total, used, free = shutil.disk_usage("/")
        disk_free_gb = round(free / (1024 ** 3), 2)
        disk_total_gb = round(total / (1024 ** 3), 2)
        disk_usage_pct = round((used / total) * 100, 2)
        disk_status = "Healthy" if disk_usage_pct < 90 else "Disk Space Warning"
    except Exception:
        disk_status = "Unknown"
        disk_free_gb = 0.0
        disk_total_gb = 0.0
        disk_usage_pct = 0.0

    # 3. Mapped MikroTik Router Counters
    routers_summary = []
    try:
        routers = db.query(Router).all()
        for r in routers:
            routers_summary.append({
                "id": r.id,
                "name": r.name,
                "ip": r.ip_address,
                "status": r.status,
                "lastConnected": r.last_connected
            })
    except Exception:
        pass

    overall_status = "Healthy"
    if db_status != "Healthy" or (disk_usage_pct > 95.0 and disk_status != "Unknown"):
        overall_status = "Degraded"

    return {
        "status": overall_status,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "database": {
            "status": db_status,
            "latencyMs": db_latency_ms
        },
        "storage": {
            "status": disk_status,
            "freeGb": disk_free_gb,
            "totalGb": disk_total_gb,
            "usagePercentage": disk_usage_pct
        },
        "routers": routers_summary
    }
