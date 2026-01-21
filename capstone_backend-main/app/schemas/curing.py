"""
Curing Pydantic Schemas
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CuringTriggerRequest(BaseModel):
    payment_id: int

class CuringActionResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    payment_id: int
    previous_status: str
    action_taken: str
    success_flag: bool
    cured_at: datetime
    remarks: Optional[str]
    
    class Config:
        from_attributes = True

class CuringExecutionResponse(BaseModel):
    customer_id: int
    customer_name: str
    previous_status: str
    new_status: str
    actions_taken: list[str]
    notifications_sent: int
    success: bool
    message: str
