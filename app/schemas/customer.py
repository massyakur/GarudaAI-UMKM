from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CustomerBase(BaseModel):
    name: str
    phone: str


class CustomerCreate(CustomerBase):
    umkm_id: int


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    umkm_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
