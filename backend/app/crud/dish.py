from requests import session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
import logging
from typing import Optional

from app.crud.paginating import paginate
from app.schemas.paginating import PaginationParams, PaginatedResponse
from app.models.dish import Dish
from app.models.associations import DishIngredient
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
        stmt = (
        select(self.model)
        .options(
            selectinload(self.model.ingredients) 
            .selectinload(DishIngredient.ingredient) 
        )
        .where(self.model.id == id)
    )
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
        params: PaginationParams,
        search: Optional[str] = None
    ) -> PaginatedResponse[DishResponse]:
        """Get paginated list of all dishes."""

        query = select(self.model).order_by(self.model.id)

        if search:
            query = query.where(self.model.name.ilike(f"%{search}%"))

        return await paginate(session, query, params)
    
    async def create(self, session: AsyncSession, new_dish: CreateDishRequest, image_url: str = None) -> Dish:
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
                image_url=image_url if image_url else None
            )
            
            session.add(db_dish)
            
            await session.flush() 

            for ing_data in new_dish.ingredients:
                new_relation = DishIngredient(
                    dish_id=db_dish.id,
                    ingredient_id=ing_data.ingredient_id,
                    amount_thousandth_measure=ing_data.amount_thousandth_measure
                )
                session.add(new_relation)
                
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
        update_data: UpdateDishRequest, 
        image_href: str = None
    ) -> Dish:
        """Update an existing dish."""
        try:
            dish = await self.get_by_id(session, id)

            if not dish:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Dish not found"
                )

            if update_data.name is not None:
                dish.name = update_data.name

            if update_data.price is not None:
                dish.price = update_data.price

            if image_href is not None:
                dish.image_url = image_href

            if update_data.ingredients is not None:
                from sqlalchemy import delete
                await session.execute(
                    delete(DishIngredient).where(DishIngredient.dish_id == id)
                )

                for ing_data in update_data.ingredients:
                    new_relation = DishIngredient(
                        dish_id=id,
                        ingredient_id=ing_data.ingredient_id,
                        amount_thousandth_measure=ing_data.amount_thousandth_measure
                    )
                    session.add(new_relation)

            await session.commit() 

            return await self.get_by_id(session, id)

        except HTTPException:
            await session.rollback()
            raise
        except Exception as e:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update dish: {str(e)}"
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
        
dish_manager = DishCRUD(Dish)
