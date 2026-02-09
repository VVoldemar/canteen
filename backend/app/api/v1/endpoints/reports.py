from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta, date
from typing import Optional

from app.core.security.auth import require_roles
from app.core.enums import UserRole
from app.core.utils.generation import generate_report

from app.api.deps import get_session
from app.crud.reports import reports_manager

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.report import (
    ReportResponse, 
    GenerateReportRequest, 
    CostsReportResponse, 
    NutritionReportResponse, 
    AttendanceReportResponse
)
from app.schemas.validation import ValidationError, ErrorResponse


reports_router = APIRouter(prefix='/reports', tags=['Reports'])

@reports_router.get('/costs', summary='Отчет по затратам', description='Администратор формирует отчет по затратам на закупки за период.',
                    response_model=CostsReportResponse,
                    responses={
                        200: {'model': CostsReportResponse, 'description': 'OK'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'}
                    })
async def report_costs(
                    date_from: Optional[date] = None,
                    date_to: Optional[date] = None,
                    user=Depends(require_roles(UserRole.ADMIN)),
                    session: AsyncSession = Depends(get_session)
                ):
    
    return await reports_manager.get_costs_report_data(session, date_from, date_to)


@reports_router.get('/nutrition', 
                    summary='Отчет по питанию', 
                    description='Администратор формирует отчет по питанию (кол-во выданных заказов и разбивка по блюдам) за период.',
                    response_model=NutritionReportResponse,
                    responses={
                        200: {'model': NutritionReportResponse, 'description': 'OK'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'}
                        }
                    )
async def report_nutrition(
                    date_from: Optional[date] = None,
                    date_to: Optional[date] = None,
                    user=Depends(require_roles(UserRole.ADMIN)),
                    session: AsyncSession = Depends(get_session)
                ):
    
    return await reports_manager.get_nutrition_report_data(session, date_from, date_to)


@reports_router.get('/attendance', 
                    summary='Отчет по посещаемости', 
                    description='Администратор формирует отчет по посещаемости столовой за период.',
                    response_model=AttendanceReportResponse,
                    responses={
                        200: {'model': AttendanceReportResponse, 'description': 'OK'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'}
                        }
                    )
async def report_attendance(
                    date_from: Optional[date] = None,
                    date_to: Optional[date] = None,
                    user=Depends(require_roles(UserRole.ADMIN)),
                    session: AsyncSession = Depends(get_session)
                ):
    
    return await reports_manager.get_attendance_report_data(session, date_from, date_to)



@reports_router.post(
    '/generate-pdf', 
    summary='Сгенерировать отчет', 
    description='Администратор запускает генерацию отчета (например, по питанию) за период. Отчет формируется асинхронно, результат сохраняется в БД и может быть получен через другой эндпоинт.',
    response_model=ReportResponse,
    responses={
        200: {'model': ReportResponse, 'description': 'OK'},
        400: {'model': ErrorResponse, 'description': 'Некорректный запрос'},
        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
        422: {'model': ValidationError, 'description': 'Ошибка валидации'}
        }   
    )
async def generate_new_report(
    report_request: GenerateReportRequest,
    user=Depends(require_roles(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session)
    ):
    report  = await reports_manager.get(session, report_request)
    if report:
        return report
    else:
        return await generate_report(session, report_request)