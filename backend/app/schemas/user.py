from pydantic import BaseModel, Field, ConfigDict
# from datetime import datetime

from enum import Enum
# from typing import Optional

# class UserRole(str, Enum):
#     STUDENT = "student"
#     TEACHER = "teacher"
#     ADMIN = "admin"

class UserCreateSchema(BaseModel): # Для нового пользователя
    # id: Optional[int] = None

    name: str = Field(min_length=2, max_length=50, example="Иван")
    surname: str = Field(min_length=2, max_length=50, example="Иванов")
    patronymic: str | None = Field(None, min_length=2, max_length=50, example="Иванович") 
    password: str = Field(min_length=8, example="Password123!")
    # role: UserRole = Field(default=UserRole.STUDENT, example="student")




# class UserUpdateSchema(BaseModel): 
#     name: Optional[str] = Field(None, min_length=2, max_length=50)
#     surname: Optional[str] = Field(None, min_length=2, max_length=50)
#     patronymic: Optional[str] = Field(None, max_length=50)
#     password: Optional[str] = Field(None, min_length=8)

