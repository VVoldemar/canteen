from fastapi import APIRouter


applications_router = APIRouter(prefix='/applications', tags=['Applications'])

@applications_router.get('/', summary='Получить список заявок на закупку', description='Доступно поварам и администраторам')
async def get_applications():
    pass


@applications_router.post('/', summary='Создать заявку на закупку', description='Повар создает заявку на закупку продуктов')
async def create_application():
    pass


@applications_router.get('/{application_id}', summary='Получить заявку', description='Доступно поварам и администраторам')
async def get_application(application_id: int):
    pass


@applications_router.post('/{application_id}/approve', summary='Согласовать заявку', description='Администратор согласовывает заявку на закупку')
async def approve_application(application_id: int):
    pass


@applications_router.post('/{application_id}/reject', summary='Отклонить заявку', description='Администратор отклоняет заявку на закупку')
async def reject_application(application_id: int):
    pass