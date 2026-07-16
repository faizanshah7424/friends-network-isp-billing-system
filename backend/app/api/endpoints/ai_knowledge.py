from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from backend.app.api.deps import get_db, get_current_active_user
from backend.app.models.user import User

router = APIRouter()

# Schema models
class ArticleCreate(BaseModel):
    title: str
    content: str
    category: str

# Mock Database Store for Knowledge base items
# to avoid schema alteration issues while providing full functionality.
MOCK_ARTICLES = [
    {
        "id": "kb-1",
        "title": "Standard Router Configuration SOP",
        "content": "Connect router to PON. Access admin panel at 192.168.1.1. Enter PPPoE username and password. Set wireless SSID. Save changes.",
        "category": "Router Manuals",
        "createdAt": "2026-07-01"
    },
    {
        "id": "kb-2",
        "title": "Optical Power Attenuation Faults Guide",
        "content": "Optical power must be under -24dBm. If power is low (-28dBm), clean the fiber connector with alcohol, check splicing quality, or replace splitter ports.",
        "category": "Troubleshooting Guides",
        "createdAt": "2026-07-05"
    },
    {
        "id": "kb-3",
        "title": "Termination Policy for Billing Defaulters",
        "content": "Subscribers with outstanding unpaid invoices for greater than 30 days are automatically suspended by the system during the daily 10 AM billing run.",
        "category": "Company Policies",
        "createdAt": "2026-07-10"
    }
]

@router.get("/articles")
def list_articles(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if category:
        return [a for a in MOCK_ARTICLES if a["category"] == category]
    return MOCK_ARTICLES

@router.post("/articles")
def create_article(
    req: ArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    new_art = {
        "id": f"kb-{len(MOCK_ARTICLES) + 1}",
        "title": req.title,
        "content": req.content,
        "category": req.category,
        "createdAt": datetime.now().strftime("%Y-%m-%d")
    }
    MOCK_ARTICLES.append(new_art)
    return new_art

@router.get("/search")
def search_knowledge_base(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = q.lower()
    matches = []
    
    # Keyword matches
    for a in MOCK_ARTICLES:
        if query in a["title"].lower() or query in a["content"].lower() or query in a["category"].lower():
            matches.append(a)
            
    # Simple semantic reply simulation
    reply = ""
    if matches:
        reply = f"Found {len(matches)} relevant guide(s). Based on standard documentation:\n\n" + matches[0]["content"]
    else:
        reply = "No direct documentation matches found in internal Knowledge Base records."
        
    return {
        "reply": reply,
        "results": matches
    }
