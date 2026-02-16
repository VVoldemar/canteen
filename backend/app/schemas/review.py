from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.annotations import Rating
from app.schemas.user import UserShortResponse


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    user: UserShortResponse
    dish_id: int
    rating: Optional[Rating] = None
    content: Optional[str] = None
    datetime: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CreateReviewRequest(BaseModel):
    rating: Optional[Rating] = None
    content: str 


class UpdateReviewRequest(BaseModel):
    rating: Optional[Rating] = None
    content: Optional[str] = None