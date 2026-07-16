from sqlalchemy.orm import Session
from backend.app.repositories.base import BaseRepository
from backend.app.models.settings import SystemSettings

class SettingsRepository(BaseRepository[SystemSettings]):
    def get_latest(self, db: Session) -> SystemSettings:
        settings_obj = db.query(self.model).first()
        if not settings_obj:
            # Create a default settings row
            settings_obj = SystemSettings(
                company_name="Friends Network",
                phone="021-111-362-362",
                email="support@friendsnetwork.net",
                address="Suite 201, Karachi, Pakistan",
                invoice_footer="This is a computer-generated invoice.",
                receipt_footer="Thank you for your payment."
            )
            db.add(settings_obj)
            db.commit()
            db.refresh(settings_obj)
        return settings_obj

settings_repository = SettingsRepository(SystemSettings)
