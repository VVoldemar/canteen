from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, or_, and_, cast, String, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from typing import Optional, List, Union
from datetime import datetime, timedelta
from fastapi import HTTPException, status
import logging

from app.crud.paginating import paginate
from app.schemas.paginating import PaginationParams, PaginatedResponse

from app.models.user import User
from app.models.dish import Ingredient
from app.models.order import Order 
from app.core.enums import UserRole, OrderStatus

from app.schemas.auth import RegisterRequest
from app.schemas.subscription import SubscriptionResponse, PurchaseSubscriptionRequest
from app.schemas.user import (
    UserResponse, 
    UpdateUserRequest, 
    AdminUpdateUserRequest,
)

from app.core.security.password import hash_password


logger = logging.getLogger(__name__)

class UserCRUD:
    def __init__(self, model):
        self.model = model

    async def get_by_email(self, session: AsyncSession, email: str) -> User:
        stmt = select(self.model).where(self.model.email == email)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user

    async def get_by_id(self, session: AsyncSession, id: int) -> User:
        stmt = select(self.model).where(self.model.id == id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user

    async def get_all_paginated(
        self,
        session: AsyncSession,
        params: PaginationParams,
        role: Optional[UserRole] = None,
        search: Optional[str] = None
    ) -> PaginatedResponse[UserResponse]:
        query = select(self.model).order_by(self.model.id)
        
        if role:
            query = query.where(self.model.role == role)
        
        if search:
            search_term = search.strip()
            if not search_term:
                return await paginate(session, query, params)
            
            search_words = [word for word in search_term.split() if word]
            
            if search_words:
                word_conditions = []
                for word in search_words:
                    word_lower = word.lower()
                    word_upper = word.upper()
                    word_title = word.title()
                    
                    conditions = [
                        # by ID
                        cast(self.model.id, String).like(f'%{word}%'),
                    ]
                    
                    for text_field in [self.model.name, self.model.surname, func.coalesce(self.model.patronymic, '')]:
                        conditions.extend([
                            text_field.like(f'%{word}%'),
                            text_field.like(f'%{word_lower}%'),
                            text_field.like(f'%{word_upper}%'),
                            text_field.like(f'%{word_title}%'),
                        ])
                    
                    word_conditions.append(or_(*conditions))
                # all words should be found (each at least in one field)
                query = query.where(and_(*word_conditions))

        return await paginate(session, query, params)

    async def create(self, session: AsyncSession, new_user: RegisterRequest) -> User:
        try:
            stmt = select(self.model).where(self.model.email == new_user.email)
            if (await session.execute(stmt)).scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User already exists"
                )
            hashed_password = hash_password(new_user.password)
            
            db_user = self.model(
                name=new_user.name,
                surname=new_user.surname,
                email=new_user.email,
                patronymic=new_user.patronymic,
                password=hashed_password,
                balance=0, 
                role=UserRole.STUDENT 
            )
            
            session.add(db_user)
            await session.commit()
            await session.refresh(db_user)
            return db_user

        except HTTPException:
            raise
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating user: {e}")
            raise HTTPException(status_code=500, detail="Failed to create user")

    async def update(
        self, 
        session: AsyncSession, 
        id: int, 
        update_data_in: Union[UpdateUserRequest, AdminUpdateUserRequest]
    ) -> User:
        
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
                raise HTTPException(status_code=404, detail="User not found")
            
            await session.commit()
            return await self.get_by_id(session, id)
            
        except IntegrityError:
            await session.rollback()
            raise HTTPException(status_code=400, detail="Update constraint violation")


    async def update_balance(
        self,
        session: AsyncSession,
        user_id: int, 
        new_money: int,
    ) -> None:
        """
        Обновляет баланс.
        """
        try:
            stmt = (
                update(self.model)
                .where(self.model.id == user_id)
                .values(balance=self.model.balance + new_money) 
                .execution_options(synchronize_session="fetch")
            )
            await session.execute(stmt)
            await session.commit()
            return 
        except Exception as e:
            logger.error(f"Balance update error: {e}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Не получилось обновить баланс!")


    async def purchase_subscription(
        self, 
        session: AsyncSession, 
        user_id: int, 
        subscription_data: PurchaseSubscriptionRequest
    ) -> SubscriptionResponse:
        
        stmt = select(Order).where(Order.id == subscription_data.id_order)
        order_result = await session.execute(stmt)
        order = order_result.scalar_one_or_none()

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.user_id != user_id:
            raise HTTPException(status_code=403, detail="This order belongs to another user")

        if order.status != OrderStatus.PAID:
            raise HTTPException(status_code=400, detail="Order is not paid")
        
        user = await self.get_by_id(session, user_id)
        
        if user.banned:
            raise HTTPException(status_code=400, detail="Banned users cannot purchase subscriptions")

        now = datetime.now()
        days_to_add = subscription_data.days
        
        if user.subscription_start and user.subscription_days:
            current_end_date = user.subscription_start + timedelta(days=user.subscription_days)
            if current_end_date > now:
                user.subscription_days += days_to_add
            else:
                
                user.subscription_start = now
                user.subscription_days = days_to_add
        else:
            
            user.subscription_start = now
            user.subscription_days = days_to_add       
        try: 
            
            session.add(user)
            await session.commit()
            await session.refresh(user)
        except Exception as e:
            await session.rollback()
            logger.error(f"Subscription update error: {e}")
            raise HTTPException(status_code=500, detail="Failed to update subscription")
        
        return self._calculate_subscription_response(user)

    async def get_subscription_info(self, session: AsyncSession, user_id: int) -> SubscriptionResponse:
        user = await self.get_by_id(session, user_id)
        return self._calculate_subscription_response(user)

    def _calculate_subscription_response(self, user: User) -> SubscriptionResponse:
        """Helper for subscription response"""
        is_active = False
        days_remaining = 0
        
        sub_start = user.subscription_start
        sub_days = user.subscription_days if user.subscription_days else 0

        if user.subscription_start and user.subscription_days:
            end_date = user.subscription_start + timedelta(days=user.subscription_days)
            now = datetime.now()
            if now < end_date:
                is_active = True
                days_remaining = (end_date - now).days
        
        return SubscriptionResponse(
            user_id=user.id,
            subscription_start=sub_start,
            subscription_days=sub_days,
            days_remaining=days_remaining,
            is_active=is_active
        )

    async def get_allergies(self, session: AsyncSession, user_id: int) -> List[Ingredient]:
        stmt = (
            select(self.model)
            .options(selectinload(self.model.ingredient_allergies))
            .where(self.model.id == user_id)
        )
        user = (await session.execute(stmt)).scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        return user.ingredient_allergies

    async def add_allergy(self, session: AsyncSession, user_id: int, ingredient_id: int) -> bool:
        
        stmt = (
            select(self.model)
            .options(selectinload(self.model.ingredient_allergies))
            .where(self.model.id == user_id)
        )
        user = (await session.execute(stmt)).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        ingredient = await session.get(Ingredient, ingredient_id)
        if not ingredient:
            raise HTTPException(status_code=404, detail="Ingredient not found")

        if any(ing.id == ingredient_id for ing in user.ingredient_allergies):
            raise HTTPException(status_code=400, detail="Allergy already exists")
            
        user.ingredient_allergies.append(ingredient)
        await session.commit()
        return True

    async def remove_allergy(self, session: AsyncSession, user_id: int, ingredient_id: int) -> bool:
        stmt = (
            select(self.model)
            .options(selectinload(self.model.ingredient_allergies))
            .where(self.model.id == user_id)
        )
        user = (await session.execute(stmt)).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        allergy_to_remove = next(
            (ing for ing in user.ingredient_allergies if ing.id == ingredient_id), 
            None
        )
        
        if not allergy_to_remove:
            raise HTTPException(status_code=404, detail="Allergy not found in user list")
            
        user.ingredient_allergies.remove(allergy_to_remove)
        await session.commit()
        return True

    async def switch_ban(self, session: AsyncSession, user_id: int) -> bool:
        user = await self.get_by_id(session, user_id)
        user.banned = not user.banned
        session.add(user) 
        await session.commit()
        await session.refresh(user)
        return user.banned


users_manager = UserCRUD(User)