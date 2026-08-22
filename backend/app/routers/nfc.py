from typing import Optional
from fastapi import APIRouter, Depends, Query, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.auth.security import decode_access_token

router = APIRouter(prefix="", tags=["NFC"])


@router.get("/api/nfc/lookup")
@router.get("/nfc/lookup")
def nfc_lookup(
    tagId: Optional[str] = Query(None),
    id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    tag_identifier = tagId or id or "CUST001"
    clean_id = tag_identifier.strip()

    # Try to find current user if token provided
    current_user_id = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload and payload.get("sub"):
            try:
                current_user_id = int(payload["sub"])
            except ValueError:
                pass

    customer = None
    if current_user_id:
        customer = db.query(Customer).filter(
            (Customer.id == clean_id) | (Customer.name.ilike(clean_id)),
            Customer.user_id == current_user_id
        ).first()

    if not customer:
        customer = db.query(Customer).filter(
            (Customer.id == clean_id) | (Customer.name.ilike(clean_id))
        ).first()

    cust_id = customer.id if customer else "CUST001"
    cust_name = customer.name if customer else "Sharma Traders"

    invoice = None
    if current_user_id:
        inv = db.query(Invoice).filter(
            Invoice.customer_id == cust_id,
            Invoice.user_id == current_user_id,
            Invoice.status != "Paid"
        ).first()
        if inv:
            invoice = {
                "id": inv.id,
                "customerId": inv.customer_id,
                "customer": inv.customer_name,
                "amount": float(inv.amount),
                "status": inv.status,
                "priority": inv.priority,
                "daysOverdue": inv.days_overdue,
            }

    return {
        "tagId": tag_identifier,
        "customerId": cust_id,
        "customer": cust_name,
        "invoice": invoice,
    }
