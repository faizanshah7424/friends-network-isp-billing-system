import uuid
from sqlalchemy import Column, String, JSON
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), unique=True, nullable=False)  # "Super Admin" | "Sub Admin"
    permissions = Column(JSON, nullable=True)  # List of allowed permissions/actions

    users = relationship("User", back_populates="role")
