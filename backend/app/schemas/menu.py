from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.schemas.dish import DishResponse

from app.schemas.annotations import Name

class MenuResponse(BaseModel):
    id: int
    name: Name
    
    model_config = ConfigDict(from_attributes=True)

class MenuDetailResponse(BaseModel):
    id: int
    name: Name
    items: List[DishResponse]

    model_config = ConfigDict(from_attributes=True)


class CreateMenuRequest(BaseModel):
    name: Name
    dish_ids: Optional[List[int]] = None


class UpdateMenuRequest(BaseModel):
    name: Name = None
    dish_ids: Optional[List[int]] = None