from typing import Optional, List
from datetime import date
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.dish import DishResponse

class Period(BaseModel):
    from_: date = Field(alias="from")
    to: date

    model_config = ConfigDict(populate_by_name=True)


class PaymentStatisticsResponse(BaseModel):
    total_amount: int
    orders_count: int
    subscriptions_count: int
    average_order_amount: int
    period: Period

    model_config = ConfigDict(from_attributes=True)


class AttendanceStatisticsByDay(BaseModel):
    date: date
    served: int
    paid: int


class AttendanceStatisticsResponse(BaseModel):
    total_served: int
    total_paid: int
    attendance_rate: float
    
    by_date: List[AttendanceStatisticsByDay]


class DishStatistic(BaseModel):
    dish: DishResponse
    orders_count: int
    average_rating: Optional[float] = None
    reviews_count: int


class DishStatisticsResponse(BaseModel):
    dishes: List[DishStatistic]

    model_config = ConfigDict(from_attributes=True)