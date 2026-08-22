from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Visit(Base):
    __tablename__ = "visits"

    internal_id = Column(Integer, primary_key=True, autoincrement=True)
    id = Column(String(100), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(100), nullable=False, index=True)
    customer_internal_id = Column(Integer, ForeignKey("customers.internal_id", ondelete="CASCADE"), nullable=True)
    customer_name = Column(String(255), nullable=False)
    invoice_id = Column(String(100), nullable=True)
    invoice_internal_id = Column(Integer, ForeignKey("invoices.internal_id", ondelete="SET NULL"), nullable=True)
    outcome = Column(String(100), nullable=False, default="Contacted Customer")
    amount = Column(Float, nullable=False, default=0.0)
    notes = Column(Text, nullable=True)
    agent = Column(String(255), nullable=True)
    visit_time = Column(String(100), nullable=True)
    date = Column(String(50), nullable=True)
    type = Column(String(50), nullable=False, default="FIELD_VISIT")  # NFC_TAP, FIELD_VISIT
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="visits")
    customer = relationship("Customer", back_populates="visits")
    invoice = relationship("Invoice", back_populates="visits")
