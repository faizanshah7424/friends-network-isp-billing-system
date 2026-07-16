import os
import sqlite3
import sys

def migrate():
    # Detect db path
    db_path = "./friends_network.db"
    if os.path.exists("backend/friends_network.db"):
        db_path = "backend/friends_network.db"
    
    print(f"Connecting to database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Update tenants table
    try:
        cursor.execute("PRAGMA table_info(tenants)")
        columns = [row[1] for row in cursor.fetchall()]
        
        new_columns = [
            ("brand_name", "VARCHAR(150)"),
            ("email", "VARCHAR(100)"),
            ("phone", "VARCHAR(50)"),
            ("address", "VARCHAR(500)"),
            ("theme_color", "VARCHAR(50) DEFAULT 'indigo'"),
            ("timezone", "VARCHAR(50) DEFAULT 'UTC'"),
            ("currency", "VARCHAR(10) DEFAULT 'PKR'"),
            ("language", "VARCHAR(10) DEFAULT 'en'"),
            ("invoice_footer", "VARCHAR(500)"),
            ("receipt_footer", "VARCHAR(500)"),
            ("customer_limit", "INTEGER DEFAULT 100"),
            ("storage_limit", "INTEGER DEFAULT 1000"),
            ("storage_used", "INTEGER DEFAULT 0"),
            ("subscription_expiry", "DATETIME"),
            ("payment_status", "VARCHAR(50) DEFAULT 'Paid'"),
            ("license_key", "VARCHAR(100)"),
            ("hardware_fingerprint", "VARCHAR(100)"),
            ("is_activated", "BOOLEAN DEFAULT 1"),
        ]
        
        for col, col_type in new_columns:
            if col not in columns:
                print(f"Adding column '{col}' to tenants table...")
                cursor.execute(f"ALTER TABLE tenants ADD COLUMN {col} {col_type}")
                conn.commit()
    except Exception as e:
        print(f"Error migrating tenants table: {e}")
        
    # 2. Update other tables to add tenant_id
    tables_to_add_tenant_id = [
        "users",
        "customers",
        "packages",
        "invoices",
        "payments",
        "complaints",
        "notifications",
        "expenses",
        "activity_logs",
        "system_settings",
        "routers",
        "branches",
        "inventory_items",
        "technicians"
    ]
    
    for table in tables_to_add_tenant_id:
        try:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [row[1] for row in cursor.fetchall()]
            if columns and "tenant_id" not in columns:
                print(f"Adding tenant_id column to {table} table...")
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN tenant_id VARCHAR(36) DEFAULT 'friends_network'")
                conn.commit()
        except Exception as e:
            print(f"Error migrating table {table}: {e}")
            
    # 2.1 Add specific columns for Customer Portal & Field Engineer APIs
    try:
        cursor.execute("PRAGMA table_info(customers)")
        cust_cols = [row[1] for row in cursor.fetchall()]
        if cust_cols and "portal_password_hash" not in cust_cols:
            print("Adding portal_password_hash to customers table...")
            cursor.execute("ALTER TABLE customers ADD COLUMN portal_password_hash VARCHAR(255)")
            # Set a default portal password for existing customers (fallback to standard username or ppp_password)
            conn.commit()
    except Exception as e:
        print(f"Error adding customer portal column: {e}")

    try:
        cursor.execute("PRAGMA table_info(complaints)")
        comp_cols = [row[1] for row in cursor.fetchall()]
        if comp_cols:
            new_comp_cols = [
                ("checkin_lat", "FLOAT"),
                ("checkin_lon", "FLOAT"),
                ("checkout_lat", "FLOAT"),
                ("checkout_lon", "FLOAT"),
                ("signature_url", "VARCHAR(255)"),
                ("photo_url", "VARCHAR(255)"),
                ("checkin_time", "VARCHAR(50)"),
                ("checkout_time", "VARCHAR(50)"),
            ]
            for col, col_type in new_comp_cols:
                if col not in comp_cols:
                    print(f"Adding column '{col}' to complaints table...")
                    cursor.execute(f"ALTER TABLE complaints ADD COLUMN {col} {col_type}")
                    conn.commit()
    except Exception as e:
        print(f"Error adding complaint tracking columns: {e}")
            
    # 2.2 Create AI-Native Autonomous OS Tables
    try:
        print("Creating AI and Automation tables if not exists...")
        
        # AI settings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_settings (
                id VARCHAR(36) PRIMARY KEY,
                tenant_id VARCHAR(36) DEFAULT 'friends_network',
                provider VARCHAR(50) DEFAULT 'Google Gemini',
                model VARCHAR(100) DEFAULT 'gemini-3.5-flash',
                temperature FLOAT DEFAULT 0.7,
                max_tokens INTEGER DEFAULT 2048,
                system_prompt TEXT,
                rate_limit INTEGER DEFAULT 100
            )
        """)
        
        # AI audits table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_audits (
                id VARCHAR(36) PRIMARY KEY,
                tenant_id VARCHAR(36) DEFAULT 'friends_network',
                prompt TEXT,
                response TEXT,
                username VARCHAR(100),
                model_used VARCHAR(100),
                tokens_used INTEGER,
                execution_time_ms INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Knowledge base table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_base (
                id VARCHAR(36) PRIMARY KEY,
                tenant_id VARCHAR(36) DEFAULT 'friends_network',
                title VARCHAR(200),
                content TEXT,
                category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Automation rules table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS automation_rules (
                id VARCHAR(36) PRIMARY KEY,
                tenant_id VARCHAR(36) DEFAULT 'friends_network',
                name VARCHAR(200),
                trigger_event VARCHAR(100),
                condition_operator VARCHAR(50),
                condition_value VARCHAR(100),
                action_type VARCHAR(100),
                action_target VARCHAR(100),
                is_active BOOLEAN DEFAULT 1
            )
        """)
        
        # Seed default knowledge base entries if empty
        cursor.execute("SELECT COUNT(*) FROM knowledge_base")
        if cursor.fetchone()[0] == 0:
            print("Seeding initial Knowledge Base articles...")
            kb_articles = [
                ("kb-1", "Standard Router Configuration SOP", "Connect router to PON. Access 192.168.1.1. Enter PPPoE credentials. Set SSID to customer request.", "Router Manuals"),
                ("kb-2", "Optical Power Attenuation Faults Guide", "If attenuation > -25dBm, clean APC optical connector. Verify splice points. Swap splitters.", "Troubleshooting Guides"),
                ("kb-3", "Termination Policy for Defaulters", "Connections with bills outstanding for > 30 days are automatically disabled at 10 AM.", "Company Policies")
            ]
            cursor.executemany("INSERT INTO knowledge_base (id, title, content, category) VALUES (?, ?, ?, ?)", kb_articles)
            
        # Seed default automation rules if empty
        cursor.execute("SELECT COUNT(*) FROM automation_rules")
        if cursor.fetchone()[0] == 0:
            print("Seeding default business automation rules...")
            auto_rules = [
                ("ar-1", "Auto-Suspend defauting customers", "Customer Bill Defaulter", "unpaid_days", "30", "Suspend Connection", "Router Port"),
                ("ar-2", "Escalate High Attenuation Tickets", "Complaint High Attenuation", "attenuation", "-26", "Assign Nearest Technician", "Technician Queue")
            ]
            cursor.executemany("INSERT INTO automation_rules (id, name, trigger_event, condition_operator, condition_value, action_type, action_target) VALUES (?, ?, ?, ?, ?, ?, ?)", auto_rules)
            
        conn.commit()
    except Exception as e:
        print(f"Error creating AI-Native tables: {e}")
            
    # 3. Insert default tenant if missing
    try:
        cursor.execute("SELECT id FROM tenants WHERE id = 'friends_network'")
        if not cursor.fetchone():
            print("Inserting default 'friends_network' tenant...")
            cursor.execute("""
                INSERT INTO tenants (id, name, domain, subscription_plan, status, brand_name, email, phone, address, currency, theme_color, is_activated, created_at)
                VALUES ('friends_network', 'Friends Network', 'friends.network', 'Enterprise', 'Active', 'Friends Network', 'support@friendsnetwork.net', '021-111-362-362', 'Karachi, Pakistan', 'PKR', 'indigo', 1, CURRENT_TIMESTAMP)
            """)
            conn.commit()
    except Exception as e:
        print(f"Error seeding default tenant: {e}")
        
    conn.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
