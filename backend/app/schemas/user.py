from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.schemas.annotations import Password

from app.core.enums import UserRole

class UserResponse(BaseModel):
    id: int
    name: str
    surname: str
    patronymic: Optional[str] = None
    role: UserRole
    registered_at: datetime
    banned: bool
    subscription_start: Optional[datetime] = None
    subscription_days: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class UpdateUserRequest(BaseModel):
    name: str
    surname: str
    patronymic: Optional[str] = None
    password: Password


class AdminUpdateUserRequest(BaseModel):
    role: Optional[UserRole] = None
    banned: Optional[bool] = None