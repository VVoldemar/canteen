from datetime import datetime
from typing import List
from sqlalchemy.orm import Mapped, mapped_column, relationship 
from sqlalchemy import String, DateTime, Enum, Boolean, Integer

from app.core.enums import UserRole
from app.models.base import SqlAlchemyBase
    

class User(SqlAlchemyBase):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(), nullable=False)
    surname: Mapped[str] = mapped_column(String(), nullable=False)
    patronymic: Mapped[str | None] = mapped_column(String())
    password: Mapped[str] = mapped_column(String(), nullable=False)
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False)
    salt: Mapped[str] = mapped_column(String(), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    banned: Mapped[bool] = mapped_column(Boolean(), default=False, nullable=False)
    
    subscription_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    subscription_days: Mapped[int] = mapped_column(Integer(), default=0)
    # subscription_order: Mapped[List["Order"]] = relationship(back_populates="subscribed_user")

    ingredient_allergies: Mapped[List["Ingredient"]] = relationship(secondary="user_allergies", back_populates="allergic_users")
    orders: Mapped[List["Order"]] = relationship(back_populates="orderer", cascade="all, delete-orphan")
    reviews: Mapped[List["Review"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    applications: Mapped[List["Application"]] = relationship(back_populates="applicant", cascade="all")
