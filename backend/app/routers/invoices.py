from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.invoice import Invoice
from app.models.customer import Customer
from app.schemas.invoice import InvoiceResponse, InvoiceCreate
from app.auth.deps import get_current_user

router = APIRouter(prefix="", tags=["Invoices"])


def build_invoice_response(inv: Invoice) -> InvoiceResponse:
    return InvoiceResponse(
        id=inv.id,
        customerId=inv.customer_id,
        customer=inv.customer_name,
        assignedTo=inv.assigned_to or "",
        amount=float(inv.amount),
        status=inv.status,
        priority=inv.priority,
        daysOverdue=inv.days_overdue,
        issued=inv.issued_date,
        due=inv.due_date,
    )


@router.get("/api/invoices", response_model=List[InvoiceResponse])
@router.get("/invoices", response_model=List[InvoiceResponse])
def get_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Invoice).filter(Invoice.user_id == current_user.id)
    invoices = query.order_by(Invoice.created_at.desc()).all()
    return [build_invoice_response(inv) for inv in invoices]


@router.post("/api/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    body: InvoiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(
        Customer.id == body.customerId,
        Customer.user_id == current_user.id
    ).first()

    customer_name = body.customer or (customer.name if customer else body.customerId)
    inv_id = body.id or f"INV-IN-{current_user.id}-{int(datetime.utcnow().timestamp())}"

    inv = Invoice(
        id=inv_id,
        user_id=current_user.id,
        customer_id=body.customerId,
        customer_internal_id=customer.internal_id if customer else None,
        customer_name=customer_name,
        assigned_to=body.assignedTo or current_user.full_name,
        amount=body.amount,
        status=body.status or "Outstanding",
        priority=body.priority or "Medium",
        days_overdue=body.daysOverdue or 0,
        issued_date=body.issued,
        due_date=body.due,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    return build_invoice_response(inv)
