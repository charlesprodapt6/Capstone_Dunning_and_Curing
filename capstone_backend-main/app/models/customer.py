"""
Customer SQLAlchemy Model
"""
from sqlalchemy import Column, Integer, String, Date, Enum, TIMESTAMP
from sqlalchemy.types import DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base
from app.utils.enums import CustomerType, DunningStatus

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=False)
    customer_type = Column(Enum(CustomerType), nullable=False, index=True)
    plan_type = Column(String(50), nullable=False)
    billing_date = Column(Date)
    due_date = Column(Date)
    overdue_days = Column(Integer, default=0, index=True)
    outstanding_amount = Column(DECIMAL(10, 2), default=0.00)
    dunning_status = Column(Enum(DunningStatus), default=DunningStatus.ACTIVE, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    payments = relationship("Payment", back_populates="customer", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="customer", cascade="all, delete-orphan")
    curing_actions = relationship("CuringAction", back_populates="customer", cascade="all, delete-orphan")
    dunning_logs = relationship("DunningLog", back_populates="customer", cascade="all, delete-orphan")
