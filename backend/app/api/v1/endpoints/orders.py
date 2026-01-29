from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from datetime import datetime

from app.core.security.auth import require_roles
from app.core.enums import UserRole, OrderStatus

from app.api.deps import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.order import orders_manager

from app.schemas.validation import ErrorResponse, ValidationError
from app.schemas.paginating import PaginationParams, PaginatedResponse
from app.schemas.order import OrderResponse, OrderDetailResponse, CreateOrderRequest


orders_router = APIRouter(prefix='/orders', tags=['Orders'])

@orders_router.get('/', summary='Получить список заказов', description='- Ученики видят только свои заказы\n - Повара и администраторы видят все заказы',
                response_model=PaginatedResponse,
                responses={
                    200: {'model': PaginatedResponse, 'description': 'Список заказов'},
                    401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                    403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                })
async def get_orders(
    params: PaginationParams,
    session: AsyncSession = Depends(get_session), 
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT)),
    status: Optional[OrderStatus] = None,
    user_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
):
    orders = await orders_manager.get_all_paginated(
        session=session, 
        params=params, 
        user_id=user_id if user.role == UserRole.ADMIN else None, 
        order_status=status,
        date_from=date_from, 
        date_to=date_to
    )
        
    return orders


@orders_router.post('/', summary='Создать заказ', description='Оплата разового питания учеником', 
                    response_model=OrderResponse,
                    responses={
                        400: {'model': ErrorResponse, 'description': 'Недостаточно средств или некорректный запрос'},
                        409: {'model': ErrorResponse, 'description': 'Конфликт (операция недоступна в текущем состоянии)'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        422: {'model': ValidationError, 'description': 'Ошибка валидации'}
                    })
async def create_order(
                    order_in: CreateOrderRequest,
                    user=Depends(require_roles(UserRole.ADMIN, UserRole.STUDENT)),
                    session: AsyncSession = Depends(get_session)
                ):

    try:
        return await orders_manager.create(session, user.id, order_in)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Bad request'
        )


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
    
    return await orders_manager.get_by_id(session, order_id)


@orders_router.post('/{order_id}/mark-served', summary='Отметить получение питания', description='- Ученик может отметить получение своего питания\n - Повар может отметить выдачу любого заказа',
                    response_model=OrderResponse,
                    responses={
                        200: {'model': OrderResponse, 'description': 'Питание отмечено как полученное'},
                        400: {'model': ErrorResponse, 'description': 'Некорректный запрос'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                        404: {'model': ErrorResponse, 'description': 'Ресурс не найден'},
                        409: {'model': ErrorResponse, 'description': 'Конфликт (операция недоступна в текущем состоянии)'}
                    })
async def mark_seved_order(
                        order_id: int, 
                        user=Depends(require_roles(UserRole.ADMIN, UserRole.STUDENT)),
                        session: AsyncSession = Depends(get_session)
                    ):
    
    try:
        order = await orders_manager.mark_served(session, order_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Bad request'
        )
    
    return OrderResponse(
        id=order_id,
        user_id=user.id,
        ordered_at=order.ordered_at,
        completed_at=order.completed_at,
        status=order.status
    )


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
    
    try:
        return await orders_manager.cancel(session, order_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Bad request'
        )


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
                    user=Depends(require_roles(UserRole.ADMIN, UserRole.STUDENT)),
                    session: AsyncSession = Depends(get_session)
                ):
    try:
        return await orders_manager.confirm_receipt(session, order_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Bad request'
        )


@orders_router.post('/{order_id}/serve', summary='Отметить заказ как выданный', description='Повар отмечает заказ как выданный.',
                    response_model=OrderResponse,
                    responses={
                        200: {'model': OrderResponse, 'description': 'ОК'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                        404: {'model': ErrorResponse, 'description': 'Ресурс не найден'},
                        409: {'model': ErrorResponse, 'description': 'Конфликт (операция недоступна в текущем состоянии)'}
                    })
async def serve_order(
                    order_id: int, 
                    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK)),
                    session: AsyncSession = Depends(get_session)
                ):
    try:
        return orders_manager.serve(session, order_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Bad request'
        )
