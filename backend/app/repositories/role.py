from backend.app.repositories.base import BaseRepository
from backend.app.models.role import Role

class RoleRepository(BaseRepository[Role]):
    pass

role_repository = RoleRepository(Role)
