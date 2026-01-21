"""
DunningRule SQLAlchemy Model
"""
from sqlalchemy import Column, Integer, String, Boolean, Enum, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base
from app.utils.enums import CustomerType, ActionType, NotificationChannel

class DunningRule(Base):
    __tablename__ = "dunning_rules"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rule_name = Column(String(100), nullable=False)
    customer_type = Column(Enum(CustomerType), nullable=False, index=True)
    trigger_day = Column(Integer, nullable=False, index=True)
    action_type = Column(Enum(ActionType), nullable=False)
    notification_channel = Column(Enum(NotificationChannel), nullable=False)
    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    notifications = relationship("Notification", back_populates="rule")
    dunning_logs = relationship(
    "DunningLog",
    back_populates="rule",
    cascade="all, delete-orphan"
)
