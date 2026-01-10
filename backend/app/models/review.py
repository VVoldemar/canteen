from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import SqlAlchemyBase


class Review(SqlAlchemyBase):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    dish_id: Mapped[int] = mapped_column(ForeignKey("dishes.id"))
    rating: Mapped[int | None] = mapped_column(Integer())
    datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=func.now(), server_default=func.now())
    content: Mapped[str] = mapped_column(String())

    user: Mapped["User"] = relationship(back_populates="reviews")
    dish: Mapped["Dish"] = relationship()
