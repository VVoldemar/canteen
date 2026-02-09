from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.schemas.annotations import Password, Name

from app.core.enums import UserRole

class UserResponse(BaseModel):
    id: int
    name: Name
    surname: str
    patronymic: Optional[str] = None
    role: UserRole
    registered_at: datetime
    banned: bool
    balance: Optional[int] = None
    subscription_start: Optional[datetime] = None
    subscription_days: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class UpdateUserRequest(BaseModel):
    name: Optional[Name] = None
    surname: Optional[str] = None
    patronymic: Optional[str] = None
    password: Optional[Password] = None


class AdminUpdateUserRequest(BaseModel):
    role: Optional[UserRole] = None
    banned: Optional[bool] = None