"""
CuringAction SQLAlchemy Model
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class CuringAction(Base):
    __tablename__ = "curing_actions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False)
    previous_status = Column(String(50), nullable=False)
    action_taken = Column(Text, nullable=False)
    success_flag = Column(Boolean, default=True)
    cured_at = Column(TIMESTAMP)
    remarks = Column(Text, nullable=True)
    # Relationships
    customer = relationship("Customer", back_populates="curing_actions")
    payment = relationship("Payment", back_populates="curing_actions")
