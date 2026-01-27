from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security.auth import require_roles
from app.core.enums import UserRole

from app.api.deps import get_session
from app.crud.dish import dish_manager
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.dish import DishDetailResponse, DishResponse, CreateDishRequest, UpdateDishRequest
from app.schemas.validation import ValidationError, ErrorResponse
from app.schemas.paginating import PaginationParams, PaginatedResponse

dishes_router = APIRouter(prefix='/dishes', tags=['Dishes'])

@dishes_router.get('/', summary='Получить список блюд', description='',
                response_model=PaginatedResponse,
                responses={
                    200: {'model': PaginatedResponse, 'description': 'Список блюд'}
                })
async def get_dishes(
                params: PaginationParams,
                session: AsyncSession = Depends(get_session)
            ):

    return await dish_manager.get_all_paginated(session, params)


@dishes_router.post('/', summary='Создать новое блюдо', description='',
                    response_model=DishResponse,
                    responses={
                        200: {'model': DishResponse, 'description': 'Блюдо создано'},
                        400: {'model': ErrorResponse, 'description': 'Некорректный запрос'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'}
                    })
async def create_dish(
                    dish_in: CreateDishRequest,
                    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK)),
                    session: AsyncSession = Depends(get_session)
                ):
    
    try:
        return await dish_manager.create(session, dish_in)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Bad request'
        )


@dishes_router.get('/{dish_id}', summary='Получить информацию о блюде', description='',
                    response_model=DishDetailResponse,
                    responses={
                        200: {'model': DishResponse, 'description': 'Информация о блюде'},
                        404: {'model': ErrorResponse, 'description': 'Ресурс не найден'},
                    })
async def get_dish(
                dish_id: int,
                session: AsyncSession = Depends(get_session)
            ):
    
    return await dish_manager.get_by_id(session, dish_id)


@dishes_router.patch('/{dish_id}', summary='Oбновить блюдо', description='Доступно только администраторам и поварам',
                    response_model=DishResponse,
                    responses={
                        200: {'model': DishResponse, 'description': 'Блюдо обновлено'},
                        400: {'model': ErrorResponse, 'description': 'Некорректный запрос'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                        404: {'model': ErrorResponse, 'description': 'Ресурс не найден'}
                    })
async def update_dish(
                    dish_id: int, 
                    update_data: UpdateDishRequest,
                    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK)),
                    session: AsyncSession = Depends(get_session)
                ):
    
    return await dish_manager.update(session, dish_id, update_data)


@dishes_router.delete('/{dish_id}', summary='Удалить блюдо', description='Доступно только администраторам',
                    responses={
                        200: {'description': 'Блюдо удалено'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                        404: {'model': ErrorResponse, 'description': 'Ресурс не найден'}
                    })
async def delete_dish(
                    dish_id: int, 
                    user=Depends(require_roles(UserRole.ADMIN)),
                    session: AsyncSession = Depends(get_session)
                ):
    
    delete_dish_status = await dish_manager.delete(session, dish_id)
    return {'status': delete_dish_status}