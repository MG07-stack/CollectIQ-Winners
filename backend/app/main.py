from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.services.seed_service import seed_demo_accounts_if_empty
from app.routers import (
    auth_router,
    customers_router,
    invoices_router,
    visits_router,
    dashboard_router,
    nfc_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if they do not exist
    Base.metadata.create_all(bind=engine)

    # Seed demo accounts if database is fresh
    db = SessionLocal()
    try:
        seed_demo_accounts_if_empty(db)
    finally:
        db.close()

    yield
    # Shutdown logic (if any)


app = FastAPI(
    title="CollectIQ API",
    description="Enterprise Collections & Field Audit API with Multi-Tenant JWT Authentication and NFC Integration",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "message": str(exc)},
    )


# Health check endpoints
@app.get("/")
@app.get("/api")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CollectIQ API",
        "database": "connected",
        "auth": "JWT enabled",
    }


# Register all API routers
app.include_router(auth_router)
app.include_router(customers_router)
app.include_router(invoices_router)
app.include_router(visits_router)
app.include_router(dashboard_router)
app.include_router(nfc_router)
