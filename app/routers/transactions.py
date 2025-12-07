from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.transaction import Transaction, TransactionItem
from app.models.product import Product
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    PaymentStatus
)

router = APIRouter(prefix="/api/v1/transactions", tags=["Transactions"])


def generate_transaction_number(db: Session, umkm_id: int) -> str:
    today = datetime.now().strftime("%Y%m%d")
    count = db.query(Transaction).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_number.like(f"TRX-{umkm_id}-{today}-%")
    ).count()
    return f"TRX-{umkm_id}-{today}-{count + 1:04d}"


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: TransactionCreate,
    user_id: int = Query(..., description="ID user yang membuat transaksi"),
    db: Session = Depends(get_db)
):
    if not transaction.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaksi harus memiliki minimal 1 item"
        )

    transaction_number = generate_transaction_number(db, transaction.umkm_id)

    total_amount = 0.0
    transaction_items = []

    for item in transaction.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product dengan ID {item.product_id} tidak ditemukan"
            )

        if product.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stok {product.name} tidak mencukupi. Tersedia: {product.stock}"
            )

        subtotal = (item.unit_price * item.quantity) - item.discount
        total_amount += subtotal

        transaction_items.append(TransactionItem(
            product_id=item.product_id,
            product_name=product.name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount=item.discount,
            subtotal=subtotal
        ))

        product.stock -= item.quantity

    final_amount = total_amount - transaction.discount_amount + transaction.tax_amount

    db_transaction = Transaction(
        umkm_id=transaction.umkm_id,
        transaction_number=transaction_number,
        customer_id=transaction.customer_id,
        customer_name=transaction.customer_name,
        transaction_type=transaction.transaction_type,
        payment_method=transaction.payment_method,
        total_amount=total_amount,
        discount_amount=transaction.discount_amount,
        tax_amount=transaction.tax_amount,
        final_amount=final_amount,
        payment_status=transaction.payment_status,
        notes=transaction.notes,
        created_by=user_id,
        items=transaction_items
    )

    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    umkm_id: Optional[int] = None,
    payment_status: Optional[PaymentStatus] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)

    if umkm_id:
        query = query.filter(Transaction.umkm_id == umkm_id)
    if payment_status:
        query = query.filter(Transaction.payment_status == payment_status)
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)

    transactions = query.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit).all()
    return transactions


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaksi tidak ditemukan"
        )
    return transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaksi tidak ditemukan"
        )

    update_data = transaction_update.model_dump(exclude_unset=True)

    if 'discount_amount' in update_data or 'tax_amount' in update_data:
        discount = update_data.get('discount_amount', transaction.discount_amount)
        tax = update_data.get('tax_amount', transaction.tax_amount)
        transaction.final_amount = transaction.total_amount - discount + tax

    for field, value in update_data.items():
        setattr(transaction, field, value)

    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaksi tidak ditemukan"
        )

    for item in transaction.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity

    db.delete(transaction)
    db.commit()
    return None
