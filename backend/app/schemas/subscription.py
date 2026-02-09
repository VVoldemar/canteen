from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class PurchaseSubscriptionRequest(BaseModel):
    days: int = Field(gt=0)
    id_order: int


class SubscriptionResponse(BaseModel):
    user_id: int
    subscription_start: datetime
    subscription_days: int
    days_remaining: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)