from fastapi import APIRouter, Depends
from app.core.security.auth import require_roles
from app.core.enums import UserRole


ingredients_router = APIRouter(prefix='/ingredients', tags=['Ingredients'])

@ingredients_router.get('/', summary='Получить список ингредиентов', description='')
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