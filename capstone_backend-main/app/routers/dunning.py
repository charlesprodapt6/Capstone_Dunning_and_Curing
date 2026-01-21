"""
Dunning Operations API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import time
from app.config.database import get_db
from app.schemas.dunning import (
    DunningRuleCreate, DunningRuleUpdate, DunningRuleResponse,
    DunningExecutionRequest, DunningExecutionResponse, DunningExecutionResult,
    DunningLogResponse
)
from app.models.dunning_rule import DunningRule
from app.models.dunning_log import DunningLog
from app.models.customer import Customer
from app.services.rule_engine import RuleEngine
from app.utils.enums import CustomerType

router = APIRouter(prefix="/dunning", tags=["Dunning Operations"])

# ============== Dunning Rules Management ==============

@router.get("/rules", response_model=List[DunningRuleResponse])
def get_dunning_rules(
    customer_type: Optional[CustomerType] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    Get all dunning rules with optional filters
    """
    query = db.query(DunningRule)
    
    if customer_type:
        query = query.filter(DunningRule.customer_type == customer_type)
    
    if is_active is not None:
        query = query.filter(DunningRule.is_active == is_active)
    
    rules = query.order_by(DunningRule.trigger_day, DunningRule.priority.desc()).all()
    return rules

@router.get("/rules/{rule_id}", response_model=DunningRuleResponse)
def get_dunning_rule(rule_id: int, db: Session = Depends(get_db)):
    """
    Get dunning rule by ID
    """
    rule = db.query(DunningRule).filter(DunningRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Dunning rule not found")
    return rule

@router.post("/rules", response_model=DunningRuleResponse, status_code=201)
def create_dunning_rule(rule_data: DunningRuleCreate, db: Session = Depends(get_db)):
    """
    Create new dunning rule
    """
    rule = DunningRule(**rule_data.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.put("/rules/{rule_id}", response_model=DunningRuleResponse)
def update_dunning_rule(
    rule_id: int,
    rule_data: DunningRuleUpdate,
    db: Session = Depends(get_db)
):
    """
    Update dunning rule
    """
    rule = db.query(DunningRule).filter(DunningRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Dunning rule not found")
    
    for key, value in rule_data.model_dump(exclude_unset=True).items():
        setattr(rule, key, value)
    
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/rules/{rule_id}", status_code=204)
def delete_dunning_rule(rule_id: int, db: Session = Depends(get_db)):
    """
    Delete dunning rule
    """
    rule = db.query(DunningRule).filter(DunningRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Dunning rule not found")
    
    db.delete(rule)
    db.commit()
    return None

# ============== Dunning Execution ==============

@router.post("/apply", response_model=DunningExecutionResponse)
def apply_dunning_all(
    request: Optional[DunningExecutionRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Trigger dunning for all overdue customers or specific customer IDs
    """
    start_time = time.time()
    rule_engine = RuleEngine(db)
    
    results = []
    
    if request and request.customer_ids:
        # Process specific customers
        for customer_id in request.customer_ids:
            result = rule_engine.process_customer(customer_id)
            results.append(result)
    else:
        # Process all overdue customers
        results = rule_engine.process_all_overdue_customers()
    
    # Calculate statistics
    successful = sum(1 for r in results if r.get("status") == "SUCCESS")
    failed = sum(1 for r in results if r.get("status") == "FAILED")
    skipped = sum(1 for r in results if r.get("status") == "SKIPPED")
    
    execution_time = time.time() - start_time
    
    # Convert results to response format
    execution_results = []
    for r in results:
        execution_results.append(DunningExecutionResult(
            customer_id=r["customer_id"],
            customer_name=r.get("customer_name", "Unknown"),
            overdue_days=r.get("overdue_days", 0),
            rules_applied=r.get("rules_applied", 0),
            actions_taken=r.get("actions_taken", []),
            notifications_sent=r.get("notifications_sent", 0),
            status=r["status"],
            message=r.get("message")
        ))
    
    return DunningExecutionResponse(
        total_customers=len(results),
        successful=successful,
        failed=failed,
        skipped=skipped,
        results=execution_results,
        execution_time=execution_time
    )

@router.post("/apply/{customer_id}", response_model=dict)
def apply_dunning_single(customer_id: int, db: Session = Depends(get_db)):
    """
    Trigger dunning for a specific customer
    """
    # Check if customer exists
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    rule_engine = RuleEngine(db)
    result = rule_engine.process_customer(customer_id)
    
    return result

# ============== Dunning Logs ==============

@router.get("/logs", response_model=List[DunningLogResponse])
def get_dunning_logs(
    customer_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    Get dunning execution logs with filters
    """
    query = db.query(DunningLog)
    
    if customer_id:
        query = query.filter(DunningLog.customer_id == customer_id)
    
    if date_from:
        query = query.filter(DunningLog.created_at >= date_from)
    
    if date_to:
        query = query.filter(DunningLog.created_at <= date_to)
    
    logs = query.order_by(DunningLog.created_at.desc()).offset(skip).limit(limit).all()
    
    # Format response
    response = []
    for log in logs:
        customer_name = log.customer.name if log.customer else "Unknown"
        rule_name = log.rule.rule_name if log.rule else None
        
        response.append(DunningLogResponse(
            id=log.id,
            customer_id=log.customer_id,
            customer_name=customer_name,
            rule_id=log.rule_id,
            rule_name=rule_name,
            action_type=log.action_type,
            status=log.status,
            details=log.details,
            created_at=log.created_at
        ))
    
    return response

@router.get("/overdue-customers", response_model=List[dict])
def get_overdue_customers(db: Session = Depends(get_db)):
    """
    Get list of all overdue customers
    """
    customers = db.query(Customer).filter(
        Customer.outstanding_amount > 0,
        Customer.overdue_days > 0
    ).order_by(Customer.overdue_days.desc()).all()
    
    return [
        {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "customer_type": c.customer_type.value,
            "overdue_days": c.overdue_days,
            "outstanding_amount": float(c.outstanding_amount),
            "dunning_status": c.dunning_status.value,
            "due_date": c.due_date
        }
        for c in customers
    ]
