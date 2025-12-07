from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.transaction import Transaction, TransactionItem
from app.models.product import Product
from app.models.customer import Customer
from app.schemas.analytics import (
    SalesReportResponse,
    TopProductResponse,
    PaymentMethodStats,
    DailySalesResponse,
    MonthlyReportResponse,
    DashboardResponse
)

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics & Reports"])


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    umkm_id: int = Query(..., description="ID UMKM"),
    days: int = Query(30, ge=1, le=365, description="Periode hari terakhir"),
    db: Session = Depends(get_db)
):
    """Dashboard summary dengan berbagai metrics penting"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    # Total revenue & transactions (current period)
    current_stats = db.query(
        func.count(Transaction.id).label('count'),
        func.sum(Transaction.final_amount).label('revenue')
    ).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= start_date,
        Transaction.payment_status == "paid"
    ).first()

    total_revenue = float(current_stats.revenue or 0)
    total_transactions = current_stats.count or 0

    # Revenue growth (compare with previous period)
    prev_start = start_date - timedelta(days=days)
    prev_stats = db.query(
        func.sum(Transaction.final_amount).label('revenue')
    ).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= prev_start,
        Transaction.transaction_date < start_date,
        Transaction.payment_status == "paid"
    ).first()

    prev_revenue = float(prev_stats.revenue or 0)
    revenue_growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0

    # Total customers
    total_customers = db.query(func.count(Customer.id)).filter(
        Customer.umkm_id == umkm_id
    ).scalar() or 0

    # Total products
    total_products = db.query(func.count(Product.id)).filter(
        Product.umkm_id == umkm_id,
        Product.is_active == True
    ).scalar() or 0

    # Pending transactions
    pending_transactions = db.query(func.count(Transaction.id)).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.payment_status.in_(["pending", "partial"])
    ).scalar() or 0

    # Top 5 products
    top_products_data = db.query(
        TransactionItem.product_id,
        TransactionItem.product_name,
        Product.category,
        func.sum(TransactionItem.quantity).label('total_sold'),
        func.sum(TransactionItem.subtotal).label('total_revenue')
    ).join(
        Transaction, TransactionItem.transaction_id == Transaction.id
    ).join(
        Product, TransactionItem.product_id == Product.id
    ).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= start_date,
        Transaction.payment_status == "paid"
    ).group_by(
        TransactionItem.product_id,
        TransactionItem.product_name,
        Product.category
    ).order_by(desc('total_sold')).limit(5).all()

    top_products = [
        TopProductResponse(
            product_id=p.product_id,
            product_name=p.product_name,
            category=p.category or "Umum",
            total_sold=p.total_sold,
            total_revenue=float(p.total_revenue)
        ) for p in top_products_data
    ]

    # Payment method distribution
    payment_stats = db.query(
        Transaction.payment_method,
        func.count(Transaction.id).label('count'),
        func.sum(Transaction.final_amount).label('amount')
    ).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= start_date,
        Transaction.payment_status == "paid"
    ).group_by(Transaction.payment_method).all()

    total_payment_amount = sum(float(p.amount or 0) for p in payment_stats)
    payment_methods = [
        PaymentMethodStats(
            payment_method=p.payment_method,
            count=p.count,
            total_amount=float(p.amount or 0),
            percentage=round((float(p.amount or 0) / total_payment_amount * 100) if total_payment_amount > 0 else 0, 2)
        ) for p in payment_stats
    ]

    # Daily sales (last 7 days)
    daily_data = db.query(
        func.date(Transaction.transaction_date).label('date'),
        func.count(Transaction.id).label('count'),
        func.sum(Transaction.final_amount).label('revenue')
    ).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= end_date - timedelta(days=7),
        Transaction.payment_status == "paid"
    ).group_by(func.date(Transaction.transaction_date)).all()

    daily_sales = [
        DailySalesResponse(
            date=str(d.date),
            transaction_count=d.count,
            revenue=float(d.revenue or 0)
        ) for d in daily_data
    ]

    return DashboardResponse(
        total_revenue=total_revenue,
        total_transactions=total_transactions,
        total_customers=total_customers,
        total_products=total_products,
        revenue_growth=round(revenue_growth, 2),
        pending_transactions=pending_transactions,
        top_products=top_products,
        payment_methods=payment_methods,
        daily_sales=daily_sales
    )


@router.get("/sales-report", response_model=SalesReportResponse)
async def get_sales_report(
    umkm_id: int = Query(..., description="ID UMKM"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Laporan penjualan dengan ringkasan revenue, profit, dll"""
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # Main stats
    transactions = db.query(Transaction).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.payment_status == "paid"
    ).all()

    total_transactions = len(transactions)
    total_revenue = sum(t.final_amount for t in transactions)

    # Total items sold
    total_items = db.query(
        func.sum(TransactionItem.quantity)
    ).join(Transaction).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= start_date,
        Transaction.transaction_date <= end_date,
        Transaction.payment_status == "paid"
    ).scalar() or 0

    # Calculate profit (simplified: revenue - (cost estimation))
    # Asumsi: profit margin 30% dari revenue
    total_profit = total_revenue * 0.3

    average_transaction = total_revenue / total_transactions if total_transactions > 0 else 0

    return SalesReportResponse(
        umkm_id=umkm_id,
        period_start=start_date,
        period_end=end_date,
        total_transactions=total_transactions,
        total_revenue=total_revenue,
        total_profit=total_profit,
        average_transaction=round(average_transaction, 2),
        total_items_sold=total_items
    )


