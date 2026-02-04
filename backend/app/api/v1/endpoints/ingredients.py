from fastapi import APIRouter, Depends, status
from typing import Annotated

from app.core.security.auth import require_roles
from app.core.enums import UserRole

from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_session
from app.crud.ingredient import ingredients_manager

from app.schemas.dish import IngredientResponse, UpdateIngredientRequest
from app.schemas.validation import ValidationError, ErrorResponse
from app.schemas.paginating import PaginationParams, PaginatedResponse


ingredients_router = APIRouter(prefix='/ingredients', tags=['Ingredients'])

@ingredients_router.get(
    '/', 
    summary='Получить список ингредиентов', 
    description='',
    response_model=PaginatedResponse[IngredientResponse],
    responses={
        200: {'model': PaginatedResponse,'description': 'Список ингредиентов'},
        401: {'model': ErrorResponse,'description': 'Не авторизован'}
        }
    )
async def get_ingredients(
    params: Annotated[PaginationParams, Depends()],
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT)),
    session: AsyncSession = Depends(get_session)
    ):
    return await ingredients_manager.get_all_paginated(session, params)

@ingredients_router.post(
        '/', 
        summary='Добавить ингредиент', 
        description='Доступно только администраторам и поварам',
        response_model=IngredientResponse,
        status_code=status.HTTP_201_CREATED,
        responses={
            201: {'model': IngredientResponse, 'description': 'Ингредиент успешно создан'},
            400: {'model': ErrorResponse, 'description': 'Ингредиент уже существует'},
            401: {'model': ErrorResponse, 'description': 'Не авторизован'},
            403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
            422: {'model': ValidationError, 'description': 'Ошибка валидации данных'},
        }
    )
async def add_ingredient(
    ingredient_data: UpdateIngredientRequest,
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK)),
    session: AsyncSession = Depends(get_session)
    ):
    return await ingredients_manager.create(session, ingredient_data)


@ingredients_router.get(
        '/{ingredient_id}', 
        summary='Получить информацию об ингредиенте', 
        description='',
        response_model=IngredientResponse,
        responses={
            200: {'model': IngredientResponse, 'description': 'Информация об ингредиенте'},
            401: {'model': ErrorResponse, 'description': 'Не авторизован'},
            404: {'model': ErrorResponse, 'description': 'Ингредиент не найден'}
        }
    )
async def get_ingredient(
    ingredient_id: int, 
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT)),
    session: AsyncSession = Depends(get_session)
    ):
    return await ingredients_manager.get_by_id(session, ingredient_id)


@ingredients_router.patch(
        '/{ingredient_id}', 
        summary='Обновить ингредиент', 
        description='Доступно только администраторам и поварам',
        response_model=IngredientResponse,        
        responses={
            200: {'model': IngredientResponse, 'description': 'Ингредиент успешно обновлен'},
            400: {'model': ErrorResponse, 'description': 'Ошибка валидации данных'},
            401: {'model': ErrorResponse, 'description': 'Не авторизован'},
            403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
            404: {'model': ErrorResponse, 'description': 'Ингредиент не найден'},
            422: {'model': ValidationError, 'description': 'Ошибка валидации данных'},
        }
    )   
async def update_ingredient(
    ingredient_id: int, 
    ingredient_data: UpdateIngredientRequest,
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK)),
    session: AsyncSession = Depends(get_session)
    ):
    return await ingredients_manager.update(session, ingredient_id, ingredient_data)


@ingredients_router.delete(
    '/{ingredient_id}', 
    summary='Удалить ингредиент', 
    description='Доступно только администраторам',
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        204: {'description': 'Ингредиент успешно удален'},
        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
        404: {'model': ErrorResponse, 'description': 'Ингредиент не найден'}
    }
)
async def delete_ingredient(
    ingredient_id: int, 
    user=Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session)
    ):
    await ingredients_manager.delete(session, ingredient_id)
    return 
    