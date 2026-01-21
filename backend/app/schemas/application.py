from typing import List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import OrderStatus
from app.schemas.dish import IngredientResponse

class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    datetime: datetime
    status: OrderStatus
    
    model_config = ConfigDict(from_attributes=True)


class ApplicationProductResponse(BaseModel):
    ingredient: IngredientResponse
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class ApplicationDetailResponse(BaseModel):
    id: int
    user_id: int
    datetime: datetime
    status: OrderStatus
    products: List[ApplicationProductResponse]

    model_config = ConfigDict(from_attributes=True)


class ApplicationProductLink(BaseModel):
    ingredient_id: int
    quantity: int = Field(ge=1)


class CreateApplicationRequest(BaseModel):
    products: List[ApplicationProductLink]


class ApplicationRejectRequest(BaseModel):
    reason: str