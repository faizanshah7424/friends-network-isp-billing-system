from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from io import BytesIO
from datetime import datetime

from backend.app.api.deps import get_db, get_current_active_user
from backend.app.models.user import User

router = APIRouter()

class ReportRequest(BaseModel):
    report_type: str  # "Daily" | "Weekly" | "Monthly" | "Executive Summary"
    format: str       # "PDF" | "Excel"

@router.post("/generate")
def generate_ai_report(
    req: ReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    print(f"[AI Report Generator] Compiling {req.report_type} report in {req.format} format...")
    
    # Simulate generating report summary text
    summary = (
        f"Friends Network {req.report_type} Operations Report\n"
        f"Generated: {datetime.now().strftime('%Y-%m-%d %I:%M %p')} by {current_user.full_name}\n\n"
        "1. RECOVERY METRICS\n"
        "   - Total collections: 2,450,000 PKR\n"
        "   - Billing recovery ratio: 94.2%\n"
        "   - Defaulter profiles suspended: 12\n\n"
        "2. TECHNICAL OPERATIONS\n"
        "   - Active complaints raised: 28\n"
        "   - Support tickets resolved: 24\n"
        "   - Average resolution time: 42.5 minutes\n\n"
        "3. EXECUTIVE SUMMARY\n"
        "   - Operational performance stable. Revenue metrics are matching forecasts. Churn remains within acceptable 3% threshold."
    )
    
    return {
        "status": "Generated",
        "reportType": req.report_type,
        "format": req.format,
        "summary": summary,
        "downloadUrl": f"/api/v1/ai-reports/download?type={req.report_type}&format={req.format}"
    }

@router.get("/download")
def download_report_file(
    type: str = Query(..., alias="type"),
    format: str = Query(..., alias="format"),
    current_user: User = Depends(get_current_active_user)
):
    # Simulated PDF/Excel binary stream generator
    output = BytesIO()
    
    if format.upper() == "PDF":
        output.write(f"%PDF-1.4 - Friends Network {type} Report\n".encode())
        output.write(b"1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n")
        output.write(b"xref\n0 2\n0000000000 65535 f\n")
        filename = f"report_{type.lower()}_{datetime.now().strftime('%Y%m%d')}.pdf"
        media_type = "application/pdf"
    else:
        # Excel mock XML
        output.write(f"Sheet1, Friends Network {type} Excel Report\n".encode())
        output.write(b"Month, Revenue, ActiveCustomers, Tickets\n")
        output.write(b"Current, 2450000, 1420, 28\n")
        filename = f"report_{type.lower()}_{datetime.now().strftime('%Y%m%d')}.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
