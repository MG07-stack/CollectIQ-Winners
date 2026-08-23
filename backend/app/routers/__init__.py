from app.routers.auth import router as auth_router
from app.routers.customers import router as customers_router
from app.routers.invoices import router as invoices_router
from app.routers.visits import router as visits_router
from app.routers.dashboard import router as dashboard_router
from app.routers.nfc import router as nfc_router
from app.routers.reminders import router as reminders_router

__all__ = [
    "auth_router",
    "customers_router",
    "invoices_router",
    "visits_router",
    "dashboard_router",
    "nfc_router",
    "reminders_router",
]
