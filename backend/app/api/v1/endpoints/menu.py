from fastapi import APIRouter, Depends
from typing import List

from app.core.security.auth import require_roles
from app.core.enums import UserRole

from app.schemas.menu import MenuResponse, CreateMenuRequest, UpdateMenuRequest
from app.schemas.validation import ValidationError, ErrorResponse

from app.db.session import AsyncSession
from app.api.deps import get_session
from app.crud.menu import menu_manager

menu_router = APIRouter(prefix='/menu', tags=['Menu'])

@menu_router.get(
    '/', 
    summary='Получить список меню', 
    description='Получить все доступные меню (завтраки, обеды)',
    response_model=List[MenuResponse],
    responses={
        200: {"model": List[MenuResponse]}, 
        }
    )
async def get_menus(
    session=Depends(get_session)
    ):
    return await menu_manager.get_all(session)


@menu_router.post(
        '/',
        summary='Создать новое меню', 
        description='Доступно только администраторам',
        response_model=MenuResponse,
        responses={
            201: {"model": MenuResponse, "description": "Меню успешно создано"},
            400: {"model": ErrorResponse, "description": "Некорректные данные"},
            401: {"model": ErrorResponse, "description": "Не авторизован"},
            403: {"model": ErrorResponse, "description": "Доступ запрещен"},
            422: {"model": ValidationError, "description": "Ошибка валидации данных"},
        }
    )
async def create_menu(
    menu_params: CreateMenuRequest = Depends(),
    user=Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session)
    ):
    new_menu = await menu_manager.create(session, menu_params)
    return new_menu


@menu_router.get(
        '/{menu_id}', 
        summary='Получить меню по ID', 
        description='Получить детальную информацию о меню с блюдами',
        response_model=MenuResponse,
        responses={
            200: {"model": MenuResponse},
            404: {"model": ErrorResponse, "description": "Ресурс не найден"}
        }
    )
async def get_menu(
    menu_id: int, 
    session: AsyncSession = Depends(get_session)
    ):
    return await menu_manager.get_by_id(session, menu_id) 


@menu_router.patch(
    '/{menu_id}', 
    summary='Обновить меню', 
    description='Доступно только администраторам',
    response_model=MenuResponse,
    responses={
        200: {"model": MenuResponse},
        400: {"model": ErrorResponse, "description": "Некорректные данные"},
        401: {"model": ErrorResponse, "description": "Не авторизован"},
        403: {"model": ErrorResponse, "description": "Доступ запрещен"},
        404: {"model": ErrorResponse, "description": "Меню не найдено"},
        422: {"model": ValidationError, "description": "Ошибка валидации данных"}
        }
    )
async def update_menu(
    menu_id : int, 
    update_data: UpdateMenuRequest = Depends(),
    user=Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session)
    ):
    return await menu_manager.update(session, menu_id, update_data)


@menu_router.delete(
        '/{menu_id}', 
        summary='Удалить меню', 
        description='Доступно только администраторам',
        response_model=MenuResponse,
        responses={
            204: {"description": "Меню удалено"},
            401: {"model": ErrorResponse, "description": "Не авторизован"},
            403: {"model": ErrorResponse, "description": "Доступ запрещен"},
            404: {"model": ErrorResponse, "description": "Меню не найдено"}
        }
    )
async def delete_menu(
    menu_id: int, 
    user=Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session)
    ):
    return await menu_manager.delete(session, menu_id)