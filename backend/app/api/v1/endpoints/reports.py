from fastapi import APIRouter, Depends
from app.core.security.auth import require_roles
from app.core.enums import UserRole


reports_router = APIRouter(prefix='/reports', tags=['Reports'])

@reports_router.get('/costs', summary='Отчет по затратам', description='Администратор формирует отчет по затратам на закупки за период.')
async def report_costs(user=Depends(require_roles(UserRole.ADMIN))):
    pass


@reports_router.get('/nutrition', summary='Отчет по питанию', description='Администратор формирует отчет по питанию (кол-во выданных заказов и разбивка по блюдам) за период.')
async def report_nutrition(user=Depends(require_roles(UserRole.ADMIN))):
    pass