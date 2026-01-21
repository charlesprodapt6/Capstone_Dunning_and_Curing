"""
Payment Success Endpoint - Sprint 2
Handles payment gateway success callbacks
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime
from app.config.database import get_db
from app.models.customer import Customer
from app.models.payment import Payment
from app.schemas.payment import PaymentWebhook
from app.utils.enums import PaymentStatus, PaymentMethod
from app.services.curing_service import CuringService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payment-success", tags=["Payment Success"])

@router.post("/", response_model=Dict[str, Any])
def handle_payment_success(
    webhook_data: PaymentWebhook,
    db: Session = Depends(get_db)
):
    """
    Handle payment success webhook from payment gateway
    Automatically triggers curing workflow
    """
    try:
        logger.info(f"📥 Received payment success webhook: {webhook_data.transaction_id}")
        
        # Validate customer exists
        customer = db.query(Customer).filter(
            Customer.id == webhook_data.customer_id
        ).first()
        
        if not customer:
            logger.error(f"Customer {webhook_data.customer_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer {webhook_data.customer_id} not found"
            )
        
        # Check for duplicate transaction
        existing_payment = db.query(Payment).filter(
            Payment.transaction_id == webhook_data.transaction_id
        ).first()
        
        if existing_payment:
            logger.warning(f"Duplicate transaction: {webhook_data.transaction_id}")
            return {
                "status": "duplicate",
                "message": "Payment already processed",
                "payment_id": existing_payment.id,
                "customer_id": customer.id,
                "customer_name": customer.name
            }
        
        # Validate payment status
        if webhook_data.status.lower() != "success":
            logger.warning(f"Payment status is {webhook_data.status}, not success")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment status must be 'success', got '{webhook_data.status}'"
            )
        
        # Create payment record
        payment = Payment(
            customer_id=webhook_data.customer_id,
            amount=webhook_data.amount,
            payment_method=PaymentMethod[webhook_data.payment_method.upper()],
            payment_status=PaymentStatus.SUCCESS,
            transaction_id=webhook_data.transaction_id,
            payment_date=webhook_data.timestamp
        )
        
        db.add(payment)
        db.flush()  # Get payment ID without committing
        
        logger.info(f"💰 Payment created: ID={payment.id}, Amount=₹{payment.amount}")
        
        # Trigger curing workflow
        curing_service = CuringService(db)
        curing_result = curing_service.execute_curing(customer.id, payment.id)
        
        # Commit payment (curing service handles its own commit)
        db.commit()
        db.refresh(payment)
        
        if curing_result.get("success"):
            logger.info(f"✅ Payment success handler completed for customer {customer.id}")
            return {
                "status": "success",
                "message": "Payment processed and curing completed",
                "payment_id": payment.id,
                "transaction_id": payment.transaction_id,
                "customer_id": customer.id,
                "customer_name": customer.name,
                "amount": float(payment.amount),
                "curing_result": curing_result
            }
        else:
            logger.error(f"❌ Curing failed: {curing_result.get('message')}")
            return {
                "status": "payment_success_curing_failed",
                "message": "Payment recorded but curing failed",
                "payment_id": payment.id,
                "transaction_id": payment.transaction_id,
                "customer_id": customer.id,
                "curing_error": curing_result.get("message")
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in payment success handler: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment processing failed: {str(e)}"
        )
