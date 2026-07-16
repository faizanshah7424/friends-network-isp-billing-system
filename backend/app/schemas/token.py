from backend.app.schemas.base import CamelModel
from typing import Optional

class Token(CamelModel):
    access_token: str
    token_type: str

class TokenPayload(CamelModel):
    sub: Optional[str] = None
