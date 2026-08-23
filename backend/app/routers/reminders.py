from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/reminders", tags=["reminders"])

# In-memory reminders store for Python backend
MOCK_REMINDERS = [
    {
        "id": "REM-1001",
        "invoiceId": "INV-2026-102",
        "sellerId": "COMP001",
        "sellerName": "Apex FMCG Wholesalers",
        "buyerId": "COMP009",
        "buyerName": "Gupta Kirana & General Store",
        "amount": 68000.0,
        "channel": "WhatsApp",
        "recipientPhone": "+91 98111 22334",
        "recipientEmail": "guptakirana@collectiq.com",
        "template": "Urgent Overdue Notice",
        "message": "Reminder: Invoice INV-2026-102 of ₹68,000 is 22 days overdue. Please clear payment via CollectIQ UPI link.",
        "sentAt": "2026-08-22T10:30:00.000Z",
        "status": "Delivered",
        "direction": "OUTGOING",
    },
    {
        "id": "REM-1002",
        "invoiceId": "INV-2026-105",
        "sellerId": "COMP006",
        "sellerName": "National Agro Commodities",
        "buyerId": "COMP001",
        "buyerName": "Apex FMCG Wholesalers",
        "amount": 520000.0,
        "channel": "Email",
        "recipientPhone": "+91 98111 22334",
        "recipientEmail": "apex@collectiq.com",
        "template": "Upcoming Payment Reminder",
        "message": "Payment due in 12 days for Invoice INV-2026-105 (₹5,20,000) from National Agro Commodities.",
        "sentAt": "2026-08-21T14:15:00.000Z",
        "status": "Read",
        "direction": "INCOMING",
    },
]

class CreateReminderSchema(BaseModel):
    invoiceId: Optional[str] = "INV-GENERAL"
    sellerId: Optional[str] = "COMP001"
    sellerName: Optional[str] = "Apex FMCG Wholesalers"
    buyerId: Optional[str] = "COMP009"
    buyerName: Optional[str] = "Gupta Kirana & General Store"
    amount: Optional[float] = 0.0
    channel: Optional[str] = "WhatsApp"
    recipientPhone: Optional[str] = "+91 98765 43210"
    recipientEmail: Optional[str] = "contact@counterparty.com"
    template: Optional[str] = "Standard Payment Request"
    message: Optional[str] = "Payment reminder from CollectIQ"


@router.get("", response_model=List[dict])
@router.get("/", response_model=List[dict])
def get_all_reminders():
    return MOCK_REMINDERS


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_reminder(payload: CreateReminderSchema):
    new_rem = {
        "id": f"REM-{int(datetime.utcnow().timestamp())}",
        "invoiceId": payload.invoiceId,
        "sellerId": payload.sellerId,
        "sellerName": payload.sellerName,
        "buyerId": payload.buyerId,
        "buyerName": payload.buyerName,
        "amount": payload.amount,
        "channel": payload.channel,
        "recipientPhone": payload.recipientPhone,
        "recipientEmail": payload.recipientEmail,
        "template": payload.template,
        "message": payload.message,
        "sentAt": datetime.utcnow().isoformat() + "Z",
        "status": "Sent",
        "direction": "OUTGOING",
    }
    MOCK_REMINDERS.insert(0, new_rem)
    return new_rem
