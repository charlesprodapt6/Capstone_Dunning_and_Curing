"""
Customer Management API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.config.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerStatus
from app.utils.enums import CustomerType, DunningStatus

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    customer_type: Optional[CustomerType] = None,
    dunning_status: Optional[DunningStatus] = None,
    db: Session = Depends(get_db)
):
    """
    Get all customers with optional filtering
    """
    query = db.query(Customer)
    
    if customer_type:
        query = query.filter(Customer.customer_type == customer_type)
    
    if dunning_status:
        query = query.filter(Customer.dunning_status == dunning_status)
    
    customers = query.offset(skip).limit(limit).all()
    return customers

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """
    Get customer by ID
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("/", response_model=CustomerResponse, status_code=201)
def create_customer(customer_data: CustomerCreate, db: Session = Depends(get_db)):
    """
    Create new customer
    """
    # Check if email already exists
    existing = db.query(Customer).filter(Customer.email == customer_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    customer = Customer(**customer_data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db)
):
    """
    Update customer details
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Update only provided fields
    for key, value in customer_data.model_dump(exclude_unset=True).items():
        setattr(customer, key, value)
    
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{customer_id}", status_code=204)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """
    Delete customer
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(customer)
    db.commit()
    return None

@router.get("/{customer_id}/status", response_model=dict)
def get_customer_status(customer_id: int, db: Session = Depends(get_db)):
    """
    Get detailed customer dunning status
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get last payment
    last_payment = None
    if customer.payments:
        sorted_payments = sorted(customer.payments, key=lambda x: x.payment_date, reverse=True)
        if sorted_payments:
            last_payment = sorted_payments[0].payment_date
    
    # Count notifications
    notification_count = len(customer.notifications)
    
    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "customer_type": customer.customer_type.value,
        "dunning_status": customer.dunning_status.value,
        "overdue_days": customer.overdue_days,
        "outstanding_amount": float(customer.outstanding_amount),
        "due_date": customer.due_date,
        "last_payment_date": last_payment,
        "total_notifications": notification_count,
        "total_payments": len(customer.payments)
    }
