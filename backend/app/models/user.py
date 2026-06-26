from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True)
    email = Column(String(150), unique=True)
    password_hash = Column(String(255))

    detections = relationship("Detection", back_populates="user", cascade="all, delete-orphan")