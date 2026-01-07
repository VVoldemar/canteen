from typing import List
from datetime import datetime
from pydantic import BaseModel, Field

from order import OrderStatus
from dish import IngredientResponse

class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    datetime: datetime
    status: OrderStatus


# class PaginatedApplicationResponse(BaseModel):
#     items: List[ApplicationResponse]
#     total: int
#     page: int
#     pages: int


class ApplicationProductResponse(BaseModel):
    ingredient: IngredientResponse
    quantity: int


class ApplicationDetailResponse(BaseModel):
    id: int
    user_id: int
    datetime: datetime
    status: OrderStatus
    products: List[ApplicationProductResponse]


class ApplicationProductLink(BaseModel):
    ingredient_id: int
    quantity: int = Field(ge=1)


class CreateApplicationRequest(BaseModel):
    products: List[ApplicationProductLink]


class ApplicationRejectRequest(BaseModel):
    reason: str