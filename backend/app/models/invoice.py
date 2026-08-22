from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = (
        UniqueConstraint("id", "user_id", name="uq_invoice_id_user"),
    )

    internal_id = Column(Integer, primary_key=True, autoincrement=True)
    id = Column(String(100), nullable=False, index=True)  # Invoice ID (e.g. "INV-IN-0901")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(100), nullable=False, index=True)
    customer_internal_id = Column(Integer, ForeignKey("customers.internal_id", ondelete="CASCADE"), nullable=True)
    customer_name = Column(String(255), nullable=False)
    assigned_to = Column(String(255), nullable=True)
    amount = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="Outstanding")  # Outstanding, Partially Paid, Overdue, Paid
    priority = Column(String(50), nullable=False, default="Medium")  # High, Medium, Low
    days_overdue = Column(Integer, nullable=False, default=0)
    issued_date = Column(String(50), nullable=True)
    due_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")
    visits = relationship("Visit", back_populates="invoice")
