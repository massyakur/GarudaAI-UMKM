from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.transaction import Transaction, TransactionItem
from app.models.product import Product
from app.models.customer import Customer
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import json
from agent.config.settings import settings


# ==================== PYDANTIC MODELS FOR AI INSIGHTS ====================

class PredictionModel(BaseModel):
    """Prediction model for future business metrics"""
    next_month_revenue_estimate: Optional[float] = Field(None, description="Estimated revenue for next month")
    next_month_transaction_estimate: Optional[int] = Field(None, description="Estimated transaction count for next month")
    confidence: str = Field(description="Confidence level: high, medium, or low")


class BusinessInsights(BaseModel):
    """AI-generated business insights from analytics data"""
    summary: str = Field(description="Brief summary of the business performance analysis")
    trends: List[str] = Field(description="List of 3-5 key trends identified in the data")
    recommendations: List[str] = Field(description="List of 3-5 actionable recommendations for business improvement")
    predictions: PredictionModel = Field(description="Predictions for future performance")


# ==================== AI INSIGHTS AGENT ====================

def get_analytics_data(umkm_id: int, db: Session, days: int = 30) -> Dict[str, Any]:
    """
    Fetch all analytics data from database (mimicking existing endpoints)

    Args:
        umkm_id: ID UMKM
        db: Database session
        days: Period in days for analysis

    Returns:
        Dictionary containing all analytics data
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    # ===== DASHBOARD DATA =====
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

    # Previous period comparison
    prev_start = start_date - timedelta(days=days)
    prev_stats = db.query(
        func.sum(Transaction.final_amount).label('revenue'),
        func.count(Transaction.id).label('count')
    ).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= prev_start,
        Transaction.transaction_date < start_date,
        Transaction.payment_status == "paid"
    ).first()

    prev_revenue = float(prev_stats.revenue or 0)
    prev_transactions = prev_stats.count or 0

    revenue_growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0

    # Total customers and products
    total_customers = db.query(func.count(Customer.id)).filter(
        Customer.umkm_id == umkm_id
    ).scalar() or 0

    total_products = db.query(func.count(Product.id)).filter(
        Product.umkm_id == umkm_id,
        Product.is_active == True
    ).scalar() or 0

    # ===== TOP PRODUCTS DATA =====
    top_products_query = db.query(
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
    ).order_by(desc('total_sold')).limit(10).all()

    top_products = [
        {
            'product_name': p.product_name,
            'category': p.category or 'Umum',
            'total_sold': p.total_sold,
            'total_revenue': float(p.total_revenue)
        } for p in top_products_query
    ]

    # ===== MONTHLY REPORT DATA =====
    monthly_data_query = db.query(
        func.strftime('%Y-%m', Transaction.transaction_date).label('month'),
        func.count(Transaction.id).label('count'),
        func.sum(Transaction.final_amount).label('revenue')
    ).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= end_date - timedelta(days=180),  # 6 months
        Transaction.payment_status == "paid"
    ).group_by('month').order_by('month').all()

    monthly_report = [
        {
            'month': m.month,
            'transaction_count': m.count,
            'revenue': float(m.revenue or 0)
        } for m in monthly_data_query
    ]

    # ===== PAYMENT METHOD STATS =====
    payment_stats_query = db.query(
        Transaction.payment_method,
        func.count(Transaction.id).label('count'),
        func.sum(Transaction.final_amount).label('amount')
    ).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= start_date,
        Transaction.payment_status == "paid"
    ).group_by(Transaction.payment_method).all()

    total_payment_amount = sum(float(p.amount or 0) for p in payment_stats_query)
    payment_methods = [
        {
            'payment_method': p.payment_method,
            'count': p.count,
            'total_amount': float(p.amount or 0),
            'percentage': round((float(p.amount or 0) / total_payment_amount * 100) if total_payment_amount > 0 else 0, 2)
        } for p in payment_stats_query
    ]

    # ===== DAILY SALES (Last 7 days) =====
    daily_data_query = db.query(
        func.date(Transaction.transaction_date).label('date'),
        func.count(Transaction.id).label('count'),
        func.sum(Transaction.final_amount).label('revenue')
    ).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= end_date - timedelta(days=7),
        Transaction.payment_status == "paid"
    ).group_by(func.date(Transaction.transaction_date)).all()

    daily_sales = [
        {
            'date': str(d.date),
            'transaction_count': d.count,
            'revenue': float(d.revenue or 0)
        } for d in daily_data_query
    ]

    return {
        'period_days': days,
        'current_period': {
            'total_revenue': total_revenue,
            'total_transactions': total_transactions,
            'average_transaction': round(total_revenue / total_transactions, 2) if total_transactions > 0 else 0,
            'total_customers': total_customers,
            'total_products': total_products
        },
        'previous_period': {
            'total_revenue': prev_revenue,
            'total_transactions': prev_transactions,
            'revenue_growth_percentage': round(revenue_growth, 2)
        },
        'top_products': top_products,
        'monthly_report': monthly_report,
        'payment_methods': payment_methods,
        'daily_sales': daily_sales
    }


def analyze_business_patterns(umkm_id: int, db: Session, days: int = 30) -> Dict[str, Any]:
    """
    Analyze business patterns and generate AI-powered insights using LLM

    Args:
        umkm_id: ID UMKM yang akan dianalisis
        db: Database session
        days: Periode analisis dalam hari (default 30)

    Returns:
        Dictionary containing summary, trends, recommendations, and predictions
    """

    # Fetch analytics data
    analytics_data = get_analytics_data(umkm_id, db, days)

    # Check if there's any data
    if analytics_data['current_period']['total_transactions'] == 0:
        return {
            'summary': 'Start recording transactions to get personalized AI insights.',
            'trends': [],
            'recommendations': ['Add your first transaction to begin tracking'],
            'predictions': {
                'next_month_revenue_estimate': None,
                'next_month_transaction_estimate': None,
                'confidence': 'low'
            }
        }

    # Initialize LLM
    llm = ChatOpenAI(
        model=settings.LLM_MODEL,
        base_url=settings.LLM_BASE_URL,
        api_key=settings.LLM_API_KEY,
        max_completion_tokens=512,
        temperature=0.5,
        top_p=0.5
    )

    # Prepare prompt for LLM
    system_prompt = """You are an expert business analyst for UMKM (Small and Medium Enterprises) in Indonesia.
