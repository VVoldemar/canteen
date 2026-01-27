from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security.auth import require_roles
from app.core.enums import UserRole

from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_session
#from app.crud.dish import ingredients_manager

from app.schemas.dish import IngredientResponse, UpdateIngredientRequest
from app.schemas.validation import ValidationError, ErrorResponse
from app.schemas.paginating import PaginationParams, PaginatedResponse


ingredients_router = APIRouter(prefix='/ingredients', tags=['Ingredients'])

@ingredients_router.get('/', summary='Получить список ингредиентов', description='',
                        response_model=PaginatedResponse,
                        responses={
                            200: {'model': PaginatedResponse,'description': 'Список ингредиентов'},
                            401: {'model': ErrorResponse,'description': 'Не авторизован'}
                        })
async def get_ingredients(user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT))):
    pass


@ingredients_router.post('/', summary='Добавить ингредиент', description='Доступно только администраторам и поварам')
async def add_ingredient(user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK))):
    pass


@ingredients_router.get('/{ingredient_id}', summary='Получить информацию об ингредиенте', description='')
async def get_ingredient(ingredient_id: int, user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT))):
    pass


@ingredients_router.patch('/{ingredient_id}', summary='Обновить ингредиент', description='Доступно только администраторам и поварам')
async def update_ingredient(ingredient_id: int, user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK))):
    pass


@ingredients_router.delete('/{ingredient_id}', summary='Удалить ингредиент', description='Доступно только администраторам')
async def delete_ingredient(ingredient_id: int, user=Depends(require_roles(UserRole.ADMIN))):
    pass