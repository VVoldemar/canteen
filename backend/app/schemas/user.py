from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
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


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    surname: Optional[str] = None
    patronymic: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)


class AdminUpdateUserRequest(BaseModel):
    role: Optional[UserRole] = None
    banned: Optional[bool] = None