Your role is to analyze business data and provide actionable insights, identify trends, and make predictions.

You will receive analytics data and must respond with a structured JSON containing:
- summary: A brief 1-2 sentence overview of business performance
- trends: Array of 3-5 key trends you identify (be specific with numbers and percentages)
- recommendations: Array of 3-5 actionable recommendations to improve the business
- predictions: Object with next_month_revenue_estimate, next_month_transaction_estimate, and confidence level

Be specific, data-driven, and provide insights in Bahasa Indonesia (casual/friendly tone).
Focus on practical advice that UMKM owners can implement immediately."""

    user_prompt = f"""Analyze this UMKM business data and provide insights:

**Period**: Last {analytics_data['period_days']} days

**Current Performance**:
- Total Revenue: Rp {analytics_data['current_period']['total_revenue']:,.0f}
- Total Transactions: {analytics_data['current_period']['total_transactions']}
- Average Transaction: Rp {analytics_data['current_period']['average_transaction']:,.0f}
- Total Customers: {analytics_data['current_period']['total_customers']}
- Active Products: {analytics_data['current_period']['total_products']}

**Comparison with Previous Period**:
- Previous Revenue: Rp {analytics_data['previous_period']['total_revenue']:,.0f}
- Previous Transactions: {analytics_data['previous_period']['total_transactions']}
- Revenue Growth: {analytics_data['previous_period']['revenue_growth_percentage']:.1f}%

**Top Products**:
{json.dumps(analytics_data['top_products'][:5], indent=2, ensure_ascii=False)}

**Monthly Trend (Last 6 Months)**:
{json.dumps(analytics_data['monthly_report'], indent=2, ensure_ascii=False)}

**Payment Methods**:
{json.dumps(analytics_data['payment_methods'], indent=2, ensure_ascii=False)}

**Daily Sales (Last 7 Days)**:
{json.dumps(analytics_data['daily_sales'], indent=2, ensure_ascii=False)}

