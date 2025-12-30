from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import SqlAlchemyBase


class Review(SqlAlchemyBase):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    datetime: Mapped[DateTime] = mapped_column(DateTime(), default=datetime.now, nullable=False)
    content: Mapped[str] = mapped_column(String())

    user: Mapped["User"] = relationship(back_populates="reviews")
