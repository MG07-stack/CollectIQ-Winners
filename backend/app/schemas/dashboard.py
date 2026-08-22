from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    totalOutstanding: float
    totalOverdue: float
    highPriorityCount: int
    collectionRate: int
    openInvoiceCount: int
    recentVisitsCount: int
