from typing import List
from sqlalchemy import  DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import OrderStatus
from app.models.base import SqlAlchemyBase


class Order(SqlAlchemyBase):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    datetime: Mapped[str] = mapped_column(DateTime())
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PAID, nullable=False)

    dishes: Mapped[List["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    orderer: Mapped["User"] = relationship(back_populates="orders")
    # subscribed_user: Mapped["User"] = relationship(back_populates="subscription_order")