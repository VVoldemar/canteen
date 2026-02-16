from datetime import date, datetime, time
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from fastapi import HTTPException, status
import logging

from app.crud.paginating import paginate
from app.crud.notification import notifications_manager

from app.models.order import Order
from app.models.associations import OrderItem
from app.models.dish import Dish
from app.models.user import User

from app.core.enums import OrderStatus, UserRole
from app.schemas.order import CreateOrderRequest, OrderResponse
from app.schemas.paginating import PaginationParams, PaginatedResponse
from app.schemas.notification import CreateNotificationRequest

logger = logging.getLogger(__name__)

class OrderCRUD:
    def __init__(self, model):
        self.model: Order = model

    async def get_by_id(self, session: AsyncSession, order_id: int) -> Order:
        """Получить заказ по ID с подгрузкой блюд."""
        stmt = (
            select(self.model)
            .options(
                selectinload(self.model.dishes).selectinload(OrderItem.dish),
                joinedload(self.model.orderer) 
            )
            .where(self.model.id == order_id)
        )
        result = await session.execute(stmt)
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order

    async def get_all_paginated(
        self,
        session: AsyncSession,
        params: PaginationParams,
        user_id: Optional[int] = None,
        order_status: Optional[OrderStatus] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> PaginatedResponse[OrderResponse]:
        """
        Получить список заказов с фильтрацией и пагинацией.
        """
        query = select(self.model).options(
            selectinload(self.model.dishes).selectinload(OrderItem.dish),
            selectinload(self.model.orderer),
        ).order_by(self.model.ordered_at.desc())

        if user_id:
            query = query.where(self.model.user_id == user_id)
        
        if order_status:
            query = query.where(self.model.status == order_status)
            
        if date_from:
            dt_from = datetime.combine(date_from, time.min)
            query = query.where(self.model.ordered_at >= dt_from)
            
        if date_to:
            dt_to = datetime.combine(date_to, time.max)
            query = query.where(self.model.ordered_at <= dt_to)

        return await paginate(session, query, params)

    async def create(
        self, 
        session: AsyncSession, 
        user: User, 
        order_in: CreateOrderRequest
    ) -> Order:
        """
        Создать новый заказ.
        """
        try:
            if not order_in.dishes:
                raise HTTPException(status_code=400, detail="Order must contain dishes")
            
            dish_ids = [item.dish_id for item in order_in.dishes]
            stmt = select(Dish).where(Dish.id.in_(dish_ids))
            result = await session.execute(stmt)
            
            found_dishes = {d.id: d for d in result.scalars().all()}
            
            if len(found_dishes) != len(set(dish_ids)):
                missing_ids = set(dish_ids) - set(found_dishes.keys())
                raise HTTPException(status_code=400, detail=f"Dishes not found: {missing_ids}")
            
            total_cost = 0
            for item in order_in.dishes:
                dish = found_dishes[item.dish_id]
                total_cost += dish.price * item.quantity

            
            if user.balance < total_cost:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Not enough balance. Need {total_cost}, have {user.balance}"
                )
            user.balance -= total_cost
            session.add(user) 

            
            new_order = self.model(
                user_id=user.id,
                ordered_at=datetime.now(),
                status=OrderStatus.PAID, 
                completed_at=None
            )
            session.add(new_order)
            await session.flush()
            
            for item in order_in.dishes:
                order_item = OrderItem(
                    order_id=new_order.id,
                    dish_id=item.dish_id,
                    quantity=item.quantity
                )
                session.add(order_item)
            
            await session.commit()
            order_result = await self.get_by_id(session, new_order.id)
            
            try:
                cooks_stmt = select(User).where(User.role == UserRole.COOK)
                cooks_result = await session.execute(cooks_stmt)
                cooks = cooks_result.scalars().all()
                
                for cook in cooks:
                    notification = CreateNotificationRequest(
                        user_id=cook.id,
                        title="Новый заказ",
                        body=f"Поступил новый оплаченный заказ #{new_order.id} от {user.name} {user.surname}"
                    )
                    await notifications_manager.create(session, notification)
            except Exception as e:
                logger.warning(f"Failed to send notification to cooks: {e}")
            
            return order_result

        except HTTPException:
            await session.rollback()
            raise
        except Exception as e:
            await session.rollback()
            logger.error(f"Create order error: {e}")
            raise HTTPException(status_code=500, detail="Failed to create order")

    async def mark_ready(self, session: AsyncSession, order_id: int) -> Order:
        """Повар отмечает, что заказ готов к выдаче."""
        order = await self.get_by_id(session, order_id)
        
        if order.status != OrderStatus.PAID:
             raise HTTPException(status_code=409, detail="Only PAID orders can be marked as READY")
             
        order.status = OrderStatus.READY
        await session.commit()
        
        try:
            notification = CreateNotificationRequest(
                user_id=order.user_id,
                title="Заказ готов!",
                body=f"Ваш заказ #{order.id} готов к выдаче. Приятного аппетита!"
            )
            await notifications_manager.create(session, notification)
        except Exception as e:
            logger.warning(f"Failed to send order ready notification: {e}")
        
        return await self.get_by_id(session, order_id)

    async def mark_prepared(self, session: AsyncSession, order_id: int) -> Order:
        """Повар отмечает заказ готовым к выдаче."""
        order = await self.get_by_id(session, order_id)
        
        if order.status != OrderStatus.PAID:
            raise HTTPException(status_code=409, detail=f"Only paid orders can be marked as prepared")
            
        order.status = OrderStatus.READY
        await session.commit()
        return await self.get_by_id(session, order_id)

    async def mark_served(self, session: AsyncSession, order_id: int) -> Order:
        """Ученик подтверждает получение заказа."""
        order = await self.get_by_id(session, order_id)
        
        if order.status not in [OrderStatus.READY, OrderStatus.PAID]:
            raise HTTPException(status_code=409, detail=f"Order must be ready or paid to be served")
            
        order.status = OrderStatus.SERVED
        order.completed_at = datetime.now() 
        await session.commit()
        return await self.get_by_id(session, order_id)

    async def cancel(self, session: AsyncSession, order_id: int) -> Order:
        """
        Отмена заказа с возвратом СРЕДСТВ.
        """
        order = await self.get_by_id(session, order_id)
        
        if order.status == OrderStatus.SERVED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot cancel served order"
            )
        
        if order.status == OrderStatus.CANCELLED:
             raise HTTPException(status_code=409, detail="Order already cancelled")
        
        refund_amount = 0
        for item in order.dishes:
            refund_amount += item.dish.price * item.quantity

        stmt = select(User).where(User.id == order.user_id)
        user_result = await session.execute(stmt)
        user = user_result.scalar_one()

        user.balance += refund_amount
        session.add(user)

        
        order.status = OrderStatus.CANCELLED
        
        await session.commit()
        return await self.get_by_id(session, order_id)

orders_manager = OrderCRUD(Order)