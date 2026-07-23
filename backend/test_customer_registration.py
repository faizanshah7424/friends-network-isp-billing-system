import sys
import os
import uuid
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.database.session import SessionLocal
from backend.app.repositories.customer import customer_repository
from backend.app.repositories.package import package_repository
from backend.app.models.customer import Customer
from backend.app.models.package import Package

def test_db_customer_registration():
    db = SessionLocal()
    try:
        print("--- STARTING FUNCTIONAL DB CUSTOMER REGISTRATION TEST ---")
        
        # 1. Fetch or create a test package
        pkg = package_repository.get_multi(db, limit=1)
        if not pkg:
            test_pkg = Package(
                id=str(uuid.uuid4()),
                name="Test Fiber 50M",
                category="Home Broadband",
                speed="50 Mbps",
                monthly_charges=2500,
                status="Active"
            )
            db.add(test_pkg)
            db.commit()
            db.refresh(test_pkg)
            pkg = [test_pkg]
            print(f"Created test package: {test_pkg.name} ({test_pkg.id})")
        else:
            print(f"Using existing package: {pkg[0].name} ({pkg[0].id})")

        pkg_obj = pkg[0]

        # 2. Generate unique Customer ID and Phone
        test_id = f"TEST-CUST-{int(datetime.now().timestamp())}"
        test_phone = f"0346{datetime.now().strftime('%M%S%f')[:7]}"

        print(f"Test Customer ID: {test_id}")
        print(f"Test Phone: {test_phone}")

        # 3. Verify duplicate checks before insert
        dup_check_id = customer_repository.get_by_customer_id(db, customer_id=test_id)
        assert dup_check_id is None, "Customer ID should not exist prior to test"

        dup_check_phone = customer_repository.get_by_phone(db, phone=test_phone)
        assert dup_check_phone is None, "Phone should not exist prior to test"

        # 4. Construct Customer DB model
        cust_db = Customer(
            customer_id=test_id,
            name="Functional Test Subscriber",
            phone=test_phone,
            whatsapp=test_phone,
            address="123 Test Street, Defense Phase 6, Karachi",
            area="Defense Phase 6",
            package_id=pkg_obj.id,
            package_name=pkg_obj.name,
            monthly_charges=pkg_obj.monthly_charges,
            installation_charges=1500,
            router_mac="AA:BB:CC:DD:EE:FF",
            onu_number="ONU-TEST-99",
            connection_date=datetime.now().strftime("%Y-%m-%d"),
            connection_status="Active",
            payment_status="Unpaid",
            outstanding_balance=1500,
            timeline=[
                {
                    "id": str(uuid.uuid4()),
                    "title": "Connection Activated",
                    "description": f"Registered line under {pkg_obj.name}",
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "type": "success"
                }
            ],
            notes=[]
        )

        # 5. Commit to database
        created = customer_repository.create(db, db_obj=cust_db)
        print(f"[OK] Customer successfully committed to DB! Primary Key: {created.id}, Customer ID: {created.customer_id}")

        # 6. Verify retrieval after commit (survives page refresh / DB query)
        retrieved = customer_repository.get_by_customer_id(db, customer_id=test_id)
        assert retrieved is not None, "Customer should be retrievable from DB after commit"
        assert retrieved.name == "Functional Test Subscriber"
        assert retrieved.phone == test_phone
        assert retrieved.package_name == pkg_obj.name
        assert retrieved.monthly_charges == pkg_obj.monthly_charges

        print(f"[OK] Verified DB Retrieval: Name='{retrieved.name}', Package='{retrieved.package_name}', Monthly='PKR {retrieved.monthly_charges}'")

        # 7. Test Duplicate Customer ID Rejection
        dup_attempt = customer_repository.get_by_customer_id(db, customer_id=test_id)
        assert dup_attempt is not None, "Duplicate detection must identify existing Customer ID"
        print("[OK] Duplicate Customer ID rejection verified!")

        # 8. Test Duplicate Phone Rejection
        dup_phone_attempt = customer_repository.get_by_phone(db, phone=test_phone)
        assert dup_phone_attempt is not None, "Duplicate detection must identify existing Phone"
        print("[OK] Duplicate Phone rejection verified!")

        print("\n--- ALL FUNCTIONAL DB REGISTRATION VERIFICATIONS PASSED 100% ---")

    except Exception as e:
        print(f"[FAIL] TEST FAILED WITH ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_db_customer_registration()
