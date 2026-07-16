# Friends Network ISP Billing System
## Production Deployment & Operations Guide

This documentation guides administrators through deploying, securing, monitoring, and backing up the Friends Network ISP Billing & CRM platform in production.

---

## 1. System Architecture

The platform follows a containerized microservices architecture composed of:
1. **Frontend:** Next.js application served by NodeJS (Express runner).
2. **Backend:** FastAPI REST API server (Uvicorn manager).
3. **Database:** PostgreSQL instance running on persistent volumes.
4. **Proxy Gateway:** Nginx reverse proxy proxying user traffic, serving static assets, and compressing payloads.

```
       +------------------+
       |   User Browser   |
       +--------+---------+
                | HTTP/HTTPS (Port 80/443)
                v
       +--------+---------+
       |  Nginx Proxy     |
       +---+----------+---+
           |          |
   /api/*  |          |  /* (Pages)
           v          v
   +-------+---+  +---+-------+
   | FastAPI   |  | Next.js   |
   | Backend   |  | Frontend  |
   +---+-------+  +-----------+
       |
       v
   +---+-------+
   | Postgre-  |
   | SQL DB    |
   +-----------+
```

---

## 2. Docker Deployment

### A. Prerequisites
Ensure `docker` and `docker-compose` are installed:
```bash
docker --version
docker-compose --version
```

### B. Environment File (.env)
Create a `.env` file in the project root:
```env
# Database Settings
POSTGRES_USER=fn_admin
POSTGRES_PASSWORD=fn_secure_password_123
POSTGRES_DB=fn_isp_billing
DATABASE_URL=postgresql://fn_admin:fn_secure_password_123@db:5432/fn_isp_billing

# Security
SECRET_KEY=friends_network_super_secret_production_key_2026_987654321
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Client Setup
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### C. Launching Services
To build and launch the entire stack in the background:
```bash
docker-compose up -d --build
```

---

## 3. Database Operations & Backups

### A. Manual Backup Creation
The system provides built-in endpoints for manual backup generation. To trigger a backup via terminal curl (requires Super Admin token):
```bash
curl -X POST http://localhost:8000/api/v1/backup/create \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT>"
```
This clones the active database and saves it under the persistent static folder: `/static/uploads/friends_network_backup.db`.

### B. Database Restoration
To restore the database from the last saved backup:
```bash
curl -X POST http://localhost:8000/api/v1/backup/restore \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT>"
```

---

## 4. User Role Permission Matrix

The application enforces Role-Based Access Control (RBAC):

| Module / Action | Super Admin | Sub Admin (Staff) | Notes |
| :--- | :---: | :---: | :--- |
| **Manage MikroTik Routers** | ✅ Yes | ❌ No | Add, edit credentials, remove. |
| **Batch CSV/Excel Imports** | ✅ Yes | ❌ No | Only Super Admin can bulk-import. |
| **Receive Payments** | ✅ Yes | ✅ Yes | Both roles can record payments. |
| **Suspended Connections** | ✅ Yes | ✅ Yes | Auto-notifies router. |
| **Create Operator Accounts** | ✅ Yes | ❌ No | Super Admin controls accounts. |
| **System Settings** | ✅ Yes | ❌ No | Edit system parameters. |
| **View Audit Logs** | ✅ Yes | ❌ No | Track staff actions. |

---

## 5. Health Monitoring & Status Checkers

The system exposes a unified monitoring endpoint at `GET /api/v1/health`. This checks:
* **Database Roundtrip:** Connects and calculates latency in milliseconds.
* **Storage Space:** Returns total, used, free, and usage percentages.
* **MikroTik status:** Lists registered routers and current online/offline status flags.

To query status:
```bash
curl -X GET http://localhost:8000/api/v1/health
```

Example Response:
```json
{
  "status": "Healthy",
  "timestamp": "2026-07-17 02:08:44",
  "database": {
    "status": "Healthy",
    "latencyMs": 0.88
  },
  "storage": {
    "status": "Healthy",
    "freeGb": 42.45,
    "totalGb": 128.0,
    "usagePercentage": 66.83
  },
  "routers": [
    {
      "id": "router-std-01",
      "name": "Core-CCR1036",
      "ip": "192.168.88.1",
      "status": "Online",
      "lastConnected": "2026-07-17 01:50:00"
    }
  ]
}
```
