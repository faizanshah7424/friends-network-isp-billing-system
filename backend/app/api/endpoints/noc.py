from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict
import random
from datetime import datetime

from backend.app.api.deps import get_db, get_current_active_user
from backend.app.models.user import User
from backend.app.models.router import Router
from backend.app.models.customer import Customer
from backend.app.models.complaint import Complaint

router = APIRouter()

@router.get("/metrics")
def get_noc_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Fetch routers configured
    routers = db.query(Router).all()
    
    total_customers = db.query(Customer).count()
    active_customers = db.query(Customer).filter(Customer.connection_status == "Active").all()
    
    # Simulate OLT & Online/Offline counts
    online_count = int(len(active_customers) * 0.94)  # 94% online
    offline_count = len(active_customers) - online_count
    
    # Offline customers list
    offline_custs = active_customers[:8]  # Simulated list for display
    
    # OLT Ports
    olt_ports = [
        {"port": "GPON-0/1", "status": "Online", "onus": 45, "rxPower": "-19.2 dBm"},
        {"port": "GPON-0/2", "status": "Online", "onus": 62, "rxPower": "-21.5 dBm"},
        {"port": "GPON-0/3", "status": "Online", "onus": 38, "rxPower": "-18.8 dBm"},
        {"port": "GPON-0/4", "status": "Alarming", "onus": 14, "rxPower": "-28.4 dBm"},
    ]
    
    # Network alerts & fiber cuts simulation
    network_alerts = []
    
    # Check if there is an area with high complaints (indicates fiber fault)
    high_complaint_areas = db.query(Complaint.area, func.count(Complaint.id).label("count")).filter(
        Complaint.status != "Resolved"
    ).group_by(Complaint.area).having(func.count(Complaint.id) > 2).all() if "func" in globals() else []
    
    for area, cnt in high_complaint_areas:
        network_alerts.append({
            "id": f"alert-{area.lower().replace(' ', '-')}",
            "type": "Fiber Cut Alarm",
            "severity": "Critical",
            "message": f"Possible Fiber cut detected in {area} (active tickets: {cnt})",
            "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p")
        })
        
    # Default alert if no major cut
    if not network_alerts:
        network_alerts.append({
            "id": "alert-1",
            "type": "OLT Port Warning",
            "severity": "Warning",
            "message": "High optical attenuation detected on GPON-0/4 (ONU rx power low)",
            "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p")
        })
        
    # Traffic stats
    traffic_graph = [
        {"time": "00:00", "rxGbps": 2.4, "txGbps": 0.8},
        {"time": "04:00", "rxGbps": 1.1, "txGbps": 0.3},
        {"time": "08:00", "rxGbps": 3.8, "txGbps": 1.2},
        {"time": "12:00", "rxGbps": 4.5, "txGbps": 1.5},
        {"time": "16:00", "rxGbps": 5.2, "txGbps": 1.9},
        {"time": "20:00", "rxGbps": 7.8, "txGbps": 2.8},
        {"time": "22:00", "rxGbps": 9.2, "txGbps": 3.4},
    ]
    
    # Router diagnostics
    router_details = []
    for r in routers:
        cpu = random.randint(15, 65)
        mem = random.randint(30, 75)
        router_details.append({
            "id": r.id,
            "name": r.name,
            "ipAddress": r.ip_address,
            "status": r.status,
            "cpu": cpu,
            "memory": mem,
            "uptime": "14d 6h 25m"
        })
        
    return {
        "onlineCount": online_count,
        "offlineCount": offline_count,
        "oltPorts": olt_ports,
        "alerts": network_alerts,
        "trafficGraph": traffic_graph,
        "routers": router_details,
        "offlineCustomers": [{
            "id": c.customer_id,
            "customerId": c.customer_id,
            "name": c.name,
            "area": c.area,
            "phone": c.phone,
            "packageName": c.package_name
        } for c in offline_custs]
    }
