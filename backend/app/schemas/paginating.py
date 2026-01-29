from typing import Generic, TypeVar, List
from pydantic import BaseModel, Field, ConfigDict

T = TypeVar("T")

class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Номер страницы")
    limit: int = Field(10, ge=1, le=100, description="Количество элементов на странице")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    pages: int

    model_config = ConfigDict(from_attributes=True)