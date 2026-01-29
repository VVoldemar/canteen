from fastapi import APIRouter, Depends
from datetime import datetime

from app.core.security.auth import require_roles
from app.core.enums import UserRole

from app.api.deps import get_session
from app.crud.statistic import statistic_manager
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.report import ReportResponse, GenerateReportRequest, CostsReportResponse, NutritionReportResponse
from app.schemas.validation import ValidationError, ErrorResponse
from app.schemas.paginating import PaginationParams, PaginatedResponse


reports_router = APIRouter(prefix='/reports', tags=['Reports'])

@reports_router.get('/costs', summary='Отчет по затратам', description='Администратор формирует отчет по затратам на закупки за период.',
                    response_model=CostsReportResponse,
                    responses={
                        200: {'model': CostsReportResponse, 'description': 'OK'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'}
                    })
async def report_costs(
                    date_from: datetime,
                    date_to: datetime,
                    user=Depends(require_roles(UserRole.ADMIN)),
                    session: AsyncSession = Depends(get_session)
                ):
    
    return await statistic_manager.get_costs_report(session, date_from, date_to)


@reports_router.get('/nutrition', summary='Отчет по питанию', description='Администратор формирует отчет по питанию (кол-во выданных заказов и разбивка по блюдам) за период.',
                    response_model=NutritionReportResponse,
                    responses={
                        200: {'model': NutritionReportResponse, 'description': 'OK'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'}
                    })
async def report_nutrition(
                    date_from: datetime,
                    date_to: datetime,
                    user=Depends(require_roles(UserRole.ADMIN)),
                    session: AsyncSession = Depends(get_session)
                ):
    
    return await statistic_manager.get_nutrition_report(session, date_from, date_to)