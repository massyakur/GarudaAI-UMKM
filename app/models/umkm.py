from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class UMKM(Base):
    __tablename__ = "umkm"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    business_name = Column(String, nullable=False)
    business_type = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    address = Column(Text, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    established_year = Column(Integer, nullable=True)
    employee_count = Column(Integer, default=0)
    monthly_revenue = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", backref="umkm_businesses")
