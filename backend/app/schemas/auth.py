from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.annotations import Name, Surname, Password


class RegisterRequest(BaseModel):
    name: Name
    surname: Surname
    email: str
    patronymic: Optional[str] = None
    password: Password


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str