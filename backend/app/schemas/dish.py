from typing import List, Optional
from pydantic import BaseModel, Field

from app.core.enums import Measures


class IngredientResponse(BaseModel):
    id: int
    name: str
    price: int
    measure: Measures


class PaginatedIngredientResponse(BaseModel):
    items: List[IngredientResponse]
    total: int
    page: int
    pages: int


class CreateIngredientRequest(BaseModel):
    name: str
    price: int = Field(ge=0)
    measure: Measures


class UpdateIngredientRequest(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = Field(None, ge=0)
    measure: Optional[Measures] = None


class DishResponse(BaseModel):
    id: int
    name: str
    price: int

class PaginatedDishResponse(BaseModel):
    items: List[IngredientResponse]
    total: int
    page: int
    pages: int

class DishIngredientResponse(BaseModel):
    ingredient: IngredientResponse
    amount_thousandth_measure: int


class DishIngredientLink(BaseModel):
    ingredient_id: int
    amount_thousandth_measure: int = Field(gt=0)


class DishDetailResponse(BaseModel):
    id: int
    name: str
    price: int
    ingredients: List[DishIngredientResponse]


class CreateDishRequest(BaseModel):
    name: str
    price: int = Field(ge=0)
    ingredients: List[DishIngredientLink]


class UpdateDishRequest(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = Field(None, ge=0)
    ingredients: Optional[List[DishIngredientLink]] = None