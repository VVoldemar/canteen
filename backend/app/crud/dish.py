from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
import logging

from app.crud.paginating import paginate
from app.schemas.paginating import PaginationParams, PaginatedResponse
from app.models.dish import Dish
from app.schemas.dish import (
    DishResponse,
    CreateDishRequest,
    UpdateDishRequest
)

logger = logging.getLogger(__name__)

class DishCRUD:
    def __init__(self, model):
        self.model = model
    
    async def get_by_id(self, session: AsyncSession, id: int) -> Dish:
        """Get a dish by ID."""
        stmt = select(self.model).where(self.model.id == id)
        result = await session.execute(stmt)
        dish = result.scalar_one_or_none()
        
        if not dish:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dish not found"
            )
        return dish
    
    async def get_all_paginated(
        self,
        session: AsyncSession,
        params: PaginationParams
    ) -> PaginatedResponse[DishResponse]:
        """Get paginated list of all dishes."""
        query = select(self.model).order_by(self.model.id)
        return await paginate(session, query, params)
    
    async def create(self, session: AsyncSession, new_dish: CreateDishRequest) -> Dish:
        """Create a new dish."""
        try:
            stmt = select(self.model).where(self.model.name == new_dish.name)
            if (await session.execute(stmt)).scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Dish already exists"
                )
            
            db_dish = self.model(
                name=new_dish.name,
                price=new_dish.price,
                ingredients=new_dish.ingredients
            )
            
            session.add(db_dish)
            await session.commit()
            await session.refresh(db_dish)
            return db_dish

        except HTTPException:
            raise
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating dish: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create dish"
            )
        
    async def update(
        self, 
        session: AsyncSession, 
        id: int, 
        update_data_in: UpdateDishRequest
    ) -> Dish:
        """Update an existing dish."""
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
                    detail="Dish not found"
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
        """Delete a dish by ID."""
        try:
            stmt = select(self.model).where(self.model.id == id)
            result = await session.execute(stmt)
            dish = result.scalar_one_or_none()

            if not dish:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail='Dish not found'
                )
            
            await session.delete(dish)
            await session.commit()
    
            logger.info(f'Dish {id} deleted successfully')
            return True

        except HTTPException:
            raise
        except Exception as e:
            await session.rollback() 
            logger.error(f'Error deleting dish with id {id}: {e}')
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail='Failed to delete dish'
            )
        
dish_manager =DishCRUD(Dish)