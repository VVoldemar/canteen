from typing import List, Optional
from pydantic import BaseModel

from app.schemas.dish import DishResponse

class MenuResponse(BaseModel):
    id: int
    name: Name


class MenuDetailResponse(BaseModel):
    id: int
    name: Name
    items: List[DishResponse]


class CreateMenuRequest(BaseModel):
    name: Name
    dish_ids: List[int]


class UpdateMenuRequest(BaseModel):
    name: Optional[Name] = None
    dish_ids: Optional[List[int]] = None