@router.get("/top-products", response_model=List[TopProductResponse])
async def get_top_products(
    umkm_id: int = Query(..., description="ID UMKM"),
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Produk terlaris berdasarkan jumlah terjual"""
    start_date = datetime.now() - timedelta(days=days)

    top_products = db.query(
        TransactionItem.product_id,
        TransactionItem.product_name,
        Product.category,
        func.sum(TransactionItem.quantity).label('total_sold'),
        func.sum(TransactionItem.subtotal).label('total_revenue')
    ).join(
        Transaction, TransactionItem.transaction_id == Transaction.id
    ).join(
        Product, TransactionItem.product_id == Product.id
    ).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= start_date,
        Transaction.payment_status == "paid"
    ).group_by(
        TransactionItem.product_id,
        TransactionItem.product_name,
        Product.category
    ).order_by(desc('total_sold')).limit(limit).all()

    return [
        TopProductResponse(
            product_id=p.product_id,
            product_name=p.product_name,
            category=p.category or "Umum",
            total_sold=p.total_sold,
            total_revenue=float(p.total_revenue)
        ) for p in top_products
    ]


@router.get("/monthly-report", response_model=List[MonthlyReportResponse])
async def get_monthly_report(
    umkm_id: int = Query(..., description="ID UMKM"),
    months: int = Query(6, ge=1, le=12, description="Jumlah bulan terakhir"),
    db: Session = Depends(get_db)
):
    """Laporan bulanan untuk beberapa bulan terakhir"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=months*30)

    monthly_data = db.query(
        func.strftime('%Y-%m', Transaction.transaction_date).label('month'),
        func.count(Transaction.id).label('count'),
        func.sum(Transaction.final_amount).label('revenue')
    ).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= start_date,
        Transaction.payment_status == "paid"
    ).group_by('month').order_by('month').all()

    results = []
    for data in monthly_data:
        revenue = float(data.revenue or 0)
        profit = revenue * 0.3  # Asumsi profit margin 30%

        results.append(MonthlyReportResponse(
            month=data.month,
            revenue=revenue,
            transaction_count=data.count,
            profit=profit
        ))

    return results


@router.get("/payment-methods", response_model=List[PaymentMethodStats])
async def get_payment_method_stats(
    umkm_id: int = Query(..., description="ID UMKM"),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Statistik metode pembayaran yang digunakan"""
    start_date = datetime.now() - timedelta(days=days)

    payment_stats = db.query(
        Transaction.payment_method,
        func.count(Transaction.id).label('count'),
        func.sum(Transaction.final_amount).label('amount')
    ).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= start_date,
        Transaction.payment_status == "paid"
    ).group_by(Transaction.payment_method).all()

    total_amount = sum(float(p.amount or 0) for p in payment_stats)

    return [
        PaymentMethodStats(
            payment_method=p.payment_method,
            count=p.count,
            total_amount=float(p.amount or 0),
            percentage=round((float(p.amount or 0) / total_amount * 100) if total_amount > 0 else 0, 2)
        ) for p in payment_stats
    ]
