from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.visit import Visit
from app.auth.security import get_password_hash


DEFAULT_CUSTOMERS = [
    {
        "id": "CUST001",
        "name": "Sharma Traders",
        "phone": "+91 98765 43210",
        "address": "Plot 42, Industrial Area Phase II, Gurugram, Haryana",
    },
    {
        "id": "CUST002",
        "name": "Tata Consultancy Services",
        "phone": "+91 98200 11223",
        "address": "TCS House, Raveline Street, Fort, Mumbai",
    },
    {
        "id": "CUST003",
        "name": "Reliance Digital",
        "phone": "+91 98211 44556",
        "address": "Maker Chambers IV, 3rd Floor, Nariman Point, Mumbai",
    },
    {
        "id": "CUST004",
        "name": "Infosys Technologies",
        "phone": "+91 98450 77889",
        "address": "Electronics City, Hosur Road, Bengaluru",
    },
    {
        "id": "CUST005",
        "name": "HDFC Enterprises",
        "phone": "+91 98222 33445",
        "address": "HDFC House, Senapati Bapat Marg, Lower Parel, Mumbai",
    },
    {
        "id": "CUST006",
        "name": "Mahindra Logistics",
        "phone": "+91 98333 55667",
        "address": "Mahindra Towers, P.K. Kurne Chowk, Worli, Mumbai",
    },
    {
        "id": "CUST007",
        "name": "Wipro Solutions",
        "phone": "+91 98444 66778",
        "address": "Doddakannelli, Sarjapur Road, Bengaluru",
    },
    {
        "id": "CUST008",
        "name": "Adani Power",
        "phone": "+91 98555 88990",
        "address": "Shantigram, S.G. Highway, Ahmedabad",
    },
    {
        "id": "CUST009",
        "name": "Titan Company",
        "phone": "+91 98666 99001",
        "address": "Integrity, 132/133, Hosur Main Road, Bengaluru",
    },
    {
        "id": "CUST010",
        "name": "Zomato Media",
        "phone": "+91 98777 00112",
        "address": "Ground Floor, Pioneer Square, Sector 62, Gurugram",
    },
]


