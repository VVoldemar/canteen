from datetime import datetime
from typing import Optional
from sqlalchemy import  DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import UserRole
from app.models.base import SqlAlchemyBase


class Notification(SqlAlchemyBase):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=func.now(), server_default=func.now())
    title: Mapped[str] = mapped_column()
    body: Mapped[str] = mapped_column()
    read: Mapped[bool] = mapped_column()

    role: Mapped[Optional[UserRole]] = mapped_column(Enum(UserRole, native_enum=False), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
