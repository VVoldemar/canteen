from datetime import datetime, time, date
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from fastapi import HTTPException, status
import logging

from app.crud.paginating import paginate
from app.schemas.paginating import PaginationParams, PaginatedResponse
from app.core.enums import OrderStatus

from app.models.application import Application
from app.models.associations import ApplicationItem
from app.models.dish import Ingredient
from app.schemas.application import (
    CreateApplicationRequest, 
    ApplicationResponse
)

logger = logging.getLogger(__name__)

class ApplicationCRUD:
    def __init__(self, model):
        self.model = model

    async def get_by_id(self, session: AsyncSession, application_id: int) -> Application:
        """
        Get an application with product details.
        Loading: Application -> ApplicationItem -> Ingredient
        """
        stmt = (
            select(self.model)
            .options(
                selectinload(self.model.products).joinedload(ApplicationItem.ingredient)
            )
            .where(self.model.id == application_id)
        )
        result = await session.execute(stmt)
        application = result.scalar_one_or_none()
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        return application

    async def get_all_paginated(
        self,
        session: AsyncSession,
        params: PaginationParams,
        status: Optional[OrderStatus] = None
    ) -> PaginatedResponse[ApplicationResponse]:
        """
        Get a list of applications with status filtering.
        """
        query = select(self.model).order_by(self.model.datetime.desc())

        if status:
            query = query.where(self.model.status == status)

        return await paginate(session, query, params)

    async def create(
        self, 
        session: AsyncSession, 
        user_id: int, 
        application_in: CreateApplicationRequest
    ) -> Application:
        """
        Create a purchase application.
        """
        try:
            if not application_in.products:
                raise HTTPException(status_code=400, detail="Application must contain products")

            new_application = self.model(
                user_id=user_id,
                datetime=datetime.now(),
                status=OrderStatus.PAID 
            )
            session.add(new_application)
            await session.flush()

            ingredient_ids = [item.ingredient_id for item in application_in.products]
            stmt = select(Ingredient).where(Ingredient.id.in_(ingredient_ids))
            found_ingredients = (await session.execute(stmt)).scalars().all()
            
            if len(found_ingredients) != len(set(ingredient_ids)):
                raise HTTPException(status_code=400, detail="One or more ingredients not found")

            for item in application_in.products:
                app_item = ApplicationItem(
                    application_id=new_application.id,
                    ingredient_id=item.ingredient_id,
                    quantity=item.quantity
                )
                session.add(app_item)
            
            await session.commit()
            
            return await self.get_by_id(session, new_application.id)

        except HTTPException:
            await session.rollback()
            raise
        except Exception as e:
            await session.rollback()
            logger.error(f"Create application error: {e}")
            raise HTTPException(status_code=500, detail="Failed to create application")

    async def approve(self, session: AsyncSession, application_id: int) -> Application:
        """
        Approve an application.
        Changes status to SERVED (as an analog to Approved/Done in YAML).
        """
        application = await self.get_by_id(session, application_id)
        
        if application.status != OrderStatus.PAID:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot approve application with status {application.status}"
            )
        
        application.status = OrderStatus.SERVED
        await session.commit()
        return application

    async def reject(
        self, 
        session: AsyncSession, 
        application_id: int, 
        reason: Optional[str] = None
    ) -> Application:
        """
        Reject an application.
        Changes status to CANCELLED.
        """
        application = await self.get_by_id(session, application_id)
        
        if application.status != OrderStatus.PAID:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot reject application with status {application.status}"
            )
        
        application.status = OrderStatus.CANCELLED
        if hasattr(application, 'rejection_reason') and reason:
            application.rejection_reason = reason
            
        await session.commit()
        return application

applications_manager = ApplicationCRUD(Application)