# Import all models for SQLAlchemy/Alembic metadata
from backend.app.database.session import Base  # noqa
from backend.app.models.role import Role  # noqa
from backend.app.models.user import User  # noqa
from backend.app.models.package import Package  # noqa
from backend.app.models.customer import Customer  # noqa
from backend.app.models.invoice import Invoice  # noqa
from backend.app.models.payment import Payment  # noqa
from backend.app.models.complaint import Complaint  # noqa
from backend.app.models.notification import Notification  # noqa
from backend.app.models.expense import Expense  # noqa
from backend.app.models.log import ActivityLog  # noqa
from backend.app.models.settings import SystemSettings  # noqa
from backend.app.models.router import Router  # noqa
from backend.app.models.erp import Branch, InventoryItem, Technician  # noqa
from backend.app.models.tenant import Tenant  # noqa
