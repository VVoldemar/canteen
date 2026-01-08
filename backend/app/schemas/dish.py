from typing import List, Optional
from pydantic import BaseModel, Field

from core.enums import Measures
from annotations import Price, Name


class IngredientResponse(BaseModel):
    id: int
    name: Name
    price: Price
    measure: Measures


# class PaginatedIngredientResponse(BaseModel):
#     items: List[IngredientResponse]
#     total: int
#     page: int
#     pages: int


class CreateIngredientRequest(BaseModel):
    name: Name
    price: int = Field(ge=0)
    measure: Measures


class UpdateIngredientRequest(BaseModel):
    name: Optional[Name] = None
    price: Optional[int] = Field(None, ge=0)
    measure: Optional[Measures] = None


class DishResponse(BaseModel):
    id: int
    name: Name
    price: Price


# class PaginatedDishResponse(BaseModel):
#     items: List[DishResponse]
#     total: int
#     page: int
#     pages: int


class DishIngredientResponse(BaseModel):
    ingredient: IngredientResponse
    amount_thousandth_measure: int


class DishIngredientLink(BaseModel):
    ingredient_id: int
    amount_thousandth_measure: int = Field(gt=0)


class DishDetailResponse(BaseModel):
    id: int
    name: Name
    price: Price
    ingredients: List[DishIngredientResponse]


class CreateDishRequest(BaseModel):
    name: Name
    price: Price
    ingredients: List[DishIngredientLink]


class UpdateDishRequest(BaseModel):
    name: Optional[Name] = None
    price: Optional[Price] = None
    ingredients: Optional[List[DishIngredientLink]] = None