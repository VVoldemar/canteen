from typing import Optional
from pydantic import BaseModel, Field

from annotations import Password, Name, Surname


class RegisterRequest(BaseModel):
    email: str
    name: str
    surname: str
    patronymic: Optional[str] = None
    password: Password


class LoginRequest(BaseModel):
    surname: Surname
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int