from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.invoice import Invoice
from app.models.visit import Visit
from app.schemas.dashboard import DashboardSummaryResponse
from app.auth.deps import get_current_user

router = APIRouter(prefix="", tags=["Dashboard"])


@router.get("/api/dashboard/summary", response_model=DashboardSummaryResponse)
@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invoices = db.query(Invoice).filter(Invoice.user_id == current_user.id).all()
    visits_count = db.query(Visit).filter(Visit.user_id == current_user.id).count()

    unpaid = [i for i in invoices if i.status != "Paid"]
    total_outstanding = sum(float(i.amount) for i in unpaid)
    overdue = [i for i in unpaid if i.days_overdue > 0]
    total_overdue = sum(float(i.amount) for i in overdue)
    high_count = len([i for i in unpaid if i.priority == "High"])
    paid_count = len([i for i in invoices if i.status == "Paid"])
    collection_rate = round((paid_count / len(invoices)) * 100) if invoices else 0

    return DashboardSummaryResponse(
        totalOutstanding=total_outstanding,
        totalOverdue=total_overdue,
        highPriorityCount=high_count,
        collectionRate=collection_rate,
        openInvoiceCount=len(unpaid),
        recentVisitsCount=visits_count,
    )