Provide insights in this exact JSON format:
{{
    "summary": "string",
    "trends": ["trend1", "trend2", "trend3"],
    "recommendations": ["rec1", "rec2", "rec3"],
    "predictions": {{
        "next_month_revenue_estimate": float or null,
        "next_month_transaction_estimate": int or null,
        "confidence": "high" | "medium" | "low"
    }}
}}"""

    try:
        # Call LLM with structured output
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ])

        # Parse the response
        response_text = response.content.strip()

        # Extract JSON from response (handle if LLM adds extra text)
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()

        insights = json.loads(response_text)

        # Validate and return
        return {
            'summary': insights.get('summary', 'Analysis completed'),
            'trends': insights.get('trends', [])[:5],  # Max 5 trends
            'recommendations': insights.get('recommendations', [])[:5],  # Max 5 recommendations
            'predictions': insights.get('predictions', {
                'next_month_revenue_estimate': None,
                'next_month_transaction_estimate': None,
                'confidence': 'low'
            })
        }

    except Exception as e:
        print(f"Error generating AI insights: {e}")
        # Fallback to basic insights if LLM fails
        return {
            'summary': f"Analyzed {analytics_data['current_period']['total_transactions']} transactions worth Rp {analytics_data['current_period']['total_revenue']:,.0f} over the last {days} days",
            'trends': [
                f"Revenue growth: {analytics_data['previous_period']['revenue_growth_percentage']:.1f}%",
                f"Average transaction value: Rp {analytics_data['current_period']['average_transaction']:,.0f}"
            ],
            'recommendations': [
                "Continue monitoring your business performance",
                "Focus on customer retention and satisfaction"
            ],
            'predictions': {
                'next_month_revenue_estimate': analytics_data['current_period']['total_revenue'],
                'next_month_transaction_estimate': analytics_data['current_period']['total_transactions'],
                'confidence': 'low'
            }
        }


def get_business_health_score(umkm_id: int, db: Session) -> Dict[str, Any]:
    """
    Calculate business health score based on multiple metrics

    Args:
        umkm_id: ID UMKM
        db: Database session

    Returns:
        Dictionary containing health score and breakdown
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    prev_start = start_date - timedelta(days=30)

    scores = {}

    # 1. Revenue Growth Score (0-25 points)
    current_revenue = db.query(func.sum(Transaction.final_amount)).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= start_date,
        Transaction.payment_status == "paid"
    ).scalar() or 0

    prev_revenue = db.query(func.sum(Transaction.final_amount)).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= prev_start,
        Transaction.transaction_date < start_date,
        Transaction.payment_status == "paid"
    ).scalar() or 0

    if prev_revenue > 0:
        growth_rate = ((current_revenue - prev_revenue) / prev_revenue) * 100
        if growth_rate >= 20:
            scores['revenue_growth'] = 25
        elif growth_rate >= 10:
            scores['revenue_growth'] = 20
        elif growth_rate >= 0:
            scores['revenue_growth'] = 15
        elif growth_rate >= -10:
            scores['revenue_growth'] = 10
        else:
            scores['revenue_growth'] = 5
    else:
        scores['revenue_growth'] = 15 if current_revenue > 0 else 0

    # 2. Transaction Consistency Score (0-25 points)
    daily_trans = db.query(
        func.date(Transaction.transaction_date).label('date'),
        func.count(Transaction.id).label('count')
    ).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= start_date,
        Transaction.payment_status == "paid"
    ).group_by(func.date(Transaction.transaction_date)).all()

    if daily_trans:
        days_with_sales = len(daily_trans)
        total_days = (end_date - start_date).days
        consistency_rate = (days_with_sales / total_days) * 100 if total_days > 0 else 0

        if consistency_rate >= 80:
            scores['consistency'] = 25
        elif consistency_rate >= 60:
            scores['consistency'] = 20
        elif consistency_rate >= 40:
            scores['consistency'] = 15
        elif consistency_rate >= 20:
            scores['consistency'] = 10
        else:
            scores['consistency'] = 5
    else:
        scores['consistency'] = 0

    # 3. Product Diversification Score (0-25 points)
    active_products = db.query(func.count(func.distinct(TransactionItem.product_id))).join(
        Transaction
    ).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= start_date,
        Transaction.payment_status == "paid"
    ).scalar() or 0

    if active_products >= 20:
        scores['diversification'] = 25
    elif active_products >= 10:
        scores['diversification'] = 20
    elif active_products >= 5:
        scores['diversification'] = 15
    elif active_products >= 2:
        scores['diversification'] = 10
    else:
        scores['diversification'] = 5

    # 4. Customer Base Score (0-25 points)
    active_customers = db.query(func.count(func.distinct(Transaction.customer_id))).filter(
        Transaction.umkm_id == umkm_id,
        Transaction.transaction_date >= start_date,
        Transaction.payment_status == "paid",
        Transaction.customer_id.isnot(None)
    ).scalar() or 0

    if active_customers >= 50:
        scores['customer_base'] = 25
    elif active_customers >= 25:
        scores['customer_base'] = 20
    elif active_customers >= 10:
        scores['customer_base'] = 15
    elif active_customers >= 5:
        scores['customer_base'] = 10
    else:
        scores['customer_base'] = 5

    # Calculate total score
    total_score = sum(scores.values())

    # Determine health status
    if total_score >= 80:
        status = "Excellent"
        message = "Your business is performing exceptionally well!"
    elif total_score >= 60:
        status = "Good"
        message = "Your business is on a healthy track with room for growth"
    elif total_score >= 40:
        status = "Fair"
        message = "Your business shows potential but needs improvement in some areas"
    else:
        status = "Needs Attention"
        message = "Consider implementing the recommendations to improve business health"

    return {
        'total_score': total_score,
        'status': status,
        'message': message,
        'breakdown': scores,
        'max_score': 100
    }
