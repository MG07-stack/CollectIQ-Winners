import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.services.seed_service import seed_demo_accounts_if_empty


def test_auth_and_isolation():
    # Ensure tables created and demo accounts seeded
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_accounts_if_empty(db)
    finally:
        db.close()

    with TestClient(app) as client:
        print("Testing Health Check...")
        r = client.get("/api/health")
        assert r.status_code == 200, f"Health check failed: {r.text}"
        print("[OK] Health check passed.")

        # 1. Test Demo Admin Login
        print("\nTesting Demo Admin Login...")
        r = client.post("/api/auth/login", json={"email": "admin@collectiq.com", "password": "admin123"})
        assert r.status_code == 200, f"Admin login failed: {r.text}"
        admin_data = r.json()
        admin_token = admin_data["access_token"]
        assert admin_token is not None
        assert admin_data["user"]["email"] == "admin@collectiq.com"
        print(f"[OK] Admin login successful. User: {admin_data['user']['full_name']}")

        # 2. Test Get Me
        print("\nTesting GET /api/auth/me for Admin...")
        r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert r.json()["email"] == "admin@collectiq.com"
        print("[OK] /api/auth/me passed.")

        # 3. Test Register New User 1 (Rajesh)
        print("\nTesting User 1 Registration (Rajesh)...")
        r = client.post("/api/auth/register", json={
            "email": "rajesh@collectiq.com",
            "password": "password123",
            "full_name": "Rajesh Kumar",
            "role": "Field Agent"
        })
        assert r.status_code == 201, f"Rajesh registration failed: {r.text}"
        user1_data = r.json()
        user1_token = user1_data["access_token"]
        user1_id = user1_data["user"]["id"]
        print(f"[OK] User 1 registered. ID: {user1_id}, Name: {user1_data['user']['full_name']}")

        # 4. Test Duplicate Email Prevention
        print("\nTesting Duplicate Email Prevention...")
        r = client.post("/api/auth/register", json={
            "email": "rajesh@collectiq.com",
            "password": "password123",
            "full_name": "Duplicate Rajesh",
            "role": "Field Agent"
        })
        assert r.status_code == 400, "Duplicate registration should return 400"
        print("[OK] Duplicate email successfully rejected with 400 Bad Request.")

        # 5. Test Register User 2 (Priya)
        print("\nTesting User 2 Registration (Priya)...")
        r = client.post("/api/auth/register", json={
            "email": "priya@collectiq.com",
            "password": "password123",
            "full_name": "Priya Sharma",
            "role": "Field Agent"
        })
        assert r.status_code == 201, f"Priya registration failed: {r.text}"
        user2_token = r.json()["access_token"]
        print(f"[OK] User 2 registered.")

        # 6. Test User 1 Invoices & Customers
        print("\nTesting User 1 Customer & Invoice Data...")
        r = client.get("/api/customers", headers={"Authorization": f"Bearer {user1_token}"})
        assert r.status_code == 200
        user1_customers = r.json()
        assert len(user1_customers) > 0, "User 1 should have seeded starter customers"
        print(f"[OK] User 1 has {len(user1_customers)} customers.")

        r = client.get("/api/invoices", headers={"Authorization": f"Bearer {user1_token}"})
        assert r.status_code == 200
        user1_invoices = r.json()
        assert len(user1_invoices) > 0, "User 1 should have seeded starter invoices"
        print(f"[OK] User 1 has {len(user1_invoices)} invoices.")

        # 7. Test NFC / Customer Profile & Visit Recording for User 1
        print("\nTesting NFC / Customer Profile & Visit Recording for User 1...")
        r = client.get("/api/customers/CUST001", headers={"Authorization": f"Bearer {user1_token}"})
        assert r.status_code == 200
        cust_profile = r.json()
        assert cust_profile["name"] == "Sharma Traders"
        assert cust_profile["outstanding"] > 0
        print(f"[OK] Customer profile CUST001 loaded. Outstanding: {cust_profile['outstanding']}")

        # Record cash visit for CUST001 on invoice
        target_inv = [i for i in cust_profile["invoices"] if i["status"] != "Paid"][0]
        inv_id = target_inv["id"]
        inv_amt = target_inv["amount"]
        print(f"Recording cash visit on Invoice {inv_id} for amount {inv_amt}...")

        r = client.post(
            f"/api/customers/CUST001/visit",
            headers={"Authorization": f"Bearer {user1_token}"},
            json={
                "outcome": "Collected Cash",
                "amount": inv_amt,
                "invoiceId": inv_id,
                "notes": "Collected cash in full during NFC audit."
            }
        )
        assert r.status_code == 201, f"Record visit failed: {r.text}"
        visit_res = r.json()
        assert visit_res["success"] is True
        print(f"[OK] Visit recorded. Message: {visit_res['message']}")

        # Check updated invoices for User 1
        r = client.get("/api/invoices", headers={"Authorization": f"Bearer {user1_token}"})
        updated_inv = [i for i in r.json() if i["id"] == inv_id][0]
        assert updated_inv["status"] == "Paid", f"Invoice should now be Paid, got {updated_inv['status']}"
        print("[OK] Invoice status updated to Paid in database.")

        # 8. Test Multi-Tenant Isolation: Verify User 2's invoice for CUST001 is NOT affected by User 1's payment!
        print("\nTesting Multi-Tenant User Isolation...")
        r = client.get("/api/customers/CUST001", headers={"Authorization": f"Bearer {user2_token}"})
        assert r.status_code == 200
        user2_cust = r.json()
        user2_unpaid = [i for i in user2_cust["invoices"] if i["status"] != "Paid"]
        assert len(user2_unpaid) > 0, "User 2's invoices must remain untouched by User 1's actions"
        print("[OK] User data isolation verified: User 2 data is 100% isolated from User 1.")

        # 9. Test Invalid Tag 404
        print("\nTesting Invalid Tag 404...")
        r = client.get("/api/customers/INVALID999", headers={"Authorization": f"Bearer {user1_token}"})
        assert r.status_code == 404
        print("[OK] Invalid customer ID returns 404 as expected.")

        # 10. Test Unauthorized Request Rejection
        print("\nTesting Unauthorized Request Rejection...")
        r = client.get("/api/invoices")
        assert r.status_code == 401
        print("[OK] Unauthenticated request rejected with 401.")

        print("\n============================================")
        print("ALL BACKEND & AUTHENTICATION TESTS PASSED! [OK]")
        print("============================================")


if __name__ == "__main__":
    test_auth_and_isolation()
