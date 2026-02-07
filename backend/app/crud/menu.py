from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
import logging

from app.crud.paginating import paginate
from app.schemas.paginating import PaginationParams, PaginatedResponse
from app.models.associations import MenuItem
from app.models.menu import Menu

from app.schemas.menu import CreateMenuRequest, UpdateMenuRequest, MenuResponse

logger = logging.getLogger(__name__)

class MenuCRUD:
    def __init__(self, model: Menu):
        self.model = model 
    

    async def get_all(self, session: AsyncSession) -> Menu:
        stmt = select(self.model)
        result = await session.execute(stmt)
        return result.scalars()
    
    async def get_by_id(self, session: AsyncSession, id: int) -> Menu:
        """Get a menu by ID with items preloaded."""
        
        stmt = (
            select(self.model)
            .options(selectinload(self.model.items))
            .where(self.model.id == id)
        )

        result = await session.execute(stmt)
        menu = result.scalar_one_or_none()

        if not menu:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Menu not found"
            )

        return menu
    
    async def get_all_paginated(
        self,
        session: AsyncSession,
        params: PaginationParams
    ) -> PaginatedResponse[MenuResponse]:
        """Get paginated list of all menus."""
        query = select(self.model).order_by(self.model.id)
        return await paginate(session, query, params)
    
    async def create(self, session: AsyncSession, obj_in: CreateMenuRequest) -> Menu:
        """Создание меню """

        stmt_check = select(self.model).where(self.model.name == obj_in.name)
        if (await session.execute(stmt_check)).scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Menu already exists")

        try:

            db_menu = self.model(name=obj_in.name)
            session.add(db_menu)

            await session.flush()
            if obj_in.dish_ids:
                for d_id in obj_in.dish_ids:
                    menu_item = MenuItem(
                        menu_id=db_menu.id,
                        dish_id=d_id
                    )
                    session.add(menu_item)

            await session.commit()

            stmt_final = (
                select(self.model)
                .options(
                    selectinload(self.model.items) 
                    .selectinload(MenuItem.dish)   
                )
                .where(self.model.id == db_menu.id)
            )
            result = await session.execute(stmt_final)
            return result.scalar_one()

        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating menu: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")
        
    async def update(
        self, 
        session: AsyncSession, 
        id: int, 
        update_data_in: UpdateMenuRequest
    ) -> Menu:
        """Update an existing menu."""
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
                    detail="Menu not found"
                )
            
            await session.commit()
            return await self.get_by_id(session, id)
            
        except IntegrityError:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Update constraint violation"
            )
    
    async def delete(self, session: AsyncSession, id: int) -> bool:
        """Delete a menu by ID."""
        try:
            stmt = select(self.model).where(self.model.id == id)
            result = await session.execute(stmt)
            menu = result.scalar_one_or_none()

            if not menu:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail='Menu not found'
                )
            await session.delete(menu)
            await session.commit()
    
            logger.info(f'Menu {id} deleted successfully')
            return True

        except HTTPException:
            raise
        except Exception as e:
            await session.rollback() 
            logger.error(f'Error deleting menu with id {id}: {e}')
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail='Failed to delete menu'
            )

menu_manager = MenuCRUD(Menu)