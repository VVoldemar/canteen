from typing import Optional, List, Union
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
import logging

from app.crud.paginating import paginate
from app.schemas.paginating import PaginationParams, PaginatedResponse
from app.models.review import Review 
from app.models.dish import Dish
from app.schemas.review import (
    ReviewResponse, 
    CreateReviewRequest, 
    UpdateReviewRequest
)

logger = logging.getLogger(__name__)

class ReviewCRUD:
    def __init__(self, model):
        self.model = model

    async def get_by_id(self, session: AsyncSession, review_id: int) -> Review:
        """Get a review by ID."""
        stmt = select(self.model).where(self.model.id == review_id)
        result = await session.execute(stmt)
        review = result.scalar_one_or_none()
        
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        return review

    async def get_all_paginated(
        self,
        session: AsyncSession,
        params: PaginationParams,
        dish_id: Optional[int] = None
    ) -> PaginatedResponse[ReviewResponse]:
        """
        Get a list of reviews.
        dish_id filter is required to get reviews for a specific dish,
        but optional if we want to see "all recent reviews".
        """
        query = select(self.model).options(
            selectinload(self.model.user),
        ).order_by(self.model.datetime.desc())

        if dish_id:
            query = query.where(self.model.dish_id == dish_id)

        return await paginate(session, query, params)

    async def create(
        self, 
        session: AsyncSession, 
        user_id: int,
        dish_id: int,  
        review_in: CreateReviewRequest
    ) -> Review:
        """
        Create a review for a specific dish.
        """
        try:
            dish = await session.get(Dish, dish_id)
            if not dish:
                raise HTTPException(status_code=404, detail="Dish not found")

            new_review = self.model(
                user_id=user_id,
                dish_id=dish_id,
                rating=review_in.rating,
                content=review_in.content,
                datetime=datetime.now()
            )
            
            session.add(new_review)
            await session.commit()
            await session.refresh(new_review)
            return new_review

        except HTTPException:
            await session.rollback()
            raise
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating review: {e}")
            raise HTTPException(status_code=500, detail="Failed to create review")

    async def update(
        self, 
        session: AsyncSession, 
        review_id: int, 
        review_in: UpdateReviewRequest
    ) -> Review:
        """
        Update a review (without permission checks, only existence check).
        """
        update_data = review_in.model_dump(exclude_unset=True, exclude_none=True)
        
        if not update_data:
            return await self.get_by_id(session, review_id)

        stmt = (
            update(self.model)
            .where(self.model.id == review_id)
            .values(**update_data)
            .execution_options(synchronize_session="fetch")
        )
        
        result = await session.execute(stmt)
        
        if result.rowcount == 0:
             raise HTTPException(status_code=404, detail="Review not found")
             
        await session.commit()
        return await self.get_by_id(session, review_id)

    async def delete(self, session: AsyncSession, review_id: int) -> bool:
        """
        Delete a review.
        """
        stmt = delete(self.model).where(self.model.id == review_id)
        result = await session.execute(stmt)
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Review not found")
            
        await session.commit()
        return True

reviews_manager = ReviewCRUD(Review)