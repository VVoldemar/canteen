from datetime import datetime
from typing import List, Optional
from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import OrderStatus
from app.models.base import SqlAlchemyBase


class Application(SqlAlchemyBase):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), server_default=func.now())
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PAID)
    rejection_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    applicant: Mapped["User"] = relationship(back_populates="applications")
    products: Mapped[List["ApplicationItem"]] = relationship(back_populates="application", cascade="all, delete-orphan")
