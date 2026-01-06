from pydantic import BaseModel, Field

class ItemCreateSchema(BaseModel): # Для нового товара
    name: str = Field(min_length=2, max_length=100, example="Чай")
    description: str | None = Field(None, max_length=300, example="Обычный черный чай")
    price: float = Field(gt=0, example=150.0)
    quantity: int = Field(ge=0, example=10)

# Надо подключиться к бд, чтобы узнать, какие товары уже есть

# class ItemBuySchema(BaseModel): # Для покупки товара
#     item_id: int = Field(gt=0, example=1)
#     renter_id: int = Field(gt=0, example=2)
#     rental_period_days: int = Field(gt=0, example=7)