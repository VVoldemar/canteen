from sqlalchemy import Table, Column, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import SqlAlchemyBase


# class SubscriptionOrder(SqlAlchemyBase):
#     __tablename__ = "SubscriptionOrders"

#     user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), primary_key=True)
#     order_id: Mapped[int] = mapped_column(ForeignKey("order.id"), primary_key=True)

#     user: Mapped["User"] = relationship(back_populates="subscription_order")
#     order: Mapped["Order"] = relationship(back_populates="subscribed_user")


class ApplicationItem(SqlAlchemyBase):
    __tablename__ = "application_items"

    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), primary_key=True)
    ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingredients.id"), primary_key=True)

    quantity: Mapped[int] = mapped_column(Integer(), default=1, nullable=False)

    application: Mapped["Application"] = relationship(back_populates="products")
    ingredient: Mapped["Ingredient"] = relationship(back_populates="applications")


user_allergies = Table(
    "user_allergies",
    SqlAlchemyBase.metadata,
    Column("user_id", ForeignKey("users.id")),
    Column("ingredient_id", ForeignKey("ingredients.id"))
)


class OrderItem(SqlAlchemyBase):
    __tablename__ = "order_items"

    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), primary_key=True)
    dish_id: Mapped[int] = mapped_column(ForeignKey("dishes.id"), primary_key=True)

    quantity: Mapped[int] = mapped_column(Integer(), default=1, nullable=False)
    
    order: Mapped["Order"] = relationship(back_populates="dishes")
    dish: Mapped["Dish"] = relationship(back_populates="orders")


class MenuItem(SqlAlchemyBase):
    __tablename__ = "menu_items"

    menu_id: Mapped[int] = mapped_column(ForeignKey("menu.id"), primary_key=True)
    dish_id: Mapped[int] = mapped_column(ForeignKey("dishes.id"), primary_key=True)

    menu: Mapped["Menu"] = relationship(back_populates="items")
    dish: Mapped["Dish"] = relationship(back_populates="menu_occurrences")


class DishIngredient(SqlAlchemyBase):
    __tablename__ = "dish_ingredients"

    ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingredients.id"), primary_key=True)
    dish_id: Mapped[int] = mapped_column(ForeignKey("dishes.id"), primary_key=True)

    amount_thousandth_measure: Mapped[int] = mapped_column(Integer())  # в граммах/миллилитрах

    dish: Mapped["Dish"] = relationship(back_populates="ingredients")
    ingredient: Mapped["Ingredient"] = relationship(back_populates="used_in")


# Дурацкие ассоциации я их не знаю что, они появляются из неоткуда