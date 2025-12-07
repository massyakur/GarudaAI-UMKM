from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class SalesReportResponse(BaseModel):
    umkm_id: int
    period_start: datetime
    period_end: datetime
    total_transactions: int
    total_revenue: float
    total_profit: float
    average_transaction: float
    total_items_sold: int


class TopProductResponse(BaseModel):
    product_id: int
    product_name: str
    category: str
    total_sold: int
    total_revenue: float


class PaymentMethodStats(BaseModel):
    payment_method: str
    count: int
    total_amount: float
    percentage: float


class DailySalesResponse(BaseModel):
    date: str
    transaction_count: int
    revenue: float


class MonthlyReportResponse(BaseModel):
    month: str
    revenue: float
    transaction_count: int
    profit: float
    top_product: Optional[str] = None


class DashboardResponse(BaseModel):
    total_revenue: float
    total_transactions: int
    total_customers: int
    total_products: int
    revenue_growth: float
    pending_transactions: int
    top_products: List[TopProductResponse]
    payment_methods: List[PaymentMethodStats]
    daily_sales: List[DailySalesResponse]


class PredictionResponse(BaseModel):
    next_month_revenue_estimate: Optional[float] = None
    next_month_transaction_estimate: Optional[int] = None
    confidence: str


class AIInsightsResponse(BaseModel):
    summary: str
    trends: List[str]
    recommendations: List[str]
    predictions: PredictionResponse


class BusinessHealthScoreResponse(BaseModel):
    total_score: int
    status: str
    message: str
    breakdown: dict
    max_score: int
