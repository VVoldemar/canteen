from typing import List, Optional
from pydantic import BaseModel

from app.schemas.dish import DishResponse

class MenuResponse(BaseModel):
    id: int
    name: str


class MenuDetailResponse(BaseModel):
    id: int
    name: str
    items: List[DishResponse]


class CreateMenuRequest(BaseModel):
    name: str
    dish_ids: List[int]


class UpdateMenuRequest(BaseModel):
    name: Optional[str] = None
    dish_ids: Optional[List[int]] = None