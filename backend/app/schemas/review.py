from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

from annotations import Rating


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    rating: Optional[Rating] = None
    content: Optional[str] = None
    datetime: datetime


# class PaginatedReviewResponse(BaseModel):
#     items: List[ReviewResponse]
#     total: int
#     page: int
#     pages: int


class CreateReviewRequest(BaseModel):
    rating: Optional[Rating] = None
    content: str


class UpdateReviewRequest(BaseModel):
    rating: Optional[Rating] = None
    content: Optional[str] = None