"""
Notification SQLAlchemy Model
"""
from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base
from app.utils.enums import NotificationChannel, NotificationStatus

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(Integer, ForeignKey("dunning_rules.id", ondelete="SET NULL"), nullable=True)
    channel = Column(Enum(NotificationChannel), nullable=False, index=True)
    message = Column(Text, nullable=False)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.PENDING, index=True)
    sent_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    customer = relationship("Customer", back_populates="notifications")
    rule = relationship("DunningRule", back_populates="notifications")
