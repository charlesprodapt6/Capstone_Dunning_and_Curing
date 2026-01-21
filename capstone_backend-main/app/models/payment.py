"""
Payment SQLAlchemy Model
"""
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, TIMESTAMP
from sqlalchemy.types import DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base
from app.utils.enums import PaymentMethod, PaymentStatus

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(DECIMAL(10, 2), nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, index=True)
    transaction_id = Column(String(100), unique=True)
    payment_date = Column(TIMESTAMP, server_default=func.now(), index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    customer = relationship("Customer", back_populates="payments")
    curing_actions = relationship("CuringAction", back_populates="payment", cascade="all, delete-orphan")
