from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, products, customers, transactions, analytics
from app.core.database import engine, Base
from app.models import User, UMKM, Product, Customer, Transaction, TransactionItem
import uvicorn

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GarudaAI UMKM API",
    description="API for UMKM Management System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(transactions.router)
app.include_router(analytics.router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to GarudaAI UMKM API",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
