from typing import Optional, List, Any
from pydantic import BaseModel


class CustomerBase(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    agent: Optional[str] = None


class CustomerCreate(BaseModel):
    id: Optional[str] = None
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    agent: Optional[str] = None


class CustomerResponse(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    agent: Optional[str] = None
    invoices: List[Any] = []
    outstanding: float = 0.0
    overdue: float = 0.0
    high: int = 0
    lastVisit: Optional[str] = None
    lastVisitRecord: Optional[Any] = None

    class Config:
        from_attributes = True


class CustomerDetailResponse(CustomerResponse):
    pass
