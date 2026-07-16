import asyncio
import os
import shutil
import datetime
from sqlalchemy.orm import Session
from backend.app.database.session import SessionLocal
from backend.app.models.customer import Customer
from backend.app.models.invoice import Invoice
from backend.app.models.tenant import Tenant
from backend.app.core.events import event_system

async def generate_monthly_billing_job():
    print("[Scheduler] Running Monthly Billing & Invoice Generation...")
    db = SessionLocal()
    try:
        # Query all active tenants bypassing isolation
        tenants = db.query(Tenant).execution_options(bypass_tenant=True).all()
        for t in tenants:
            # Query active customers for this tenant
            customers = db.query(Customer).execution_options(bypass_tenant=True).filter(
                Customer.tenant_id == t.id,
                Customer.connection_status == "Active"
            ).all()
            
            billing_month = datetime.datetime.now().strftime("%B %Y")  # e.g., "July 2026"
            billing_date = datetime.datetime.now().strftime("%Y-%m-%d")
            due_date = (datetime.datetime.now() + datetime.timedelta(days=10)).strftime("%Y-%m-%d")
            
            for c in customers:
                # Check if invoice already exists for this customer and month
                exists = db.query(Invoice).execution_options(bypass_tenant=True).filter(
                    Invoice.customer_id == c.customer_id,
                    Invoice.billing_month == billing_month,
                    Invoice.tenant_id == t.id
                ).first()
                
                if not exists:
                    # Create new invoice
                    previous_due = c.outstanding_balance
                    grand_total = c.monthly_charges + previous_due
                    
                    inv = Invoice(
                        tenant_id=t.id,
                        invoice_number=f"INV-{datetime.datetime.now().year}-{c.customer_id}-{datetime.datetime.now().month}",
                        customer_id=c.customer_id,
                        customer_name=c.name,
                        billing_month=billing_month,
                        monthly_charges=c.monthly_charges,
                        previous_due=previous_due,
                        additional_charges=0,
                        discount=0,
                        grand_total=grand_total,
                        amount_paid=0,
                        outstanding_balance=grand_total,
                        payment_status="Unpaid",
                        billing_date=billing_date,
                        due_date=due_date
                    )
                    db.add(inv)
                    
                    # Update customer outstanding balance
                    c.outstanding_balance = grand_total
                    c.payment_status = "Unpaid"
                    
                    # Trigger event
                    await event_system.trigger_event(
                        db=db,
                        tenant_id=t.id,
                        event_type="Invoice Generated",
                        title="Monthly Invoice Generated",
                        message=f"Bill of {c.monthly_charges} PKR generated for customer {c.name}.",
                        details=f"Invoice {inv.invoice_number} created for {billing_month}."
                    )
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Scheduler] Error in monthly billing: {e}")
    finally:
        db.close()

async def backup_database_job():
    print("[Scheduler] Running Database Backup Job...")
    db_path = "./friends_network.db"
    if os.path.exists("backend/friends_network.db"):
        db_path = "backend/friends_network.db"
        
    if not os.path.exists(db_path):
        print(f"[Scheduler] Database file not found at {db_path}, skipping backup.")
        return
        
    backup_dir = "backend/static/backups"
    os.makedirs(backup_dir, exist_ok=True)
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    dest_path = os.path.join(backup_dir, f"backup_{timestamp}.db")
    
    try:
        shutil.copy2(db_path, dest_path)
        print(f"[Scheduler] Backup successfully written to {dest_path}")
    except Exception as e:
        print(f"[Scheduler] Backup execution failed: {e}")

async def router_sync_job():
    print("[Scheduler] Running MikroTik Router Synchronization...")
    # Simulated router sync, check connection to active routers
    await asyncio.sleep(1)

async def statistics_refresh_job():
    print("[Scheduler] Running Statistics Refresh & Cache Cleansing...")
    await asyncio.sleep(1)

async def health_checks_job():
    print("[Scheduler] Running Server Health Checks...")
    # Health metrics log simulation
    await asyncio.sleep(1)

async def scheduler_loop():
    print("[Scheduler] Starting background job worker thread...")
    # Run once at startup
    await backup_database_job()
    
    # Run periodic loop
    while True:
        try:
            # Sleep 1 hour between general checks (or 5 minutes for demonstration and debugging)
            await asyncio.sleep(300) # 5 minutes
            
            await router_sync_job()
            await health_checks_job()
            await statistics_refresh_job()
            
            # Run backups daily (if hour is 0)
            now = datetime.datetime.now()
            if now.hour == 0 and now.minute < 10:
                await backup_database_job()
                await generate_monthly_billing_job()
        except asyncio.CancelledError:
            print("[Scheduler] Worker cancelled.")
            break
        except Exception as e:
            print(f"[Scheduler] Error in worker loop: {e}")
            await asyncio.sleep(30)
