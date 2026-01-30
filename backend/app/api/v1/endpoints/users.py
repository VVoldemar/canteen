from fastapi import APIRouter, Depends
from typing import List

from app.core.security.auth import require_roles
from app.core.enums import UserRole

from app.crud.user import users_manager

from app.schemas.user import UserResponse, UpdateUserRequest, AdminUpdateUserRequest
from app.schemas.validation import ValidationError, ErrorResponse
from app.schemas.paginating import PaginationParams, PaginatedResponse
from app.schemas.dish import IngredientResponse

from app.api.deps import get_session
from app.db.session import AsyncSession


users_router = APIRouter(prefix="/users", tags=["Users"])

@users_router.get("/me", 
    summary="Информация о пользователе", 
    description="Получить информацию о текущем пользователе",
    responses={
        200: {"model": UserResponse},
        401: {"model": ErrorResponse, "description": "Не авторизован"}
        }
    )
async def get_current_user(
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT))
    ):
    return user


@users_router.patch(
    "/me",
    summary="Обновить профиль текущего пользователя",
    description="Обновить информацию о текущем пользователе",
    response_model=UserResponse,
    responses={
        200: {"model": UserResponse},
        401: {"model": ErrorResponse, "description": "Не авторизован"},
        422: {"model": ValidationError, "description": "Ошибка валидации"}
        }
    )
async def update_current_user(
    update_data: UpdateUserRequest = Depends(),
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT)),
    session: AsyncSession = Depends(get_session)
    ):

    updated_user = await users_manager.update(session, user.id, update_data)

    return updated_user


@users_router.get(
    "/me/allergies",
    summary="Получить список аллергий текущего пользователя", 
    description="",
    response_model=UserResponse,
    responses={
        200: {"model": List[IngredientResponse]},
        401: {"model": ErrorResponse, "description": "Не авторизован"}
        }
    )
async def get_current_user_allergies(
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT)),
    session: AsyncSession = Depends(get_session)
    ):
    allergies = await users_manager.get_allergies(session, user.id)
    return allergies


@users_router.post(
    "/me/allergies", 
    summary="Добавить аллергию", 
    description="Указать аллерген для текущего пользователя",
    responses={
        200: {"model": bool, "description": "Аллергия добавлена"},
        400: {"model": ErrorResponse, "description": "Некорректный запрос"},
        401: {"model": ErrorResponse, "description": "Не авторизован"},
        404: {"model": ErrorResponse, "description": "Ингредиент не найден"},
        422: {"model": ValidationError, "description": "Ошибка валидации"}
        }
    )
async def add_current_user_allergy(
    ingredient_id: int,
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT)),
    session: AsyncSession = Depends(get_session)
    ):
    await users_manager.add_allergy(session, user.id, ingredient_id)


@users_router.delete(
    "/me/allergies", 
    summary="Удалить аллергию", 
    description="Удалить аллерген из списка",
    response_model=bool,
    responses={
        204: {"description": "Аллергия удалена"},
        401: {"model": ErrorResponse, "description": "Не авторизован"},
        422: {"model": ValidationError, "description": "Ошибка валидации"}
        }
    )
async def delete_current_user_allergy(
    ingredient_id: int,
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT))
    ):
    await users_manager.delete_allergy(user.id, ingredient_id)
    

@users_router.get(
    "/",
    summary="Получить список пользователей",
    description="Доступно только администраторам",
    response_model=PaginatedResponse[UserResponse],
    responses={
        200: {"model": PaginatedResponse[UserResponse]},
        401: {"model": ErrorResponse, "description": "Не авторизован"},
        403: {"model": ErrorResponse, "description": "Доступ запрещен"}
    }
)
async def get_users(
    params: PaginationParams = Depends(),
    user=Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session)
    ):  
    page = await users_manager.get_users(session, params)
    list_users = []
    for item in page.items:
        list_users.append(
            UserResponse(item
            )
        )
    return PaginatedResponse[UserResponse](items=list_users, total=page.total, page=page.page, pages=page.pages)


@users_router.get(
    "/{user_id}", 
    summary="Получить информацию о пользователе", 
    description="Доступно только администраторам",
    response_model=UserResponse,
    responses={
        200: {"model": UserResponse},
        401: {"model": ErrorResponse, "description": "Не авторизован"},
        403: {"model": ErrorResponse, "description": "Доступ запрещен"},
        404: {"model": ErrorResponse, "description": "Ресурс не найден"}
        }
    )
async def get_user(
    user_id: int, 
    user=Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session)
    ):  
    user = await users_manager.get_user(session, user_id)
    return user


@users_router.patch(
    "/{user_id}", 
    summary="Обновить информацию о пользователе", 
    description="Доступно только администраторам",
    response_model=UserResponse,
    responses={
        200: {"model": UserResponse},
        401: {"model": ErrorResponse, "description": "Не авторизован"},
        403: {"model": ErrorResponse, "description": "Доступ запрещен"},
        404: {"model": ErrorResponse, "description": "Ресурс не найден"},
        422: {"model": ValidationError, "description": "Ошибка валидации"}
        }
    )
async def update_user(
    user_id: int,
    update_data: AdminUpdateUserRequest = Depends(),
    user=Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session)
    ): 
    return await users_manager.update_user(session, user_id, update_data)