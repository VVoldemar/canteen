from pydantic import BaseModel, Field, ConfigDict
from app.core.enums import Measures

class IngredientCreateSchema(BaseModel): # for creating a new Ingredient
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(min_length=2, max_length=100, example="Tea")
    price: float = Field(gt=0, example=150.0)
    measure = Measures = Field(example=Measures.WEIGHT)
    quantity: int = Field(ge=0, example=10)

class DishCreateSchema(BaseModel): # for creating a new Dish
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(min_length=2, max_length=100, example="Salad")
    price: float = Field(gt=0, example=300.0)
    ingredient_ids: list[int] = Field(default_factory=list, example=[1, 2, 3])  # List of ingredient IDs used in the dish