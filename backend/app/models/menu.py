from typing import List, TYPE_CHECKING
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import SqlAlchemyBase

if TYPE_CHECKING:
    from app.models.dish import Dish


class Menu(SqlAlchemyBase):
    __tablename__ = "menu"

    id: Mapped[int] = mapped_column(primary_key=True)    
    name: Mapped[str] = mapped_column(String())

    items: Mapped[List["MenuItem"]] = relationship(back_populates="menu", cascade="all, delete-orphan")
    
    @property
    def dishes(self) -> List["Dish"]:
        """Return the actual dish objects from menu items."""
        return [item.dish for item in self.items]