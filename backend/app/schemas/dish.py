from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

from app.core.enums import Measures

from app.schemas.annotations import Name, Price

class IngredientResponse(BaseModel):
    id: int
    name: Name
    price: Price
    measure: Measures
    
    model_config = ConfigDict(from_attributes=True)


class PaginatedIngredientResponse(BaseModel):
    items: List[IngredientResponse]
    total: int
    page: int
    pages: int

    model_config = ConfigDict(from_attributes=True)


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

    model_config = ConfigDict(from_attributes=True)

class PaginatedDishResponse(BaseModel):
    items: List[IngredientResponse]
    total: int
    page: int
    pages: int

    model_config = ConfigDict(from_attributes=True)

class DishIngredientResponse(BaseModel):
    ingredient: IngredientResponse
    amount_thousandth_measure: int

    model_config = ConfigDict(from_attributes=True)


class DishIngredientLink(BaseModel):
    ingredient_id: int
    amount_thousandth_measure: int = Field(gt=0)


class DishDetailResponse(BaseModel):
    id: int
    name: Name
    price: Price
    ingredients: List[DishIngredientResponse]

    model_config = ConfigDict(from_attributes=True)


class CreateDishRequest(BaseModel):
    name: Name
    price: Price
    ingredients: List[DishIngredientLink]


class UpdateDishRequest(BaseModel):
    name: Optional[Name] = None
    price: Optional[Price] = None

    ingredients: Optional[List[DishIngredientLink]] = None