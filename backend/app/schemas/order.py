from typing import List, Optional
from datetime import  datetime
from pydantic import BaseModel, Field

from core.enums import OrderStatus
from dish import DishResponse

class OrderResponse(BaseModel):
    id: int
    user_id: int
    ordered_at: datetime
    completed_at: Optional[datetime] = None
    status: OrderStatus


# class PaginatedOrderResponse(BaseModel):
#     items: List[OrderResponse]
#     total: int
#     page: int
#     pages: int


class OrderDishResponse(BaseModel):
    dish: DishResponse
    quantity: int


class OrderDetailResponse(BaseModel):
    id: int
    user_id: int
    ordered_at: datetime
    completed_at: Optional[datetime] = None
    status: OrderStatus
    dishes: List[OrderDishResponse]


class OrderDishLink(BaseModel):
    dish_id: int
    quantity: int = Field(ge=1)


class CreateOrderRequest(BaseModel):
    dishes: List[OrderDishLink]