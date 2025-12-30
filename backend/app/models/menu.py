from typing import List
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import SqlAlchemyBase


class Menu(SqlAlchemyBase):
    __tablename__ = "menu"

    id: Mapped[int] = mapped_column(primary_key=True)    
    name: Mapped[str] = mapped_column(String())

    items: Mapped[List["MenuItem"]] = relationship(back_populates="menu", cascade="all, delete-orphan")