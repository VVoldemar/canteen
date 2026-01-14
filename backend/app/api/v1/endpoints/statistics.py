from fastapi import APIRouter, Depends
from app.core.security.auth import require_roles
from app.core.enums import UserRole


statistics_router = APIRouter(tags=['Statistics'])

@statistics_router.get('/statistics/payments', summary='Статистика оплат', description='Доступно только администраторам')
async def get_payments(user=Depends(require_roles(UserRole.ADMIN))):
    pass


@statistics_router.get('/statistics/attendance', summary='Статистика посещаемости', description='Доступно только администраторам')
async def get_attendance(user=Depends(require_roles(UserRole.ADMIN))):
    pass


@statistics_router.get('/statistics/dishes', summary='Статистика по блюдам', description='Популярность блюд, средние оценки. Доступно администраторам')
async def get_dishes_stat(user=Depends(require_roles(UserRole.ADMIN))):
    pass


@statistics_router.post('/reports/generate', summary='Сформировать отчет', description='Aдминистратор формирует отчет по питанию и затратам')
async def generate_report(user=Depends(require_roles(UserRole.ADMIN))):
    pass