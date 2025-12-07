from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TransactionType(str, Enum):
    SALE = "sale"
    PURCHASE = "purchase"
    RETURN = "return"


class PaymentMethod(str, Enum):
    CASH = "cash"
    TRANSFER = "transfer"
    E_WALLET = "e_wallet"
    CREDIT = "credit"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    PARTIAL = "partial"
    CANCELLED = "cancelled"


class TransactionItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    discount: float = Field(default=0.0, ge=0)


class TransactionItemCreate(TransactionItemBase):
    pass


class TransactionItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    discount: float
    subtotal: float
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionBase(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    transaction_type: TransactionType = TransactionType.SALE
    payment_method: PaymentMethod = PaymentMethod.CASH
    discount_amount: float = Field(default=0.0, ge=0)
    tax_amount: float = Field(default=0.0, ge=0)
    payment_status: PaymentStatus = PaymentStatus.PENDING
    notes: Optional[str] = None


class TransactionCreate(TransactionBase):
    umkm_id: int
    items: List[TransactionItemCreate]


class TransactionUpdate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    payment_method: Optional[PaymentMethod] = None
    discount_amount: Optional[float] = Field(None, ge=0)
    tax_amount: Optional[float] = Field(None, ge=0)
    payment_status: Optional[PaymentStatus] = None
    notes: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: int
    umkm_id: int
    transaction_number: str
    transaction_date: datetime
    total_amount: float
    final_amount: float
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[TransactionItemResponse] = []

    class Config:
        from_attributes = True
