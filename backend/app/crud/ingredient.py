from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
import logging
from typing import Optional

from app.core.enums import Measures
from app.crud.paginating import paginate
from app.schemas.paginating import PaginationParams, PaginatedResponse
from app.models.dish import Ingredient
from app.schemas.dish import (
    IngredientResponse,
    CreateIngredientRequest,
    UpdateIngredientRequest
)

logger = logging.getLogger(__name__)

class IngredientCRUD:
    def __init__(self, model):
        self.model = model
    
    async def get_by_id(self, session: AsyncSession, id: int) -> Ingredient:
        """Get a ingredient by ID."""
        stmt = select(self.model).where(self.model.id == id)
        result = await session.execute(stmt)
        ingredient = result.scalar_one_or_none()
        
        if not ingredient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ingredient not found"
            )
        return ingredient
    
    async def get_all_paginated(
        self,
        session: AsyncSession,
        params: PaginationParams,
        search: Optional[str] = None
    ) -> PaginatedResponse[IngredientResponse]:
        """Get paginated list of all ingredients."""

        query = select(self.model).order_by(self.model.id)
        
        if search:
            query = query.where(self.model.name.ilike(f"%{search}%"))

        return await paginate(session, query, params)
    
    async def create(self, session: AsyncSession, new_ingredient: CreateIngredientRequest) -> Ingredient:
        """Create a new ingredient."""
        try:
            stmt = select(self.model).where(self.model.name == new_ingredient.name)
            if (await session.execute(stmt)).scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ingredient already exists"
                )
            
            db_ingredient = self.model(
                name=new_ingredient.name,
                price=new_ingredient.price,
                measure=new_ingredient.measure
            )
            
            session.add(db_ingredient)
            await session.commit()
            await session.refresh(db_ingredient)
            return db_ingredient

        except HTTPException:
            raise
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating ingredient: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create ingredient"
            )
        
    async def update(
        self, 
        session: AsyncSession, 
        id: int, 
        update_data_in: UpdateIngredientRequest
    ) -> Ingredient:
        """Update an existing ingredient."""
        update_data = update_data_in.model_dump(exclude_unset=True, exclude_none=True)
        
        if not update_data:
            return await self.get_by_id(session, id)
            
        try:
            stmt = (
                update(self.model)
                .where(self.model.id == id)
                .values(**update_data)
                .execution_options(synchronize_session="fetch")
            )
            
            result = await session.execute(stmt)
            
            if result.rowcount == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ingredient not found"
                )
            
            await session.commit()
            return await self.get_by_id(session, id)
            
        except IntegrityError:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Update constraint violation"
            )
    
    async def delete(
        self,
        session: AsyncSession,
        id: int
    ) -> bool:
        """Delete a ingredient by ID."""
        try:
            stmt = select(self.model).where(self.model.id == id)
            result = await session.execute(stmt)
            ingredient = result.scalar_one_or_none()

            if not ingredient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail='Ingredient not found'
                )
            
            await session.delete(ingredient)
            await session.commit()
    
            logger.info(f'Ingredient {id} deleted successfully')
            return True

        except HTTPException:
            raise
        except Exception as e:
            await session.rollback() 
            logger.error(f'Error deleting ingredient with id {id}: {e}')
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail='Failed to delete ingredient'
            )
        
ingredients_manager = IngredientCRUD(Ingredient)