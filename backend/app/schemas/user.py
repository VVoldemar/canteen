from pydantic import BaseModel, Field, ConfigDict
from app.core.enums import UserRole


class UserCreateSchema(BaseModel): # for creating a new user
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(min_length=2, max_length=50, example="Иван")
    surname: str = Field(min_length=2, max_length=50, example="Иванов")
    patronymic: str | None = Field(None, min_length=2, max_length=50, example="Иванович") 
    password: str = Field(min_length=8, example="Password123!")
    
    role: UserRole = Field(default=UserRole.STUDENT, example="student")
    ingredient_allergies: list[int] = Field(default_factory=list, example=[1, 2, 3])  # List of ingredient IDs the user is allergic '
