from typing import Optional
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    name: str
    surname: str
    patronymic: Optional[str] = None
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    surname: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int