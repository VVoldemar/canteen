from fastapi import APIRouter, Depends
from app.core.security.auth import require_roles


dishes_router = APIRouter(prefix='/dishes', tags=['Dishes'])

@dishes_router.get('/', summary='Получить список блюд', description='')
async def get_dishes():
    pass


@dishes_router.post('/', summary='Создать новое блюдо', description='')
async def create_dish(user=Depends(require_roles("admin", 'cook'))):
    pass


@dishes_router.get('/{dish_id}', summary='Получить информацию о блюде', description='')
async def get_dish(dish_id: int, user=Depends(require_roles("admin", 'cook', 'student'))):
    pass


@dishes_router.patch('/{dish_id}', summary='Oбновить блюдо', description='Доступно только администраторам и поварам')
async def update_dish(dish_id: int, user=Depends(require_roles("admin", 'cook'))):
    pass


@dishes_router.delete('/{dish_id}', summary='Удалить блюдо', description='Доступно только администраторам')
async def delete_dish(dish_id: int, user=Depends(require_roles("admin"))):
    pass