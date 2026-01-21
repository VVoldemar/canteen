from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from annotations import Rating


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    rating: Optional[Rating] = None
    content: Optional[str] = None
    datetime: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CreateReviewRequest(BaseModel):
    rating: Rating = None
    content: str 


class UpdateReviewRequest(BaseModel):
    rating: Optional[Rating] = None
    content: Optional[str] = None