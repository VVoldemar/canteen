from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    rating: Optional[int] = Field(None, ge=0, le=10)
    content: Optional[str] = None
    datetime: datetime


# class PaginatedReviewResponse(BaseModel):
#     items: List[ReviewResponse]
#     total: int
#     page: int
#     pages: int


class CreateReviewRequest(BaseModel):
    rating: Optional[int] = Field(None, ge=0, le=10)
    content: str


class UpdateReviewRequest(BaseModel):
    rating: Optional[int] = Field(None, ge=0, le=10)
    content: Optional[str] = None