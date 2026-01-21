"""
DunningLog SQLAlchemy Model
"""
from sqlalchemy import Column, Integer, String, JSON, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class DunningLog(Base):
    __tablename__ = "dunning_logs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(Integer, ForeignKey("dunning_rules.id", ondelete="SET NULL"), nullable=True)
    action_type = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    details = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now(), index=True)
    
    # Relationships
    customer = relationship("Customer", back_populates="dunning_logs")
    rule = relationship(
    "DunningRule",
    back_populates="dunning_logs"
)
