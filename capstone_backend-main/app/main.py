"""
FastAPI Main Application
Entry point for the Dunning and Curing Management System
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.config.settings import settings
from app.routers import curing
from app.config.database import engine, Base
from app.routers import customers, dunning, payments, curing, payment_success, customer_portal, chatbot


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Dunning and Curing Management System for Telecom Billing",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customers.router, prefix=settings.API_V1_PREFIX)
app.include_router(dunning.router, prefix=settings.API_V1_PREFIX)
app.include_router(payments.router, prefix=settings.API_V1_PREFIX)
app.include_router(curing.router, prefix=settings.API_V1_PREFIX)
app.include_router(customer_portal.router, prefix=settings.API_V1_PREFIX)
app.include_router(payment_success.router, prefix=settings.API_V1_PREFIX)  # NEW
app.include_router(curing.router, prefix=settings.API_V1_PREFIX)
app.include_router(chatbot.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    """
    Root endpoint - Health check
    """
    return {
        "message": "Dunning and Curing Management System API - Sprint 2",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
        "sprint": "Sprint 2 - Enhanced Notifications & Curing"
    }

@app.get("/health")
def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
