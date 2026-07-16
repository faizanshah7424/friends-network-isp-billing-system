from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from backend.app.core.config import settings

# Setup password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

import base64

def encrypt_password(plain_password: str) -> str:
    key = settings.SECRET_KEY
    enc = []
    for i in range(len(plain_password)):
        key_c = key[i % len(key)]
        enc_c = chr(ord(plain_password[i]) ^ ord(key_c))
        enc.append(enc_c)
    return base64.urlsafe_b64encode("".join(enc).encode('utf-8')).decode('utf-8')

def decrypt_password(enc_password: str) -> str:
    key = settings.SECRET_KEY
    dec = []
    try:
        raw = base64.urlsafe_b64decode(enc_password.encode('utf-8')).decode('utf-8')
        for i in range(len(raw)):
            key_c = key[i % len(key)]
            dec_c = chr(ord(raw[i]) ^ ord(key_c))
            dec.append(dec_c)
        return "".join(dec)
    except Exception:
        return ""
