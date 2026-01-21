"""
Curing Operations API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.config.database import get_db
from app.models.customer import Customer
from app.models.payment import Payment
from app.models.curing_action import CuringAction
from app.schemas.curing import CuringTriggerRequest, CuringActionResponse, CuringExecutionResponse
from app.services.curing_service import CuringService
import logging

router = APIRouter(prefix="/curing", tags=["Curing Operations"])

logger = logging.getLogger(__name__)

@router.post("/trigger/{customer_id}", response_model=CuringExecutionResponse)
def trigger_curing(
    customer_id: int,
    request: CuringTriggerRequest,
    db: Session = Depends(get_db)
):
    """
    Manually trigger curing workflow for a customer
    """
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Verify payment exists
    payment = db.query(Payment).filter(Payment.id == request.payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Verify payment belongs to customer
    if payment.customer_id != customer_id:
        raise HTTPException(status_code=400, detail="Payment does not belong to this customer")
    
    # Execute curing
    curing_service = CuringService(db)
    result = curing_service.execute_curing(customer_id, request.payment_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("message", "Curing failed"))
    
    return CuringExecutionResponse(**result)

@router.get("/history/{customer_id}", response_model=List[CuringActionResponse])
def get_curing_history(customer_id: int, db: Session = Depends(get_db)):
    """
    Get curing history for a customer
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    curing_actions = db.query(CuringAction).filter(
        CuringAction.customer_id == customer_id
    ).order_by(CuringAction.cured_at.desc()).all()
    
    # Format response
    response = []
    for action in curing_actions:
        response.append(CuringActionResponse(
            id=action.id,
            customer_id=action.customer_id,
            customer_name=action.customer.name,
            payment_id=action.payment_id,
            previous_status=action.previous_status,
            action_taken=action.action_taken,
            success_flag=action.success_flag,
            cured_at=action.cured_at,
            remarks=action.remarks
        ))
    
    return response

@router.get("/actions", response_model=List[CuringActionResponse])
@router.get("/actions")
def get_all_curing_actions(db: Session = Depends(get_db)):
    """
    Get all curing actions with customer details
    """
    try:
        # Get all curing actions
        actions = db.query(CuringAction).order_by(CuringAction.cured_at.desc()).all()
        
        # Get all customers for mapping
        customers = db.query(Customer).all()
        customer_map = {c.id: c for c in customers}
        
        results = []
        for action in actions:
            customer = customer_map.get(action.customer_id)
            results.append({
                "id": action.id,
                "customer_id": action.customer_id,
                "payment_id": action.payment_id,
                "previous_status": action.previous_status,
                "action_taken": action.action_taken,
                "success_flag": action.success_flag,
                "cured_at": action.cured_at.isoformat() if action.cured_at else None,
                "remarks": action.remarks,
                "customer_name": customer.name if customer else f"Customer {action.customer_id}",
                "customer_email": customer.email if customer else None,
                "customer_type": customer.customer_type if customer else None,
                "dunning_status": customer.dunning_status if customer else None
            })
        
        logger.info(f"Returning {len(results)} curing actions")
        return results
    
    except Exception as e:
        logger.error(f"Error fetching curing actions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch curing actions: {str(e)}")


@router.get("/actions/count")
def get_curing_actions_count(db: Session = Depends(get_db)):
    """
    Get count of curing actions (for testing)
    """
    try:
        count = db.query(CuringAction).count()
        return {"count": count}
    except Exception as e:
        logger.error(f"Error counting curing actions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")