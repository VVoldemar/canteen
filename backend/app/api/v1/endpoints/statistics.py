from fastapi import APIRouter, Depends, status
from datetime import datetime, timezone, timedelta
from typing import Optional

from app.core.security.auth import require_roles
from app.core.enums import UserRole

from app.api.deps import get_session
from app.crud.statistic import statistic_manager
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.statistic import DishStatistic, DishStatisticsResponse, PaymentStatisticsResponse, AttendanceStatisticsByDay, AttendanceStatisticsResponse
from app.schemas.report import GenerateReportRequest, ReportResponse
from app.schemas.validation import ValidationError, ErrorResponse


statistics_router = APIRouter(tags=['Statistics'])

@statistics_router.get('/statistics/payments', summary='Статистика оплат', description='Доступно только администраторам',
                    response_model=PaymentStatisticsResponse,
                    responses={
                        200: {'model': PaymentStatisticsResponse, 'description': 'Статистика оплат'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'}
                    })
async def get_payments(
                    date_from: Optional[datetime] = datetime.now(timezone.utc).date() - timedelta(days=7),
                    date_to: Optional[datetime] = datetime.now(timezone.utc).date(),
                    user=Depends(require_roles(UserRole.ADMIN)),
                    session: AsyncSession = Depends(get_session)
                ):
    
    return await statistic_manager.get_payment_statistics(session, date_from, date_to)


@statistics_router.get('/statistics/attendance', summary='Статистика посещаемости', description='Доступно только администраторам',
                    response_model=AttendanceStatisticsResponse,
                    responses={
                        200: {'model': AttendanceStatisticsResponse, 'description': 'Статистика посещаемости'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'}
                    })
async def get_attendance(                    
                    date_from: Optional[datetime] = (datetime.now(timezone.utc).date() - timedelta(days=7)),
                    date_to: Optional[datetime] = datetime.now(timezone.utc).date(),
                    user=Depends(require_roles(UserRole.ADMIN)),
                    session: AsyncSession = Depends(get_session)
                ):
    
    return await statistic_manager.get_attendance_statistics(session, date_from, date_to)


@statistics_router.get('/statistics/dishes', summary='Статистика по блюдам', description='Популярность блюд, средние оценки. Доступно администраторам',
                    response_model=DishStatisticsResponse,
                    responses={
                        200: {'model': DishStatisticsResponse, 'description': 'Статистика посещаемости'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'}
                    })
async def get_dishes_stat(
                    date_from: Optional[datetime] = (datetime.now(timezone.utc).date() - timedelta(days=7)),
                    date_to: Optional[datetime] = datetime.now(timezone.utc).date(),
                    user=Depends(require_roles(UserRole.ADMIN)),
                    session: AsyncSession = Depends(get_session)
                ):
    
    return await statistic_manager.get_dish_statistics(session, date_from, date_to)


@statistics_router.post('/reports/generate', summary='Сформировать отчет', description='Aдминистратор формирует отчет по питанию и затратам',
                    response_model=ReportResponse,
                    status_code=status.HTTP_201_CREATED,
                    responses={
                        201: {'model': ReportResponse, 'description': 'Отчет сформирован'},
                        400: {'model': ErrorResponse, 'description': 'Некорректный запрос'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'}
                    })
async def generate_report(
                    report_in: GenerateReportRequest,
                    user=Depends(require_roles(UserRole.ADMIN)),
                    session: AsyncSession = Depends(get_session)
                ):
    
    return await statistic_manager.xxx(session, report_in)