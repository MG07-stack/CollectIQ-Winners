from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.visit import Visit
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.schemas.visit import VisitResponse, VisitCreate
from app.auth.deps import get_current_user

router = APIRouter(prefix="", tags=["Visits"])


def build_visit_response(v: Visit) -> VisitResponse:
    return VisitResponse(
        id=v.id,
        customerId=v.customer_id,
        customer=v.customer_name,
        outcome=v.outcome,
        amount=float(v.amount),
        notes=v.notes or "",
        agent=v.agent or "",
        visit_time=v.visit_time,
        date=v.date,
        type=v.type,
    )


@router.get("/api/visits", response_model=List[VisitResponse])
@router.get("/visits", response_model=List[VisitResponse])
def get_visits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    visits = db.query(Visit).filter(
        Visit.user_id == current_user.id
    ).order_by(Visit.created_at.desc()).all()

    return [build_visit_response(v) for v in visits]


@router.post("/api/visits", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
@router.post("/visits", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
def create_visit(
    body: VisitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    now_iso = now.isoformat()
    today_str = now.date().isoformat()
    visit_amount = float(body.amount or 0.0)

    # Match customer
    matched_cust = None
    if body.customerId:
        matched_cust = db.query(Customer).filter(
            Customer.id == body.customerId,
            Customer.user_id == current_user.id
        ).first()
    elif body.customer:
        matched_cust = db.query(Customer).filter(
            Customer.name.ilike(body.customer),
            Customer.user_id == current_user.id
        ).first()

    customer_id = matched_cust.id if matched_cust else (body.customerId or "CUST001")
    customer_name = matched_cust.name if matched_cust else (body.customer or "Customer")

    visit_id = f"v-{int(now.timestamp() * 1000)}"

    visit = Visit(
        id=visit_id,
        user_id=current_user.id,
        customer_id=customer_id,
        customer_internal_id=matched_cust.internal_id if matched_cust else None,
        customer_name=customer_name,
        invoice_id=body.invoiceId,
        outcome=body.outcome or "Contacted Customer",
        amount=visit_amount,
        notes=body.notes or "",
        agent=body.agent or current_user.full_name,
        visit_time=now_iso,
        date=today_str,
        type=body.type or "FIELD_VISIT",
    )
    db.add(visit)

    # Update related invoice if present
    if body.invoiceId:
        target_inv = db.query(Invoice).filter(
            Invoice.id == body.invoiceId,
            Invoice.user_id == current_user.id
        ).first()

        if target_inv:
            visit.invoice_internal_id = target_inv.internal_id
            if body.outcome == "Collected Cash" or visit_amount > 0:
                if visit_amount >= target_inv.amount:
                    target_inv.status = "Paid"
                    target_inv.priority = "Low"
                    target_inv.days_overdue = 0
                else:
                    target_inv.status = "Partially Paid"
                    target_inv.amount = max(0.0, target_inv.amount - visit_amount)
            elif body.outcome == "Promised Payment" and target_inv.status == "Overdue":
                target_inv.status = "Partially Paid"

    db.commit()
    db.refresh(visit)

    return build_visit_response(visit)
