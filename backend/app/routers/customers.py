from typing import List, Optional, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.visit import Visit
from app.schemas.customer import CustomerResponse, CustomerDetailResponse, CustomerCreate
from app.schemas.visit import RecordVisitRequest, CustomerVisitResult, VisitResponse
from app.schemas.invoice import InvoiceResponse
from app.auth.deps import get_current_user

router = APIRouter(prefix="", tags=["Customers"])


def build_customer_response(cust: Customer, db: Session, user_id: int) -> CustomerResponse:
    invoices = db.query(Invoice).filter(
        Invoice.customer_id == cust.id,
        Invoice.user_id == user_id
    ).all()

    inv_responses = []
    outstanding = 0.0
    overdue = 0.0
    high_count = 0

    for inv in invoices:
        inv_resp = {
            "id": inv.id,
            "customerId": inv.customer_id,
            "customer": inv.customer_name,
            "assignedTo": inv.assigned_to or "",
            "amount": float(inv.amount),
            "status": inv.status,
            "priority": inv.priority,
            "daysOverdue": inv.days_overdue,
            "issued": inv.issued_date,
            "due": inv.due_date,
        }
        inv_responses.append(inv_resp)

        if inv.status != "Paid":
            outstanding += float(inv.amount)
            if inv.days_overdue > 0:
                overdue += float(inv.amount)
            if inv.priority == "High":
                high_count += 1

    last_visit = db.query(Visit).filter(
        Visit.customer_id == cust.id,
        Visit.user_id == user_id
    ).order_by(Visit.created_at.desc()).first()

    last_visit_time = None
    last_visit_rec = None
    if last_visit:
        last_visit_time = last_visit.visit_time or last_visit.date
        last_visit_rec = {
            "id": last_visit.id,
            "customerId": last_visit.customer_id,
            "customer": last_visit.customer_name,
            "outcome": last_visit.outcome,
            "amount": float(last_visit.amount),
            "notes": last_visit.notes or "",
            "agent": last_visit.agent or "",
            "visit_time": last_visit.visit_time,
            "date": last_visit.date,
            "type": last_visit.type,
        }

    return CustomerResponse(
        id=cust.id,
        name=cust.name,
        phone=cust.phone or "+91 98765 43210",
        address=cust.address or "Registered Business Address",
        agent=cust.agent_name or "",
        invoices=inv_responses,
        outstanding=outstanding,
        overdue=overdue,
        high=high_count,
        lastVisit=last_visit_time,
        lastVisitRecord=last_visit_rec,
    )


@router.get("/api/customers", response_model=List[CustomerResponse])
@router.get("/customers", response_model=List[CustomerResponse])
def get_customers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    customers = db.query(Customer).filter(Customer.user_id == current_user.id).all()
    return [build_customer_response(c, db, current_user.id) for c in customers]


