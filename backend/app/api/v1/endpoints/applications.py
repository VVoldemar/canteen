from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Annotated

from app.core.security.auth import require_roles
from app.core.enums import UserRole
from app.api.deps import get_session
from app.crud.application import applications_manager

from app.schemas.application import ApplicationDetailResponse, ApplicationRejectRequest, ApplicationResponse, CreateApplicationRequest
from app.schemas.validation import ErrorResponse, ValidationError
from app.schemas.paginating import PaginationParams, PaginatedResponse
from app.core.enums import OrderStatus


applications_router = APIRouter(prefix='/applications', tags=['Applications'])

@applications_router.get('/', summary='Получить список заявок на закупку', description='Доступно поварам и администраторам',
                        response_model=PaginatedResponse[ApplicationResponse],
                        responses={
                            201: {'model': PaginatedResponse[ApplicationResponse], 'description': 'Список заявок'},
                            400: {'model': ErrorResponse, 'description': 'Некорректный запрос'},
                            401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                            403: {'model': ErrorResponse, 'description': 'Доступ запрещен'}
                        })
async def get_applications(
                        params: Annotated[PaginationParams, Depends()],
                        status: Optional[OrderStatus] = None, 
                        user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK)),
                        session: AsyncSession = Depends(get_session)
                    ):
    
    return await applications_manager.get_all_paginated(session, params, status)


@applications_router.post(
                        '/', summary='Создать заявку на закупку', 
                        description='Повар создает заявку на закупку продуктов',
                        status_code=status.HTTP_201_CREATED,
                        responses={
                            201: {'model': ApplicationResponse, 'description': 'Заявка создана'},
                            400: {'model': ErrorResponse, 'description': 'Некорректный запрос'},
                            401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                            403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                            422: {'model': ValidationError, 'description': 'Ошибка валидации'}
                        })
async def create_application(
                        application_in: CreateApplicationRequest,
                        user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK)),
                        session: AsyncSession = Depends(get_session)
                    ):
    
    try:
        return await applications_manager.create(session, user.id, application_in)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Bad request'
        )


@applications_router.get('/{application_id}', summary='Получить заявку', description='Доступно поварам и администраторам',
                        response_model=ApplicationDetailResponse,
                        responses={
                            200: {'model': ApplicationResponse, 'description': 'Детальная информация о заявке'},
                            401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                            403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                            404: {'model': ValidationError, 'description': 'Ресурс не найден'}
                        })
async def get_application(
                        application_id: int, 
                        user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK)),
                        session: AsyncSession = Depends(get_session)
                    ):
    
    return await applications_manager.get_by_id(session, application_id)


@applications_router.post('/{application_id}/approve', summary='Согласовать заявку', description='Администратор согласовывает заявку на закупку',
                        response_model=ApplicationResponse,
                        responses={
                            200: {'model': ApplicationResponse, 'description': 'Заявка согласована'},
                            401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                            403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                            404: {'model': ValidationError, 'description': 'Ресурс не найден'},
                            409: {'model': ErrorResponse, 'description': 'Конфликт (операция недоступна в текущем состоянии)'}
                        })
async def approve_application(
                            application_id: int, 
                            user=Depends(require_roles(UserRole.ADMIN)),
                            session: AsyncSession = Depends(get_session)
                        ):
    
    return await applications_manager.approve(session, application_id)


@applications_router.post('/{application_id}/reject', summary='Отклонить заявку', description='Администратор отклоняет заявку на закупку',
                        response_model=ApplicationResponse,
                        responses={
                            200: {'model': ApplicationResponse, 'description': 'Заявка отклонена'},
                            400: {'model': ErrorResponse, 'description': 'Некорректный запрос'},
                            401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                            403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                            404: {'model': ValidationError, 'description': 'Ресурс не найден'},
                            409: {'model': ErrorResponse, 'description': 'Конфликт (операция недоступна в текущем состоянии)'}
                        })
async def reject_application(
                        reason: ApplicationRejectRequest,
                        application_id: int, 
                        user=Depends(require_roles(UserRole.ADMIN)),
                        session: AsyncSession = Depends(get_session)
                    ):
    
    try:
        return await applications_manager.reject(session, application_id, reason)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Bad request'
        )