import sys
import os

def check():
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    print("Checking backend imports...")
    try:
        import backend.app.main
        print("Backend main imported successfully.")
        import backend.app.api.api
        print("Backend api router imported successfully.")
        import backend.app.core.events
        print("Backend events module imported successfully.")
        import backend.app.core.scheduler
        print("Backend scheduler imported successfully.")
        import backend.app.core.s3
        print("Backend s3 module imported successfully.")
        import backend.app.api.endpoints.tenant
        print("Tenant endpoints imported successfully.")
        import backend.app.api.endpoints.license
        print("License endpoints imported successfully.")
        import backend.app.api.endpoints.platform
        print("Platform endpoints imported successfully.")
        import backend.app.api.endpoints.ai
        print("AI endpoints imported successfully.")
        import backend.app.api.endpoints.customer_portal
        print("Customer portal endpoints imported successfully.")
        import backend.app.api.endpoints.mobile_api
        print("Mobile API endpoints imported successfully.")
        import backend.app.api.endpoints.noc
        print("NOC endpoints imported successfully.")
        import backend.app.api.endpoints.procurement
        print("Procurement endpoints imported successfully.")
        import backend.app.api.endpoints.finance
        print("Finance endpoints imported successfully.")
        import backend.app.api.endpoints.communication
        print("Communication endpoints imported successfully.")
        import backend.app.api.endpoints.document
        print("Document endpoints imported successfully.")
        import backend.app.api.endpoints.public_api
        print("Public API endpoints imported successfully.")
        import backend.app.core.plugins
        print("Plugins core module imported successfully.")
        import backend.app.core.observability
        print("Observability core module imported successfully.")
        import backend.app.api.endpoints.ai_admin
        print("AI admin settings endpoint imported successfully.")
        import backend.app.api.endpoints.ai_customer
        print("AI customer assistant endpoint imported successfully.")
        import backend.app.api.endpoints.ai_technician
        print("AI technician assistant endpoint imported successfully.")
        import backend.app.api.endpoints.ai_knowledge
        print("AI knowledge base endpoint imported successfully.")
        import backend.app.api.endpoints.ai_reports
        print("AI reports generator endpoint imported successfully.")
        import backend.app.api.endpoints.automation
        print("Smart automation rules endpoint imported successfully.")
        print("All backend code checked and verified!")
    except Exception as e:
        print(f"Compilation/Import Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check()
