from fastapi import APIRouter, Depends
from app.core.security.auth import require_roles


menu_router = APIRouter(prefix='/menu', tags=['Menu'])

@menu_router.get('/', summary='Получить список меню', description='Получить все доступные меню (завтраки, обеды)')
async def get_menus():
    pass


@menu_router.post('/', summary='Создать новое меню', description='Доступно только администраторам')
async def create_menu(user=Depends(require_roles("admin"))):
    pass


@menu_router.get('/{menu_id}', summary='Получить меню по ID', description='Получить детальную информацию о меню с блюдами')
async def get_menu(menu_id: int, user=Depends(require_roles("admin", 'cook', 'student'))):
    pass


@menu_router.patch('/{menu_id}', summary='Обновить меню', description='Доступно только администраторам')
async def update_menu(menu_id : int, user=Depends(require_roles("admin"))):
    pass


@menu_router.delete('/{menu_id}', summary='Удалить меню', description='Доступно только администраторам')
async def delete_menu(menu_id: int, user=Depends(require_roles("admin"))):
    pass