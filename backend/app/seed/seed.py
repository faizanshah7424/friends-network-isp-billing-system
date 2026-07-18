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
    
    # Ensure database tables exist
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Error running create_all: {e}")
    
    # 0. Seed Default Tenant
    try:
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
    except Exception as e:
        db.rollback()
        print(f"Error seeding tenant: {e}")

    # 1. Seed Roles
    super_admin_role = None
    sub_admin_role = None
    try:
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
    except Exception as e:
        db.rollback()
        print(f"Error seeding roles: {e}")
        # Fetch existing roles as fallback
        super_admin_role = db.query(Role).filter(Role.name == "Super Admin").first()
        sub_admin_role = db.query(Role).filter(Role.name == "Sub Admin").first()

    # 2. Seed Admin Users
    try:
        if super_admin_role and sub_admin_role:
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
            print("Admin user accounts ('muhammad_shahid' and 'noor_jamal') committed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding admin users: {e}")
            
    # 3. Seed Packages
    try:
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
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding packages: {e}")
                
    # 4. Seed Settings
    try:
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
    except Exception as e:
        db.rollback()
        print(f"Error seeding system settings: {e}")

    # 5. Import Customers from Excel
    try:
        excel_paths = [
            os.path.join(os.path.dirname(__file__), "user_data.xlsx"),
            r"E:\Coding\New folder\Downloads\User Data (3).xlsx",
            r"E:\Coding\New folder\Downloads\User Data.xlsx"
        ]
        excel_path = None
        for p in excel_paths:
            if os.path.exists(p):
                excel_path = p
                break

        if excel_path:
            cust_count = db.query(Customer).count()
            if cust_count == 0:
                print(f"Seeding 642 real ISP customer accounts from Excel sheet: {excel_path}...")
                xl = pd.ExcelFile(excel_path)
                
                EXCEL_PKG_MAP = {
                    'silver30': ('pkg-sm-silver', 'Silver', 1300),
                    'bronze (25mbps)': ('pkg-std-bronze', 'Bronze', 1500),
                    'starter+ (18mbps)': ('pkg-std-starter', 'Starter', 1300),
                    'basic (35mbps)': ('pkg-std-basic', 'Basic', 2000),
                    'supreme (32mbps+ip)': ('pkg-static-supreme', 'Supreme', 8000),
                    'maxplus (90mbps)': ('pkg-std-maxplus', 'Max Plus', 6500),
                    'express (50mbps)': ('pkg-std-express', 'Express', 3000),
                    'max (60mbps)': ('pkg-std-max', 'Max', 4000),
                    'standard (16mbps+ip)': ('pkg-static-standard', 'Standard', 5000),
                    'super (75mbps)': ('pkg-std-super', 'Super', 5000),
                }

                inv_count = 1000
                pay_count = 1000

                for sheet_name in xl.sheet_names:
                    status_clean = 'Active' if 'act' in sheet_name.lower() and 'non' not in sheet_name.lower() else 'Inactive'
                    df = pd.read_excel(excel_path, sheet_name=sheet_name)
                    df.columns = [str(c).strip() for c in df.iloc[0]]
                    df = df.iloc[1:].reset_index(drop=True)

                    for _, row in df.iterrows():
                        cust_id = str(row['User ID']).strip()
                        cust_name = str(row['User Name']).strip()
                        reg_date_val = row['Reg Date']
                        if isinstance(reg_date_val, pd.Timestamp) or hasattr(reg_date_val, 'strftime'):
                            reg_date = reg_date_val.strftime('%Y-%m-%d')
                        else:
                            reg_date = '2025-01-01'

                        pkg_raw = str(row['Package']).strip().lower()
                        address = str(row['Address']).strip() if pd.notna(row['Address']) else 'Karachi'
                        mac = str(row['Mac']).strip() if pd.notna(row['Mac']) else ''

                        mapped = EXCEL_PKG_MAP.get(pkg_raw, ('pkg-std-starter', 'Starter', 1300))
                        pkg_id, pkg_name, monthly_charges = mapped

                        cust_obj = Customer(
                            customer_id=cust_id,
                            name=cust_name,
                            phone='0300-1234567',
                            whatsapp='0300-1234567',
                            address=address,
                            area='Karachi',
                            package_id=pkg_id,
                            package_name=pkg_name,
                            monthly_charges=monthly_charges,
                            installation_charges=0,
                            router_mac=mac,
                            connection_date=reg_date,
                            connection_status=status_clean,
                            payment_status='Paid' if status_clean == 'Active' else 'Unpaid',
                            outstanding_balance=0 if status_clean == 'Active' else monthly_charges,
                            timeline=[{
                                "id": str(uuid.uuid4()),
                                "title": "Connection Activated",
                                "description": f"Connection set to {status_clean} under {pkg_name} package.",
                                "date": reg_date,
                                "type": "success" if status_clean == "Active" else "warning"
                            }]
                        )
                        db.add(cust_obj)

                        inv_count += 1
                        inv_obj = Invoice(
                            invoice_number=f'INV-2026-{inv_count}',
                            customer_id=cust_id,
                            customer_name=cust_name,
                            billing_month='July 2026',
                            monthly_charges=monthly_charges,
                            previous_due=0,
                            additional_charges=0,
                            discount=0,
                            grand_total=monthly_charges,
                            amount_paid=monthly_charges if status_clean == 'Active' else 0,
                            outstanding_balance=0 if status_clean == 'Active' else monthly_charges,
                            payment_status='Paid' if status_clean == 'Active' else 'Unpaid',
                            billing_date='2026-07-01',
                            due_date='2026-07-10'
                        )
                        db.add(inv_obj)

                        if status_clean == 'Active':
                            pay_count += 1
                            payment_obj = Payment(
                                receipt_number=f'REC-2026-{pay_count}',
                                customer_id=cust_id,
                                customer_name=cust_name,
                                amount_received=monthly_charges,
                                payment_method='Bank',
                                reference_number=f'FT-{10000 + pay_count}',
                                payment_date='2026-07-03 10:00 AM',
                                billing_month='July 2026',
                                received_by='Muhammad Shahid'
                            )
                            db.add(payment_obj)

                db.commit()
                print("Seeded 642 customer accounts from Excel sheet successfully!")
        else:
            print("Excel file for customer seeding not found.")
        
        print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error during customer seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
