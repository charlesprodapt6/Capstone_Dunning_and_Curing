"""
Notification Pydantic Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.utils.enums import NotificationChannel, NotificationStatus

class NotificationBase(BaseModel):
    customer_id: int
    channel: NotificationChannel
    message: str = Field(..., min_length=1)

class NotificationCreate(NotificationBase):
    rule_id: Optional[int] = None

class NotificationResponse(NotificationBase):
    id: int
    rule_id: Optional[int]
    status: NotificationStatus
    sent_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class NotificationSendRequest(BaseModel):
    customer_ids: list[int]
    channel: NotificationChannel
    message: str = Field(..., min_length=1)
    
class NotificationSendResponse(BaseModel):
    total_sent: int
    successful: int
    failed: int
    notification_ids: list[int]
