from datetime import datetime
from typing import List
from sqlalchemy import DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import OrderStatus
from app.models.base import SqlAlchemyBase


class Application(SqlAlchemyBase):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    datetime: Mapped[datetime] = mapped_column(DateTime(), default=datetime.now())

    products: Mapped[List["ApplicationItem"]] = relationship(back_populates="application", cascade="all, delete-orphan")

    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PAID)