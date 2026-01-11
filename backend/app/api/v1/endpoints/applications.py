from fastapi import APIRouter, Depends

from app.core.security.auth import require_roles


applications_router = APIRouter(prefix='/applications', tags=['Applications'])

@applications_router.get('/', summary='Получить список заявок на закупку', description='Доступно поварам и администраторам')
async def get_applications(user=Depends(require_roles("admin", 'cook'))):
    pass


@applications_router.post('/', summary='Создать заявку на закупку', description='Повар создает заявку на закупку продуктов')
async def create_application(user=Depends(require_roles("admin", 'cook'))):
    pass


@applications_router.get('/{application_id}', summary='Получить заявку', description='Доступно поварам и администраторам')
async def get_application(application_id: int, user=Depends(require_roles("admin", 'cook'))):
    pass


@applications_router.post('/{application_id}/approve', summary='Согласовать заявку', description='Администратор согласовывает заявку на закупку')
async def approve_application(application_id: int, user=Depends(require_roles("admin"))):
    pass


@applications_router.post('/{application_id}/reject', summary='Отклонить заявку', description='Администратор отклоняет заявку на закупку')
async def reject_application(application_id: int, user=Depends(require_roles("admin"))):
    pass