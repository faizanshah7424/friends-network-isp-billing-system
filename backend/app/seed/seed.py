import os
import pandas as pd
import uuid
from sqlalchemy.orm import Session
from datetime import datetime

from backend.app.database.session import SessionLocal, engine
from backend.app.database.base import Base
from backend.app.core.security import get_password_hash
from backend.app.models.role import Role
from backend.app.models.user import User
from backend.app.models.package import Package
from backend.app.models.customer import Customer
from backend.app.models.invoice import Invoice
from backend.app.models.payment import Payment
from backend.app.models.complaint import Complaint
from backend.app.models.notification import Notification
from backend.app.models.settings import SystemSettings

from backend.app.models.tenant import Tenant

def seed_db():
    db = SessionLocal()
    try:
        # Ensure database tables exist
        Base.metadata.create_all(bind=engine)
        
        # 0. Seed Default Tenant
        tenant_obj = db.query(Tenant).filter(Tenant.id == "friends_network").first()
        if not tenant_obj:
            tenant_obj = Tenant(
                id="friends_network",
                name="Friends Network",
                domain="friends.network",
                subscription_plan="Enterprise",
                status="Active",
                brand_name="Friends Network",
                email="support@friendsnetwork.net",
                phone="021-111-362-362",
                address="Karachi, Pakistan",
                currency="PKR",
                theme_color="indigo",
                is_activated=True
            )
            db.add(tenant_obj)
            db.commit()
            db.refresh(tenant_obj)

        # 1. Seed Roles
        super_admin_role = db.query(Role).filter(Role.name == "Super Admin").first()
        if not super_admin_role:
            super_admin_role = Role(
                id="cae6f7e9-fd17-44d4-b1eb-ac2eea6201ac",
                name="Super Admin",
                permissions=["all"]
            )
            db.add(super_admin_role)
            db.commit()
            db.refresh(super_admin_role)
            
        sub_admin_role = db.query(Role).filter(Role.name == "Sub Admin").first()
        if not sub_admin_role:
            sub_admin_role = Role(
                id="927950e6-a55c-4edb-804f-c1ba3888cfd1",
                name="Sub Admin",
                permissions=["recovery", "payments", "complaints", "customer_view"]
            )
            db.add(sub_admin_role)
            db.commit()
            db.refresh(sub_admin_role)

        # 2. Seed Admin Users
        from sqlalchemy import func
        shahid_user = db.query(User).execution_options(bypass_tenant=True).filter(func.lower(User.username) == "muhammad_shahid").first()
        if not shahid_user:
            shahid_user = User(
                id="5f9cd175-c6c2-41a5-b443-2104574f7c68",
                username="muhammad_shahid",
                full_name="Muhammad Shahid",
                password_hash=get_password_hash("shahid123"),
                role_id=super_admin_role.id,
                tenant_id="friends_network",
                is_active=True
            )
            db.add(shahid_user)
        else:
            shahid_user.password_hash = get_password_hash("shahid123")
            shahid_user.is_active = True
            shahid_user.role_id = super_admin_role.id
            shahid_user.tenant_id = "friends_network"
            db.add(shahid_user)
            
        noor_user = db.query(User).execution_options(bypass_tenant=True).filter(func.lower(User.username) == "noor_jamal").first()
        if not noor_user:
            noor_user = User(
                id="1acf51a0-afe4-4f01-a452-da57bc120522",
                username="noor_jamal",
                full_name="Noor Jamal",
                password_hash=get_password_hash("noor123"),
                role_id=sub_admin_role.id,
                tenant_id="friends_network",
                is_active=True
            )
            db.add(noor_user)
        else:
            noor_user.password_hash = get_password_hash("noor123")
            noor_user.is_active = True
            noor_user.role_id = sub_admin_role.id
            noor_user.tenant_id = "friends_network"
            db.add(noor_user)
            
        db.commit()
        print("Admin user accounts ('muhammad_shahid' and 'noor_jamal') seeded and committed successfully!")
            
        # 3. Seed Packages
        packages_list = [
            { "id": "pkg-sm-silver", "name": "Silver", "category": "Social Media", "speed": "25 Mbps", "monthly_charges": 1300, "status": "Active", "description": "Social Media plan" },
            { "id": "pkg-sm-gold", "name": "Gold", "category": "Social Media", "speed": "40 Mbps", "monthly_charges": 2000, "status": "Active", "description": "Social Media plan" },
            { "id": "pkg-sm-diamond", "name": "Diamond", "category": "Social Media", "speed": "50 Mbps", "monthly_charges": 3000, "status": "Active", "description": "Social Media plan" },
            { "id": "pkg-sm-platinum", "name": "Platinum", "category": "Social Media", "speed": "75 Mbps", "monthly_charges": 4500, "status": "Active", "description": "Social Media plan" },
            { "id": "pkg-sm-extreme", "name": "Extreme", "category": "Social Media", "speed": "100 Mbps", "monthly_charges": 6000, "status": "Active", "description": "Social Media plan" },

            { "id": "pkg-std-starter", "name": "Starter", "category": "Standard", "speed": "18 Mbps", "monthly_charges": 1300, "status": "Active", "description": "Standard plan" },
            { "id": "pkg-std-bronze", "name": "Bronze", "category": "Standard", "speed": "25 Mbps", "monthly_charges": 1500, "status": "Active", "description": "Standard plan" },
            { "id": "pkg-std-basic", "name": "Basic", "category": "Standard", "speed": "35 Mbps", "monthly_charges": 2000, "status": "Active", "description": "Standard plan" },
            { "id": "pkg-std-express", "name": "Express", "category": "Standard", "speed": "50 Mbps", "monthly_charges": 3000, "status": "Active", "description": "Standard plan" },
            { "id": "pkg-std-max", "name": "Max", "category": "Standard", "speed": "60 Mbps", "monthly_charges": 4000, "status": "Active", "description": "Standard plan" },
            { "id": "pkg-std-super", "name": "Super", "category": "Standard", "speed": "75 Mbps", "monthly_charges": 5000, "status": "Active", "description": "Standard plan" },
            { "id": "pkg-std-maxplus", "name": "Max Plus", "category": "Standard", "speed": "90 Mbps", "monthly_charges": 6500, "status": "Active", "description": "Standard plan" },

            { "id": "pkg-static-standard", "name": "Standard", "category": "Static IP", "speed": "16 Mbps", "monthly_charges": 5000, "status": "Active", "description": "Static IP plan" },
            { "id": "pkg-static-supreme", "name": "Supreme", "category": "Static IP", "speed": "32 Mbps", "monthly_charges": 8000, "status": "Active", "description": "Static IP plan" }
        ]
        
        for p_data in packages_list:
            exists = db.query(Package).filter(Package.id == p_data["id"]).first()
            if not exists:
                pkg_obj = Package(
                    id=p_data["id"],
                    name=p_data["name"],
                    category=p_data["category"],
                    speed=p_data["speed"],
                    monthly_charges=p_data["monthly_charges"],
                    status=p_data["status"],
                    description=p_data["description"]
                )
                db.add(pkg_obj)
                
        # 4. Seed Settings
        settings_exists = db.query(SystemSettings).first()
        if not settings_exists:
            settings_obj = SystemSettings(
                company_name="Friends Network",
                logo="/friends-logo.png",
                phone="021-111-362-362",
                email="support@friendsnetwork.net",
                address="Suite 201, 2nd Floor, Clifton Block 2, Karachi, Pakistan",
                currency="PKR",
                invoice_footer="This is a computer-generated invoice from Friends Network Broadband.",
                receipt_footer="Thank you for your payment. Keep this receipt for your records."
            )
            db.add(settings_obj)
            
        db.commit()

        # 5. Import Customers from Excel
        excel_path = r"E:\Coding\New folder\Downloads\User Data.xlsx"
        if os.path.exists(excel_path):
            cust_count = db.query(Customer).count()
            if cust_count == 0:
                print("Seeding customer accounts from Excel sheet...")
                df = pd.read_excel(excel_path)
                df.columns = [str(x).strip() for x in df.iloc[0]]
                df = df[1:]  # Skip header row

                def get_hash(s):
                    h = 0
                    for char in str(s):
                        h = (31 * h + ord(char)) & 0xFFFFFFFF
                    return h

                def make_phone(cust_id):
                    h = get_hash(cust_id)
                    num = str(h % 9000000 + 1000000)
                    return f"0300-{num[:3]}-{num[3:]}"

                def make_onu(cust_id):
                    h = get_hash(cust_id)
                    num = str(h % 90000 + 10000)
                    return f"ONUM-{num}"

                def map_area(address):
                    addr_lower = str(address).lower()
                    if 'jamali' in addr_lower:
                        return 'Jamali Goth'
                    elif 'garibabad' in addr_lower:
                        return 'Garibabad'
                    elif 'highway' in addr_lower:
                        return 'Super Highway'
                    elif 'aligarh' in addr_lower:
                        return 'Aligarh Society'
                    else:
                        return 'Jamali Goth'

                def map_package(pkg_name):
                    pkg_clean = str(pkg_name).strip().lower()
                    if 'supreme' in pkg_clean:
                        return 'pkg-static-supreme', 'Supreme', 8000
                    elif 'maxplus' in pkg_clean:
                        return 'pkg-std-maxplus', 'Max Plus', 6500
                    elif 'max' in pkg_clean:
                        return 'pkg-std-max', 'Max', 4000
                    elif 'standard' in pkg_clean:
                        return 'pkg-static-standard', 'Standard', 5000
                    elif 'express' in pkg_clean:
                        return 'pkg-std-express', 'Express', 3000
                    elif 'super' in pkg_clean:
                        return 'pkg-std-super', 'Super', 5000
                    elif 'bronze' in pkg_clean:
                        return 'pkg-std-bronze', 'Bronze', 1500
                    elif 'starter' in pkg_clean:
                        return 'pkg-std-starter', 'Starter', 1300
                    else:
                        return 'pkg-std-basic', 'Basic', 2000

                inv_count = 1000
                pay_count = 1000

                for index, row in df.iterrows():
                    cust_id = str(row['User ID']).strip()
                    cust_name = str(row['User Name']).strip()
                    reg_date_val = row['Reg Date']
                    if isinstance(reg_date_val, pd.Timestamp) or hasattr(reg_date_val, 'strftime'):
                        reg_date = reg_date_val.strftime('%Y-%m-%d')
                    else:
                        reg_date = '2025-01-01'
                        
                    pkg_raw = row['Package']
                    address = str(row['Address']).strip()
                    mac = str(row['Mac']).strip() if pd.notna(row['Mac']) else ""
                    status_raw = str(row['Status']).strip().lower()
                    
                    connection_status = 'Active' if 'active' in status_raw else 'Inactive'
                    is_unpaid = (get_hash(cust_id) % 10 == 0)
                    payment_status = 'Unpaid' if is_unpaid else 'Paid'
                    
                    pkg_id, pkg_name, monthly_charges = map_package(pkg_raw)
                    outstanding_balance = monthly_charges if is_unpaid else 0
                    
                    phone = make_phone(cust_id)
                    onu = make_onu(cust_id)
                    area = map_area(address)

                    # Create Customer
                    customer_db = Customer(
                        customer_id=cust_id,
                        name=cust_name,
                        phone=phone,
                        whatsapp=phone,
                        address=address,
                        area=area,
                        package_id=pkg_id,
                        package_name=pkg_name,
                        monthly_charges=monthly_charges,
                        installation_charges=0,
                        router_mac=mac,
                        onu_number=onu,
                        connection_date=reg_date,
                        connection_status=connection_status,
                        payment_status=payment_status,
                        outstanding_balance=outstanding_balance,
                        timeline=[
                            {
                                "id": str(uuid.uuid4()),
                                "title": "Connection Activated",
                                "description": f"ONT registered and line activated under {pkg_name} package.",
                                "date": reg_date,
                                "type": "success"
                            }
                        ],
                        notes=[]
                    )
                    db.add(customer_db)

                    # Create Invoice
                    inv_count += 1
                    invoice_db = Invoice(
                        invoice_number=f"INV-2026-{inv_count}",
                        customer_id=cust_id,
                        customer_name=cust_name,
                        billing_month="July 2026",
                        monthly_charges=monthly_charges,
                        previous_due=0,
                        additional_charges=0,
                        discount=0,
                        grand_total=monthly_charges,
                        amount_paid=0 if is_unpaid else monthly_charges,
                        outstanding_balance=monthly_charges if is_unpaid else 0,
                        payment_status=payment_status,
                        billing_date="2026-07-01",
                        due_date="2026-07-10"
                    )
                    db.add(invoice_db)

                    # Create Payment if paid
                    if not is_unpaid:
                        pay_count += 1
                        method = ['EasyPaisa', 'JazzCash', 'Bank', 'Cash'][get_hash(cust_id) % 4]
                        ref = f"EP-{get_hash(cust_id) % 90000000 + 10000000}" if method == 'EasyPaisa' else (
                            f"JC-{get_hash(cust_id) % 90000000 + 10000000}" if method == 'JazzCash' else (
                                f"FT-{get_hash(cust_id) % 90000 + 10000}" if method == 'Bank' else None
                            )
                        )
                        payment_db = Payment(
                            receipt_number=f"REC-2026-{pay_count}",
                            customer_id=cust_id,
                            customer_name=cust_name,
                            amount_received=monthly_charges,
                            payment_method=method,
                            reference_number=ref,
                            payment_date="2026-07-03 10:15 AM",
                            billing_month="July 2026",
                            received_by="Muhammad Shahid"
                        )
                        db.add(payment_db)

                db.commit()
                print("Seeded customer database successfully!")
        else:
            print(f"Excel sheet at {excel_path} not found. Skipping customer seeds.")
        
        print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
