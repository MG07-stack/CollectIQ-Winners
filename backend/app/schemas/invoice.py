from typing import Optional
from pydantic import BaseModel


class InvoiceBase(BaseModel):
    id: str
    customerId: str
    customer: str
    assignedTo: Optional[str] = None
    amount: float
    status: str = "Outstanding"
    priority: str = "Medium"
    daysOverdue: int = 0
    issued: Optional[str] = None
    due: Optional[str] = None


class InvoiceCreate(BaseModel):
    id: Optional[str] = None
    customerId: str
    customer: Optional[str] = None
    assignedTo: Optional[str] = None
    amount: float
    status: Optional[str] = "Outstanding"
    priority: Optional[str] = "Medium"
    daysOverdue: Optional[int] = 0
    issued: Optional[str] = None
    due: Optional[str] = None


class InvoiceResponse(BaseModel):
    id: str
    customerId: str
    customer: str
    assignedTo: Optional[str] = None
    amount: float
    status: str
    priority: str
    daysOverdue: int
    issued: Optional[str] = None
    due: Optional[str] = None

    class Config:
        from_attributes = True
