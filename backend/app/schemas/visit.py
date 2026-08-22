from typing import Optional
from pydantic import BaseModel


class VisitBase(BaseModel):
    customerId: Optional[str] = None
    customer: Optional[str] = None
    outcome: Optional[str] = "Contacted Customer"
    amount: Optional[float] = 0.0
    notes: Optional[str] = ""
    agent: Optional[str] = None
    invoiceId: Optional[str] = None
    type: Optional[str] = "FIELD_VISIT"


class VisitCreate(VisitBase):
    pass


class RecordVisitRequest(BaseModel):
    outcome: Optional[str] = "NFC Tap Check-in"
    amount: Optional[float] = 0.0
    notes: Optional[str] = ""
    agent: Optional[str] = None
    invoiceId: Optional[str] = None
    type: Optional[str] = "NFC_TAP"


class VisitResponse(BaseModel):
    id: str
    customerId: str
    customer: str
    outcome: str
    amount: float
    notes: Optional[str] = ""
    agent: Optional[str] = None
    visit_time: Optional[str] = None
    date: Optional[str] = None
    type: str

    class Config:
        from_attributes = True


class CustomerVisitResult(BaseModel):
    success: bool = True
    message: str = "Visit recorded successfully"
    customer_id: str
    customer: str
    visit_time: Optional[str] = None
    visit: VisitResponse
