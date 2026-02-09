from datetime import datetime
from typing import List
from sqlalchemy import  DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import OrderStatus
from app.models.base import SqlAlchemyBase


class Notification(SqlAlchemyBase):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=func.now(), server_default=func.now())
    title: Mapped[str] = mapped_column()
    body: Mapped[str] = mapped_column()
    read: Mapped[bool] = mapped_column()
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
