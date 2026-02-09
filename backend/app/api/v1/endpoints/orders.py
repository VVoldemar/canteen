from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, Annotated
from datetime import datetime, date

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security.auth import require_roles
from app.core.enums import UserRole, OrderStatus
from app.api.deps import get_session
from app.crud.order import orders_manager

from app.schemas.validation import ErrorResponse, ValidationError
from app.schemas.paginating import PaginationParams, PaginatedResponse
from app.schemas.order import OrderResponse, OrderDetailResponse, CreateOrderRequest

orders_router = APIRouter(prefix='/orders', tags=['Orders'])

@orders_router.get('/', summary='Получить список заказов', description='- Ученики видят только свои заказы\n - Повара и администраторы видят все заказы',
                response_model=PaginatedResponse[OrderResponse],
                responses={
                    200: {'model': PaginatedResponse[OrderResponse], 'description': 'Список заказов'},
                    401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                    403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                })
async def get_orders(
    params: Annotated[PaginationParams, Depends()],
    status: Optional[OrderStatus] = None,
    user_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT)),
    session: AsyncSession = Depends(get_session), 
):
    
    target_user_id = user_id
    if user.role == UserRole.STUDENT:
        target_user_id = user.id
    
    return await orders_manager.get_all_paginated(
        session, params, target_user_id, status, date_from, date_to
    )


@orders_router.post('/', summary='Создать заказ', description='Оплата разового питания учеником', 
                    response_model=OrderDetailResponse,
                    status_code=status.HTTP_201_CREATED,
                    responses={
                        201: {'model': OrderDetailResponse},
                        400: {'model': ErrorResponse, 'description': 'Недостаточно средств или некорректный запрос'},
                        409: {'model': ErrorResponse, 'description': 'Конфликт (операция недоступна в текущем состоянии)'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        422: {'model': ValidationError, 'description': 'Ошибка валидации'}
                    })
async def create_order(
    order_in: CreateOrderRequest,
    user=Depends(require_roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.COOK)),
    session: AsyncSession = Depends(get_session)
):
    
    return await orders_manager.create(session, user, order_in)


@orders_router.get('/{order_id}', summary='Получить информацию о заказе', description='', 
                   response_model=OrderDetailResponse,
                   responses={
                       200: {'model': OrderDetailResponse, 'description': 'Информация о заказе'},
                       401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                       404: {'model': ErrorResponse, 'description': 'Ресурс не найден'}
                   })
async def get_order(
    order_id: int, 
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT)),
    session: AsyncSession = Depends(get_session)
):
    order = await orders_manager.get_by_id(session, order_id)
    if user.role == UserRole.STUDENT and order.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied to other user's order")
        
    return order


@orders_router.post('/{order_id}/mark-ready', 
    summary='Отметить готовность (для Повара)', 
    description='Повар отмечает, что заказ приготовлен (статус READY)',
    response_model=OrderResponse
)
async def mark_ready_order(
    order_id: int, 
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK)),
    session: AsyncSession = Depends(get_session)
):
    
    return await orders_manager.mark_ready(session, order_id)


@orders_router.post('/{order_id}/cancel', summary='Отменить заказ', description='Отмена заказа (доступно только до момента выдачи)',
                    response_model=OrderResponse,
                    responses={
                        200: {'model': OrderResponse, 'description': 'Заказ отменен'},
                        400: {'model': ErrorResponse, 'description': 'Некорректный запрос'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                        404: {'model': ErrorResponse, 'description': 'Ресурс не найден'},
                        409: {'model': ErrorResponse, 'description': 'Конфликт (операция недоступна в текущем состоянии)'}
                    })
async def cancel_order(
    order_id: int, 
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT)),
    session: AsyncSession = Depends(get_session)
):
    order = await orders_manager.get_by_id(session, order_id)

    if user.role == UserRole.STUDENT and order.user_id != user.id:
        raise HTTPException(status_code=403, detail="Cannot cancel other user's order")

    return await orders_manager.cancel(session, order_id)


@orders_router.post('/{order_id}/confirm-receipt', summary='Подтвердить получение питания', description='Ученик подтверждает получение питания. Повторная отметка должна приводить к 409.',
                    response_model=OrderResponse,
                    responses={
                        200: {'model': OrderResponse, 'description': 'ОК'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                        404: {'model': ErrorResponse, 'description': 'Ресурс не найден'},
                        409: {'model': ErrorResponse, 'description': 'Конфликт (операция недоступна в текущем состоянии)'}
                    })
async def confirm_order(
    order_id: int, 
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT)),
    session: AsyncSession = Depends(get_session)
    ):
    order = await orders_manager.get_by_id(session, order_id)
    
    if user.role == UserRole.STUDENT and order.user_id != user.id:
        raise HTTPException(status_code=403, detail="Cannot confirm other user's order")
    return await orders_manager.mark_served(session, order_id)


@orders_router.post('/{order_id}/serve', 
    summary='Выдать заказ (для Повара)', 
    description='Повар отмечает, что выдал заказ.',
    response_model=OrderResponse
)
async def serve_order(
    order_id: int, 
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK)),
    session: AsyncSession = Depends(get_session)
):
    
    return await orders_manager.mark_served(session, order_id)