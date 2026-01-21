"""
Payment Management API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.config.database import get_db
from app.models.payment import Payment
from app.models.customer import Customer
from app.schemas.payment import PaymentCreate, PaymentResponse, PaymentWebhook
from app.utils.enums import PaymentStatus
from app.services.curing_service import CuringService

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    customer_id: Optional[int] = None,
    status: Optional[PaymentStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    Get all payments with optional filters
    """
    query = db.query(Payment)
    
    if customer_id:
        query = query.filter(Payment.customer_id == customer_id)
    
    if status:
        query = query.filter(Payment.payment_status == status)
    
    payments = query.order_by(Payment.payment_date.desc()).offset(skip).limit(limit).all()
    return payments

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    """
    Get payment by ID
    """
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@router.post("/", response_model=PaymentResponse, status_code=201)
def create_payment(payment_data: PaymentCreate, db: Session = Depends(get_db)):
    """
    Record new payment
    """
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == payment_data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Create payment record
    payment = Payment(**payment_data.model_dump())
    payment.payment_status = PaymentStatus.SUCCESS  # Assume success for manual entry
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    # Trigger curing workflow if payment is successful
    if payment.payment_status == PaymentStatus.SUCCESS:
        curing_service = CuringService(db)
        curing_result = curing_service.execute_curing(customer.id, payment.id)
        
        if not curing_result.get("success"):
            # Log warning but don't fail payment creation
            print(f"Warning: Curing failed for payment {payment.id}: {curing_result.get('message')}")
    
    return payment

@router.post("/webhook", status_code=200)
def payment_webhook(webhook_data: PaymentWebhook, db: Session = Depends(get_db)):
    """
    Handle payment gateway webhook
    Receives payment confirmation from external payment gateway
    """
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == webhook_data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if payment already exists
    existing_payment = db.query(Payment).filter(
        Payment.transaction_id == webhook_data.transaction_id
    ).first()
    
    if existing_payment:
        return {
            "status": "duplicate",
            "message": "Payment already processed",
            "payment_id": existing_payment.id
        }
    
    # Create payment record
    payment = Payment(
        customer_id=webhook_data.customer_id,
        amount=webhook_data.amount,
        payment_method=webhook_data.payment_method,
        payment_status=PaymentStatus.SUCCESS if webhook_data.status.lower() == "success" else PaymentStatus.FAILED,
        transaction_id=webhook_data.transaction_id,
        payment_date=webhook_data.timestamp
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    # Trigger curing if payment successful
    if webhook_data.status.lower() == "success":
        curing_service = CuringService(db)
        curing_result = curing_service.execute_curing(customer.id, payment.id)
        
        return {
            "status": "success",
            "message": "Payment processed and curing triggered",
            "payment_id": payment.id,
            "curing_result": curing_result
        }
    else:
        return {
            "status": "failed",
            "message": "Payment failed",
            "payment_id": payment.id
        }
