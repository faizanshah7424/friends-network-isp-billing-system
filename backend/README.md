# Friends Network ISP Billing System Backend

This is the secure, scalable, and production-grade backend for the Friends Network ISP Billing System, built using **FastAPI** and **PostgreSQL** (with **SQLite** fallback for local dev).

## Technology Stack
* **Web Framework:** FastAPI
* **Database & ORM:** PostgreSQL & SQLAlchemy 2.x
* **Migrations:** Alembic
* **Validation:** Pydantic v2
* **Authentication:** JWT (python-jose, passlib, bcrypt)

---

## Project Structure
```
backend/
  alembic/            # Database schema migrations
  app/
    api/              # REST Endpoints
      endpoints/      # Route controllers (Auth, Customers, Invoices, etc.)
      api.py          # Namespaced router compiler
      deps.py         # Authentication & RBAC dependency injection
    core/             # Config loader, security utils, constants
    database/         # Engine connection, DB session factory
    models/           # SQLAlchemy model schemas
    schemas/          # Pydantic validation schemas
    seed/             # Seeding scripts (Excel parsing, default roles/users)
    main.py           # Application entrypoint
  .env.example        # Environment variables template
  .env                # Local configuration values
  Dockerfile          # Container build manifest
  docker-compose.yml  # Docker multi-container orchestrator
  requirements.txt    # Project dependencies list
  README.md           # Documentation guide
```

---

## Setup & Running Locally

### 1. Installation
Install python dependencies in your environment:
```bash
pip install -r requirements.txt
```

### 2. Configuration
Copy `.env.example` to `.env` and set up your connection strings:
* By default, it runs with a local SQLite database (`sqlite:///./friends_network.db`).
* For PostgreSQL, update `DATABASE_URL`:
```ini
DATABASE_URL=postgresql://user:password@localhost:5432/friends_network
```

### 3. Database Migration
Run Alembic migrations to build the tables:
```bash
# Run migrations
python -m alembic upgrade head
```

### 4. Seeding Data
Run the database seed script to load default roles, system settings, the 14 official packages, and the 408 customer records from the Excel sheet:
```bash
# Set PYTHONPATH and seed the database
$env:PYTHONPATH="E:\friends-network-ISP-billing-system"; python backend/app/seed/seed.py
```

### 5. Running the API Server
Start the development server using Uvicorn:
```bash
# Start backend server
$env:PYTHONPATH="E:\friends-network-ISP-billing-system"; python -m uvicorn backend.app.main:app --reload --port 8000
```
Visit the interactive Swagger API documentation at:
* **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## Default Admin Credentials
* **Super Admin:**
  * **Username:** `muhammad_shahid`
  * **Password:** `shahid123`
* **Sub Admin:**
  * **Username:** `noor_jamal`
  * **Password:** `noor123`

---

## API Documentation (Endpoints)
* **Authentication:** `POST /api/v1/auth/login` (generates JWT), `GET /api/v1/auth/me` (retrieves active account)
* **Customers:** `GET /api/v1/customers/`, `POST /api/v1/customers/`, `POST /api/v1/customers/{id}/suspend`, `POST /api/v1/customers/{id}/activate`, `POST /api/v1/customers/{id}/notes`
* **Packages:** `GET /api/v1/packages/`, `POST /api/v1/packages/`, `PUT /api/v1/packages/{id}`, `DELETE /api/v1/packages/{id}`
* **Payments:** `GET /api/v1/payments/`, `POST /api/v1/payments/` (receives payment), `POST /api/v1/payments/bulk-change-package`, `POST /api/v1/payments/bulk-status-active`
* **Billing/Invoices:** `GET /api/v1/billing/`, `GET /api/v1/billing/{id}`, `POST /api/v1/billing/generate-monthly` (generates billing cycle invoices)
* **Complaints:** `GET /api/v1/complaints/`, `POST /api/v1/complaints/`, `PUT /api/v1/complaints/{id}` (technician assignments & resolutions)
* **Reports:** `GET /api/v1/reports/dashboard-stats`, `GET /api/v1/reports/filter-customers` (supports package category & name filtering)
* **Settings:** `GET /api/v1/settings/`, `PUT /api/v1/settings/`
* **Notifications:** `GET /api/v1/notifications/`, `GET /api/v1/notifications/unread-count`, `POST /api/v1/notifications/{id}/read`
* **Balance Sheet:** `GET /api/v1/balance-sheet/summary`, `GET /api/v1/balance-sheet/expenses`, `POST /api/v1/balance-sheet/expenses`, `DELETE /api/v1/balance-sheet/expenses/{id}`
