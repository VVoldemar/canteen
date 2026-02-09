from typing import List
from sqlalchemy import String, Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import Measures
from app.models.base import SqlAlchemyBase
from app.models.associations import user_allergies


class Ingredient(SqlAlchemyBase):
    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(), nullable=False)
    price: Mapped[int] = mapped_column(Integer(), nullable=False)
    measure: Mapped[Measures] = mapped_column(Enum(Measures), nullable=False)  # кг/л
    
    used_in: Mapped[List["DishIngredient"]] = relationship(back_populates="ingredient", cascade="all, delete-orphan")
    allergic_users: Mapped[List["User"]] = relationship(secondary=user_allergies, back_populates="ingredient_allergies")
    applications: Mapped[List["ApplicationItem"]] = relationship(back_populates="ingredient", cascade="all, delete-orphan") 


class Dish(SqlAlchemyBase):
    __tablename__ = "dishes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(), nullable=False)
    price: Mapped[int] = mapped_column(Integer(), nullable=False)
    image_url: Mapped[str] = mapped_column(String(), nullable=True)
 
    ingredients: Mapped[List["DishIngredient"]] = relationship(back_populates="dish", cascade="all, delete-orphan")
    orders: Mapped[List["OrderItem"]] = relationship(back_populates="dish", cascade="all, delete-orphan")
    menu_occurrences: Mapped[List["MenuItem"]] = relationship(back_populates="dish", cascade="all, delete-orphan")
    reviews: Mapped[List["Review"]] = relationship(back_populates="dish", cascade="all, delete-orphan")