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
from app.models.associations import OrderItem
from app.core.enums import UserRole, OrderStatus

from app.schemas.auth import RegisterRequest
from app.schemas.subscription import SubscriptionResponse, PurchaseSubscriptionRequest, PurchaseSubscriptionResponse, CancelSubscriptionResponse
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
    ) -> PurchaseSubscriptionResponse:
        """Purchase a subscription based on an existing order template.
        
        Creates identical orders for N days ahead, deducting the total cost from user balance.
        """
        # Get the template order with its dishes
        stmt = (
            select(Order)
            .options(selectinload(Order.dishes).selectinload(OrderItem.dish))
            .where(Order.id == subscription_data.id_order)
        )
        order_result = await session.execute(stmt)
        template_order = order_result.scalar_one_or_none()

        if not template_order:
            raise HTTPException(status_code=404, detail="Заказ не найден")

        if template_order.user_id != user_id:
            raise HTTPException(status_code=403, detail="Этот заказ принадлежит другому пользователю")

        if template_order.status not in (OrderStatus.PAID, OrderStatus.READY, OrderStatus.SERVED):
            raise HTTPException(status_code=400, detail="Можно использовать только оплаченные или выданные заказы")

        if not template_order.dishes:
            raise HTTPException(status_code=400, detail="В заказе-шаблоне нет блюд")
        
        user = await self.get_by_id(session, user_id)
        
        if user.banned:
            raise HTTPException(status_code=400, detail="Заблокированные пользователи не могут покупать абонементы")

        sub_resp = self._calculate_subscription_response(user)
        if sub_resp.is_active:
            raise HTTPException(status_code=400, detail="У вас уже есть активный абонемент. Отмените текущий, чтобы оформить новый")

        order_cost = 0
        for item in template_order.dishes:
            order_cost += item.dish.price * item.quantity

        days = subscription_data.days
        total_cost = order_cost * days

        if user.balance < total_cost:
            raise HTTPException(
                status_code=400, 
                detail=f"Недостаточно средств. Нужно {total_cost}, на балансе {user.balance}"
            )

        try:
            user.balance -= total_cost

            now = datetime.now()
            created_orders_count = 0
            day_offset = 0
            weekdays_scheduled = 0

            while weekdays_scheduled < days:
                day_offset += 1
                order_date = now + timedelta(days=day_offset)
                # skip Saturday (5) and Sunday (6)
                if order_date.weekday() in (5, 6):
                    continue

                new_order = Order(
                    user_id=user_id,
                    ordered_at=order_date,
                    status=OrderStatus.PAID,
                    completed_at=None
                )
                session.add(new_order)
                await session.flush()

                for item in template_order.dishes:
                    order_item = OrderItem(
                        order_id=new_order.id,
                        dish_id=item.dish_id,
                        quantity=item.quantity
                    )
                    session.add(order_item)

                weekdays_scheduled += 1
                created_orders_count += 1

            user.subscription_start = now
            user.subscription_days = day_offset

            session.add(user)
            await session.commit()
            await session.refresh(user)

            return PurchaseSubscriptionResponse(
                subscription=self._calculate_subscription_response(user),
                created_orders=created_orders_count,
                total_cost=total_cost
            )

        except HTTPException:
            await session.rollback()
            raise
        except Exception as e:
            await session.rollback()
            logger.error(f"Subscription purchase error: {e}")
            raise HTTPException(status_code=500, detail="Не удалось оформить абонемент")

    async def cancel_subscription(
        self,
        session: AsyncSession,
        user_id: int,
    ) -> CancelSubscriptionResponse:
        """Cancel active subscription. Refund cost of future orders (from tomorrow onwards) and cancel them."""
        user = await self.get_by_id(session, user_id)
        sub = self._calculate_subscription_response(user)

        if not sub.is_active:
            raise HTTPException(status_code=400, detail="У вас нет активного абонемента")

        tomorrow_start = datetime.combine(
            (datetime.now() + timedelta(days=1)).date(),
            datetime.min.time(),
        )
        stmt = (
            select(Order)
            .options(selectinload(Order.dishes).selectinload(OrderItem.dish))
            .where(
                Order.user_id == user_id,
                Order.status == OrderStatus.PAID,
                Order.ordered_at >= tomorrow_start,
            )
        )
        result = await session.execute(stmt)
        future_orders = result.scalars().all()

        refund_total = 0
        cancelled_count = 0

        for order in future_orders:
            order_cost = sum(item.dish.price * item.quantity for item in order.dishes)
            refund_total += order_cost
            order.status = OrderStatus.CANCELLED
            cancelled_count += 1

        user.balance += refund_total
        user.subscription_start = None
        user.subscription_days = 0

        try:
            session.add(user)
            await session.commit()
            await session.refresh(user)
        except Exception as e:
            await session.rollback()
            logger.error(f"Subscription cancel error: {e}")
            raise HTTPException(status_code=500, detail="Не удалось отменить абонемент")

        return CancelSubscriptionResponse(
            refunded=refund_total,
            cancelled_orders=cancelled_count,
        )

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