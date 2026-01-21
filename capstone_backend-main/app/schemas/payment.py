"""
Payment Pydantic Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.utils.enums import PaymentMethod, PaymentStatus

class PaymentBase(BaseModel):
    customer_id: int
    amount: float = Field(..., gt=0)
    payment_method: PaymentMethod

class PaymentCreate(PaymentBase):
    transaction_id: Optional[str] = None

class PaymentUpdate(BaseModel):
    payment_status: PaymentStatus
    transaction_id: Optional[str] = None

class PaymentResponse(PaymentBase):
    id: int
    payment_status: PaymentStatus
    transaction_id: Optional[str]
    payment_date: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

# Payment webhook schema (from payment gateway)
class PaymentWebhook(BaseModel):
    transaction_id: str
    customer_id: int
    amount: float
    payment_method: str
    status: str  # success, failed, pending
    timestamp: datetime
    gateway_reference: Optional[str] = None