@router.post("/api/customers", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
@router.post("/customers", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    body: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cust_id = body.id or f"CUST{int(datetime.utcnow().timestamp())}"
    existing = db.query(Customer).filter(
        Customer.id == cust_id,
        Customer.user_id == current_user.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="A customer with this ID already exists.")

    cust = Customer(
        id=cust_id,
        user_id=current_user.id,
        name=body.name.strip(),
        phone=body.phone,
        address=body.address,
        agent_name=body.agent or current_user.full_name,
    )
    db.add(cust)
    db.commit()
    db.refresh(cust)

    return build_customer_response(cust, db, current_user.id)


@router.get("/api/customers/{customer_id}", response_model=CustomerDetailResponse)
@router.get("/customers/{customer_id}", response_model=CustomerDetailResponse)
def get_customer(
    customer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    clean_id = customer_id.strip()
    cust = db.query(Customer).filter(
        (Customer.id == clean_id) | (Customer.name.ilike(clean_id)),
        Customer.user_id == current_user.id
    ).first()

    if not cust:
        # Check if customer exists in invoices for this user
        inv = db.query(Invoice).filter(
            (Invoice.customer_id == clean_id) | (Invoice.customer_name.ilike(clean_id)),
            Invoice.user_id == current_user.id
        ).first()

        if not inv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer Not Found: The NFC card or customer ID is not linked to a valid CollectIQ customer.",
            )

        # Auto-create customer model record if invoice exists
        cust = Customer(
            id=inv.customer_id,
            user_id=current_user.id,
            name=inv.customer_name,
            phone="+91 98765 43210",
            address="Registered Business Address",
            agent_name=inv.assigned_to or current_user.full_name,
        )
        db.add(cust)
        db.commit()
        db.refresh(cust)

    return build_customer_response(cust, db, current_user.id)


@router.post("/api/customers/{customer_id}/visit", response_model=CustomerVisitResult, status_code=status.HTTP_201_CREATED)
@router.post("/customers/{customer_id}/visit", response_model=CustomerVisitResult, status_code=status.HTTP_201_CREATED)
def record_customer_visit(
    customer_id: str,
    body: RecordVisitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    clean_id = customer_id.strip()
    cust = db.query(Customer).filter(
        (Customer.id == clean_id) | (Customer.name.ilike(clean_id)),
        Customer.user_id == current_user.id
    ).first()

    if not cust:
        inv = db.query(Invoice).filter(
            (Invoice.customer_id == clean_id) | (Invoice.customer_name.ilike(clean_id)),
            Invoice.user_id == current_user.id
        ).first()

        if not inv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer Not Found: The NFC card is not linked to a valid CollectIQ customer.",
            )

        cust = Customer(
            id=inv.customer_id,
            user_id=current_user.id,
            name=inv.customer_name,
            phone="+91 98765 43210",
            address="Registered Business Address",
            agent_name=inv.assigned_to or current_user.full_name,
        )
        db.add(cust)
        db.commit()
        db.refresh(cust)

    now = datetime.utcnow()
    now_iso = now.isoformat()
    today_str = now.date().isoformat()
    visit_amount = float(body.amount or 0.0)

    visit_id = f"v-{int(now.timestamp() * 1000)}"

    visit = Visit(
        id=visit_id,
        user_id=current_user.id,
        customer_id=cust.id,
        customer_internal_id=cust.internal_id,
        customer_name=cust.name,
        invoice_id=body.invoiceId,
        outcome=body.outcome or "NFC Tap Check-in",
        amount=visit_amount,
        notes=body.notes or "Customer identified & verified via NFC card tap.",
        agent=body.agent or current_user.full_name,
        visit_time=now_iso,
        date=today_str,
        type=body.type or "NFC_TAP",
    )
    db.add(visit)

    # If invoiceId is provided or payment made, update related invoice
    target_inv = None
    if body.invoiceId:
        target_inv = db.query(Invoice).filter(
            Invoice.id == body.invoiceId,
            Invoice.user_id == current_user.id
        ).first()
    if not target_inv:
        target_inv = db.query(Invoice).filter(
            (Invoice.customer_id == cust.id) | (Invoice.customer_name.ilike(cust.name)),
            Invoice.user_id == current_user.id,
            Invoice.status != "Paid"
        ).first()

    if target_inv:
        visit.invoice_internal_id = target_inv.internal_id
        visit.invoice_id = target_inv.id
        if body.outcome == "Collected Cash" or visit_amount > 0:
            if visit_amount >= target_inv.amount:
                target_inv.status = "Paid"
                target_inv.priority = "Low"
                target_inv.days_overdue = 0
            else:
                target_inv.status = "Partially Paid"
                target_inv.amount = max(0.0, target_inv.amount - visit_amount)
        elif body.outcome == "Promised Payment" and (target_inv.status == "Overdue" or target_inv.status == "Outstanding"):
            target_inv.status = "Partially Paid"

    db.commit()
    db.refresh(visit)

    visit_resp = VisitResponse(
        id=visit.id,
        customerId=visit.customer_id,
        customer=visit.customer_name,
        outcome=visit.outcome,
        amount=float(visit.amount),
        notes=visit.notes or "",
        agent=visit.agent or "",
        visit_time=visit.visit_time,
        date=visit.date,
        type=visit.type,
    )

    return CustomerVisitResult(
        success=True,
        message="Visit recorded successfully",
        customer_id=cust.id,
        customer=cust.name,
        visit_time=visit.visit_time,
        visit=visit_resp,
    )
