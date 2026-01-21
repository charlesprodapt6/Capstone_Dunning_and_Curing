"""
Customer Pydantic Schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date, datetime
from app.utils.enums import CustomerType, DunningStatus

# Base schema with common fields
class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=20)
    customer_type: CustomerType
    plan_type: str = Field(..., min_length=1, max_length=50)

# Schema for creating customer
class CustomerCreate(CustomerBase):
    billing_date: Optional[date] = None
    due_date: Optional[date] = None
    outstanding_amount: Optional[float] = 0.00

# Schema for updating customer
class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    plan_type: Optional[str] = Field(None, min_length=1, max_length=50)
    billing_date: Optional[date] = None
    due_date: Optional[date] = None
    outstanding_amount: Optional[float] = None
    overdue_days: Optional[int] = None
    dunning_status: Optional[DunningStatus] = None

# Schema for response
class CustomerResponse(CustomerBase):
    id: int
    billing_date: Optional[date]
    due_date: Optional[date]
    overdue_days: int
    outstanding_amount: float
    dunning_status: DunningStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Schema for customer status
class CustomerStatus(BaseModel):
    id: int
    name: str
    email: str
    customer_type: CustomerType
    dunning_status: DunningStatus
    overdue_days: int
    outstanding_amount: float
    last_payment_date: Optional[datetime]
    total_notifications: int
    
    class Config:
        from_attributes = True
