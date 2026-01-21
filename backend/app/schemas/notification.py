from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class NotificationResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    title: str
    body: str
    read: bool
    
    model_config = ConfigDict(from_attributes=True)


class CreateNotificationRequest(BaseModel):
    user_id: Optional[int] = None
    title: str = Field(min_length=1)
    body: str = Field(min_length=1)