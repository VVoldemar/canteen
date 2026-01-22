from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class PurchaseSubscriptionRequest(BaseModel):
    days: int = Field(ge=0)


class SubscriptionResponse(BaseModel):
    user_id: int
    subscription_start: datetime
    subscription_days: int
    days_remaining: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)