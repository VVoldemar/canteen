from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List


class PurchaseSubscriptionRequest(BaseModel):
    days: int = Field(gt=0, le=90)
    id_order: int = Field(description="ID заказа-шаблона для абонемента")


class SubscriptionResponse(BaseModel):
    user_id: int
    subscription_start: Optional[datetime] = None
    subscription_days: int
    days_remaining: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class PurchaseSubscriptionResponse(BaseModel):
    subscription: SubscriptionResponse
    created_orders: int
    total_cost: int


class CancelSubscriptionResponse(BaseModel):
    refunded: int
    cancelled_orders: int