def seed_user_initial_data(db: Session, user: User):
    """Seed customer portfolios, invoices, and visit logs for a user."""
    today = datetime.utcnow().date()
    today_str = today.isoformat()

    # Create customers
    created_cust_map = {}
    for c_data in DEFAULT_CUSTOMERS:
        existing = db.query(Customer).filter(
            Customer.id == c_data["id"],
            Customer.user_id == user.id
        ).first()

        if not existing:
            cust = Customer(
                id=c_data["id"],
                user_id=user.id,
                name=c_data["name"],
                phone=c_data["phone"],
                address=c_data["address"],
                agent_name=user.full_name,
            )
            db.add(cust)
            db.flush()
            created_cust_map[c_data["id"]] = cust
        else:
            created_cust_map[c_data["id"]] = existing

    # Create default starter invoices
    starter_invoices = [
        {
            "id": f"INV-IN-{user.id}01",
            "customer_id": "CUST001",
            "customer_name": "Sharma Traders",
            "amount": 33000,
            "status": "Outstanding",
            "priority": "Medium",
            "days_overdue": 0,
            "issued_date": (today - timedelta(days=5)).isoformat(),
            "due_date": (today + timedelta(days=25)).isoformat(),
        },
        {
            "id": f"INV-IN-{user.id}02",
            "customer_id": "CUST001",
            "customer_name": "Sharma Traders",
            "amount": 12000,
            "status": "Overdue",
            "priority": "High",
            "days_overdue": 18,
            "issued_date": (today - timedelta(days=48)).isoformat(),
            "due_date": (today - timedelta(days=18)).isoformat(),
        },
        {
            "id": f"INV-IN-{user.id}03",
            "customer_id": "CUST002",
            "customer_name": "Tata Consultancy Services",
            "amount": 380000,
            "status": "Outstanding",
            "priority": "High",
            "days_overdue": 12,
            "issued_date": (today - timedelta(days=42)).isoformat(),
            "due_date": (today - timedelta(days=12)).isoformat(),
        },
        {
            "id": f"INV-IN-{user.id}04",
            "customer_id": "CUST003",
            "customer_name": "Reliance Digital",
            "amount": 240000,
            "status": "Overdue",
            "priority": "Medium",
            "days_overdue": 28,
            "issued_date": (today - timedelta(days=58)).isoformat(),
            "due_date": (today - timedelta(days=28)).isoformat(),
        },
        {
            "id": f"INV-IN-{user.id}05",
            "customer_id": "CUST004",
            "customer_name": "Infosys Technologies",
            "amount": 175000,
            "status": "Outstanding",
            "priority": "Low",
            "days_overdue": 0,
            "issued_date": (today - timedelta(days=10)).isoformat(),
            "due_date": (today + timedelta(days=20)).isoformat(),
        },
        {
            "id": f"INV-IN-{user.id}06",
            "customer_id": "CUST005",
            "customer_name": "HDFC Enterprises",
            "amount": 490000,
            "status": "Overdue",
            "priority": "High",
            "days_overdue": 42,
            "issued_date": (today - timedelta(days=72)).isoformat(),
            "due_date": (today - timedelta(days=42)).isoformat(),
        },
        {
            "id": f"INV-IN-{user.id}07",
            "customer_id": "CUST006",
            "customer_name": "Mahindra Logistics",
            "amount": 150000,
            "status": "Paid",
            "priority": "Low",
            "days_overdue": 0,
            "issued_date": (today - timedelta(days=60)).isoformat(),
            "due_date": (today - timedelta(days=30)).isoformat(),
        },
    ]

    for inv_data in starter_invoices:
        existing = db.query(Invoice).filter(
            Invoice.id == inv_data["id"],
            Invoice.user_id == user.id
        ).first()

        if not existing:
            cust = created_cust_map.get(inv_data["customer_id"])
            inv = Invoice(
                id=inv_data["id"],
                user_id=user.id,
                customer_id=inv_data["customer_id"],
                customer_internal_id=cust.internal_id if cust else None,
                customer_name=inv_data["customer_name"],
                assigned_to=user.full_name,
                amount=inv_data["amount"],
                status=inv_data["status"],
                priority=inv_data["priority"],
                days_overdue=inv_data["days_overdue"],
                issued_date=inv_data["issued_date"],
                due_date=inv_data["due_date"],
            )
            db.add(inv)

    # Create initial starter visits
    starter_visits = [
        {
            "id": f"v-{user.id}01",
            "customer_id": "CUST001",
            "customer_name": "Sharma Traders",
            "outcome": "Contacted Customer",
            "amount": 0,
            "notes": "Spoke with Mr. Sharma regarding overdue invoice.",
            "date": today_str,
            "visit_time": f"{today_str}T10:30:00",
            "type": "FIELD_VISIT",
        },
        {
            "id": f"v-{user.id}02",
            "customer_id": "CUST002",
            "customer_name": "Tata Consultancy Services",
            "outcome": "Promised Payment",
            "amount": 380000,
            "notes": "Spoke with Finance Lead. Payment scheduled by RTGS on Friday.",
            "date": (today - timedelta(days=2)).isoformat(),
            "visit_time": f"{(today - timedelta(days=2)).isoformat()}T14:15:00",
            "type": "FIELD_VISIT",
        }
    ]

    for v_data in starter_visits:
        existing = db.query(Visit).filter(
            Visit.id == v_data["id"],
            Visit.user_id == user.id
        ).first()

        if not existing:
            cust = created_cust_map.get(v_data["customer_id"])
            v = Visit(
                id=v_data["id"],
                user_id=user.id,
                customer_id=v_data["customer_id"],
                customer_internal_id=cust.internal_id if cust else None,
                customer_name=v_data["customer_name"],
                outcome=v_data["outcome"],
                amount=v_data["amount"],
                notes=v_data["notes"],
                agent=user.full_name,
                date=v_data["date"],
                visit_time=v_data["visit_time"],
                type=v_data["type"],
            )
            db.add(v)

    db.commit()


def seed_demo_accounts_if_empty(db: Session):
    """Seed demo accounts admin, agent1, agent2 if they do not exist."""
    demo_users = [
        {
            "email": "admin@collectiq.com",
            "full_name": "Sarah Connor (Admin)",
            "password": "admin123",
            "role": "Admin",
        },
        {
            "email": "agent1@collectiq.com",
            "full_name": "Alex Rivera (Agent 1)",
            "password": "agent123",
            "role": "Field Agent",
        },
        {
            "email": "agent2@collectiq.com",
            "full_name": "Marcus Vance (Agent 2)",
            "password": "agent123",
            "role": "Field Agent",
        },
    ]

    for u_info in demo_users:
        existing = db.query(User).filter(User.email == u_info["email"]).first()
        if not existing:
            user = User(
                email=u_info["email"],
                full_name=u_info["full_name"],
                password_hash=get_password_hash(u_info["password"]),
                role=u_info["role"],
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            seed_user_initial_data(db, user)
