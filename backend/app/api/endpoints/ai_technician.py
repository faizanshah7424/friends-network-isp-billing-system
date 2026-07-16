from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from backend.app.api.deps import get_db, get_current_active_user
from backend.app.models.user import User

router = APIRouter()

class TechQuery(BaseModel):
    message: str

@router.post("/assist")
def technician_ai_assist(
    req: TechQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    msg = req.message.lower()
    reply = ""
    suggested_spares = []
    
    # 1. Attenuation / fiber faults
    if "attenuation" in msg or "optical" in msg or "power" in msg or "dbm" in msg:
        reply = (
            "**Fiber Power Attenuation Troubleshooting SOP:**\n"
            "1. Clean the APC/UPC patch connector face with isopropyl alcohol wipes.\n"
            "2. Verify the ONT RX input levels. Attenuation must be between -18dBm and -24dBm.\n"
            "3. Inspect nearby splice box joints. High power loss usually points to micro-bends or faulty mechanical splices.\n"
            "4. Verify splitter ratio distribution. A 1:8 splitter induces ~10dB loss; a 1:16 splitter induces ~13.5dB loss."
        )
        suggested_spares = ["Optical Patch Cord APC-APC", "Alcohol wipes pack", "Fiber splicing sleeve"]
        
    # 2. Router / PPPoE configuration
    elif "router" in msg or "pppoe" in msg or "ssid" in msg or "credentials" in msg:
        reply = (
            "**MikroTik / Standard Home Router Setup SOP:**\n"
            "1. Connect the Ethernet drop from ONU port 1 to the WAN port of the home router.\n"
            "2. Access the admin dashboard at 192.168.1.1 or 192.168.0.1.\n"
            "3. Select PPPoE configuration mode.\n"
            "4. Input PPP username and password. Enable Auto-Reconnect and set MTU to 1480.\n"
            "5. Configure SSID name and set WPA2-Personal security with client selected passcode."
        )
        suggested_spares = ["CAT6 Patch Cord 1.5m", "Router Power Adapter 12V 1A"]
        
    # 3. ONU Authentication / PON blinking
    elif "onu" in msg or "pon" in msg or "auth" in msg or "blinking" in msg:
        reply = (
            "**ONU PON Blinking / Auth SOP:**\n"
            "- Slow Blinking: The ONU is attempting to establish physical link. Check fiber connection status.\n"
            "- Fast Blinking: The ONU is negotiating with OLT but has not been authorized. Register the GPON ONU Serial Number on the OLT active database.\n"
            "- Red LOS: Complete physical fiber cut. Verify continuity with visual fault locator (laser) or OTDR."
        )
        suggested_spares = ["Huawei GPON ONU", "Visual Fault Locator Red Laser"]
        
    # 4. Fallback guideline
    else:
        reply = (
            "Hello Engineer! I am your AI Technician Copilot. I can assist you with optical attenuation checks, ONU registrations, router configuration checklists, fiber fault continuity, and required spare parts. Describe your field issue."
        )
        
    return {
        "reply": reply,
        "suggestedSpares": suggested_spares,
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p")
    }
