from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.api.deps import get_db, PermissionChecker
from backend.app.models.user import User
from backend.app.models.package import Package
from backend.app.repositories.package import package_repository
from backend.app.repositories.log import activity_log_repository
from backend.app.models.log import ActivityLog
from backend.app.schemas.package import PackageSchema, PackageCreate, PackageUpdate

router = APIRouter()

@router.get("/", response_model=List[PackageSchema])
def list_packages(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin", "Sub Admin"]))
):
    return package_repository.get_multi(db)

@router.post("/", response_model=PackageSchema)
def create_package(
    package_in: PackageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    # Check duplicate Package Name
    dup = package_repository.get_by_name(db, name=package_in.name)
    if dup:
        raise HTTPException(status_code=400, detail="Package name already exists")

    pkg_db = Package(
        name=package_in.name,
        category=package_in.category,
        speed=package_in.speed,
        monthly_charges=package_in.monthly_charges,
        status=package_in.status or "Active",
        description=package_in.description
    )
    
    created = package_repository.create(db, db_obj=pkg_db)

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Package Changed",
        details=f"Created new service package {created.name} ({created.speed}) at PKR {created.monthly_charges}/mo"
    )
    activity_log_repository.create(db, db_obj=log)

    return created

@router.put("/{id}", response_model=PackageSchema)
def update_package(
    id: str,
    package_in: PackageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    pkg = package_repository.get(db, id=id)
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    updated = package_repository.update(db, db_obj=pkg, obj_in=package_in)

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Package Changed",
        details=f"Updated service package plan {updated.name}"
    )
    activity_log_repository.create(db, db_obj=log)

    return updated

@router.delete("/{id}", response_model=PackageSchema)
def delete_package(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["Super Admin"]))
):
    pkg = package_repository.get(db, id=id)
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    deleted = package_repository.remove(db, id=id)

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        username=current_user.username,
        action="Package Changed",
        details=f"Deleted service package plan {deleted.name}"
    )
    activity_log_repository.create(db, db_obj=log)

    return deleted
