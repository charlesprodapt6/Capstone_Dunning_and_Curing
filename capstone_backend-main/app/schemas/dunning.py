"""
Dunning-related Pydantic Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.utils.enums import CustomerType, ActionType, NotificationChannel

# Dunning Rule Schemas
class DunningRuleBase(BaseModel):
    rule_name: str = Field(..., min_length=1, max_length=100)
    customer_type: CustomerType
    trigger_day: int = Field(..., ge=0, le=365)
    action_type: ActionType
    notification_channel: NotificationChannel

class DunningRuleCreate(DunningRuleBase):
    priority: Optional[int] = 0
    is_active: Optional[bool] = True

class DunningRuleUpdate(BaseModel):
    rule_name: Optional[str] = Field(None, min_length=1, max_length=100)
    trigger_day: Optional[int] = Field(None, ge=0, le=365)
    action_type: Optional[ActionType] = None
    notification_channel: Optional[NotificationChannel] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None

class DunningRuleResponse(DunningRuleBase):
    id: int
    priority: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Dunning Execution Schemas
class DunningExecutionRequest(BaseModel):
    customer_ids: Optional[List[int]] = None  # None means all overdue customers
    force: Optional[bool] = False  # Force execution even if already executed today

class DunningExecutionResult(BaseModel):
    customer_id: int
    customer_name: str
    overdue_days: int
    rules_applied: int
    actions_taken: List[str]
    notifications_sent: int
    status: str  # SUCCESS, FAILED, SKIPPED
    message: Optional[str] = None

class DunningExecutionResponse(BaseModel):
    total_customers: int
    successful: int
    failed: int
    skipped: int
    results: List[DunningExecutionResult]
    execution_time: float  # seconds

# Dunning Log Schemas
class DunningLogResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    rule_id: Optional[int]
    rule_name: Optional[str]
    action_type: str
    status: str
    details: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True
