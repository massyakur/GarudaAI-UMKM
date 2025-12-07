from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class TransactionType(str, enum.Enum):
    SALE = "sale"
    PURCHASE = "purchase"
    RETURN = "return"


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    TRANSFER = "transfer"
    E_WALLET = "e_wallet"
    CREDIT = "credit"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    PARTIAL = "partial"
    CANCELLED = "cancelled"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    umkm_id = Column(Integer, ForeignKey("umkm.id"), nullable=False)
    transaction_number = Column(String, unique=True, nullable=False, index=True)
    transaction_date = Column(DateTime(timezone=True), server_default=func.now())
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String, nullable=True)
    transaction_type = Column(Enum(TransactionType), default=TransactionType.SALE)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.CASH)
    total_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    final_amount = Column(Float, default=0.0)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    umkm = relationship("UMKM", backref="transactions")
    customer = relationship("Customer", backref="transactions")
    created_by_user = relationship("User", backref="transactions")
    items = relationship("TransactionItem", back_populates="transaction", cascade="all, delete-orphan")


class TransactionItem(Base):
    __tablename__ = "transaction_items"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    subtotal = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    transaction = relationship("Transaction", back_populates="items")
    product = relationship("Product", backref="transaction_items")
