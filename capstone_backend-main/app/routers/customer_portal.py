from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.customer import Customer
from app.models.payment import Payment
from app.models.notification import Notification
from app.services.curing_service import CuringService
from app.utils.enums import PaymentStatus, PaymentMethod
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/customer-portal", tags=["Customer Portal"])

# Schemas
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    user: Optional[dict] = None
    message: str

class PaymentSimulationRequest(BaseModel):
    customer_id: int
    amount: float
    payment_method: str = "UPI"

# Authentication endpoint
@router.post("/login", response_model=LoginResponse)
def customer_login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Unified login for admin and customers
    Admin: admin@dunning.com / admin123
    Customer: customer_email / phone_number
    """
    try:
        # Check admin
        if request.email == "admin@dunning.com" and request.password == "admin123":
            return LoginResponse(
                success=True,
                user={
                    "id": 0,
                    "email": request.email,
                    "name": "Administrator",
                    "role": "ADMIN",
                    "token": "admin-mock-token"
                },
                message="Login successful"
            )
        
        # Check customer
        customer = db.query(Customer).filter(Customer.email == request.email).first()
        if customer and customer.phone == request.password:
            return LoginResponse(
                success=True,
                user={
                    "id": customer.id,
                    "email": customer.email,
                    "name": customer.name,
                    "role": "CUSTOMER",
                    "customer_type": customer.customer_type,
                    "token": f"customer-token-{customer.id}"
                },
                message="Login successful"
            )
        
        return LoginResponse(
            success=False,
            user=None,
            message="Invalid credentials"
        )
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Customer profile endpoint
@router.get("/profile/{customer_id}")
def get_customer_profile(customer_id: int, db: Session = Depends(get_db)):
    """
    Get customer profile with payments and notifications
    """
    try:
        # Get customer
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")
        
        # Get payments
        payments_query = db.query(Payment).filter(
            Payment.customer_id == customer_id
        ).order_by(Payment.payment_date.desc()).limit(10).all()
        
        # Get notifications
        notifications_query = db.query(Notification).filter(
            Notification.customer_id == customer_id
        ).order_by(Notification.created_at.desc()).limit(5).all()
        
        # Build response
        response = {
            "customer": {
                "id": customer.id,
                "name": customer.name,
                "email": customer.email,
                "phone": customer.phone,
                "customer_type": customer.customer_type,
                "plan_type": customer.plan_type,
                "billing_date": customer.billing_date.isoformat() if customer.billing_date else None,
                "due_date": customer.due_date.isoformat() if customer.due_date else None,
                "overdue_days": customer.overdue_days,
                "outstanding_amount": float(customer.outstanding_amount),
                "dunning_status": customer.dunning_status,
            },
            "payments": [
                {
                    "id": p.id,
                    "amount": float(p.amount),
                    "payment_method": p.payment_method,
                    "payment_status": p.payment_status,
                    "payment_date": p.payment_date.isoformat() if p.payment_date else None,
                    "transaction_id": p.transaction_id
                } for p in payments_query
            ],
            "notifications": [
                {
                    "id": n.id,
                    "message": n.message,
                    "channel": n.channel,
                    "status": n.status,
                    "created_at": n.created_at.isoformat() if n.created_at else None
                } for n in notifications_query
            ]
        }
        
        logger.info(f"Profile fetched for customer {customer_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profile for customer {customer_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Payment simulation endpoint
@router.post("/make-payment")
def simulate_payment(request: PaymentSimulationRequest, db: Session = Depends(get_db)):
    """
    Simulate payment processing
    """
    try:
        customer = db.query(Customer).filter(Customer.id == request.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        if request.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")
        
        # Create payment
        payment = Payment(
            customer_id=request.customer_id,
            amount=request.amount,
            payment_method=PaymentMethod[request.payment_method.upper()],
            payment_status=PaymentStatus.SUCCESS,
            transaction_id=f"TXN{datetime.now().strftime('%Y%m%d%H%M%S')}{request.customer_id}",
            payment_date=datetime.now()
        )
        db.add(payment)
        db.flush()
        
        # Trigger curing
        curing_service = CuringService(db)
        curing_result = curing_service.execute_curing(customer.id, payment.id)
        
        db.commit()
        db.refresh(payment)
        db.refresh(customer)
        
        return {
            "success": True,
            "message": "Payment processed successfully",
            "payment": {
                "id": payment.id,
                "amount": float(payment.amount),
                "transaction_id": payment.transaction_id
            },
            "customer": {
                "outstanding_amount": float(customer.outstanding_amount),
                "dunning_status": customer.dunning_status
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Payment error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment failed: {str(e)}")
