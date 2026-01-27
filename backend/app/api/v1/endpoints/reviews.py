from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional

from app.core.security.auth import require_roles
from app.core.enums import UserRole

from app.api.deps import get_session
from app.crud.review import reviews_manager
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.review import ReviewResponse, CreateReviewRequest, UpdateReviewRequest
from app.schemas.validation import ValidationError, ErrorResponse
from app.schemas.paginating import PaginationParams, PaginatedResponse


reviews_router = APIRouter(prefix='/reviews', tags=['Reviews'])

@reviews_router.get('/', summary='Получить список отзывов', description='',
                    response_model=PaginatedResponse,
                    responses={
                        200: {'model': PaginatedResponse, 'description': 'Список отзывов'}
                    })
async def get_reviews(
                    params: PaginationParams,
                    session: AsyncSession = Depends(get_session),
                    dish_id: Optional[int] = None,
                ):
    
    reviews = await reviews_manager.get_all_paginated(session, params, dish_id)
    return PaginatedResponse(
        items=reviews.items,
        total=reviews.total,
        page=reviews.page,
        pages=reviews.pages
    )


@reviews_router.post('/{dish_id}', response_model=ReviewResponse, summary='Оставить отзыв', description='Ученик может оставить отзыв о блюде',
                    responses={
                        200: {'model': ReviewResponse, 'description': 'Отзыв создан'},
                        400: {'model': ErrorResponse, 'description': 'Некорректный запрос'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'}
                    })
async def create_review(
                    review_in: CreateReviewRequest,
                    dish_id: int,
                    session: AsyncSession = Depends(get_session),
                    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT))
                ):
    
    try:
        new_review = await reviews_manager.create(session, user.id, dish_id, review_in)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Bad request'
        )

    return new_review
        

@reviews_router.get('/{review_id}', response_model=ReviewResponse, summary='Получить отзыв', description='',
                    responses={
                        200: {'model': ReviewResponse, 'description': 'Отзыв'},
                        404: {'model': ValidationError, 'description': 'Ресурс не найден'}
                    })
async def get_review(
                review_id: int, 
                session: AsyncSession = Depends(get_session), 
                user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT))
            ):
    
    try:
        review = await reviews_manager.get_by_id(session, review_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Bad request'
        )
    
    return ReviewResponse(
        id=review_id,
        user_id=review.user_id,
        rating=review.rating,
        content=review.content,
        datetime=review.datetime
    )


@reviews_router.patch('/{review_id}', response_model=ReviewResponse, summary='Обновить отзыв', description='Автор может обновить свой отзыв',
                    responses={
                        200: {'model': ReviewResponse, 'description': 'Отзыв обновлен'},
                        400: {'model': ErrorResponse, 'description': 'Некорректный запрос'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                        404: {'model': ValidationError, 'description': 'Ресурс не найден'}
                    })
async def update_review(
                review_id: int, 
                review_in: UpdateReviewRequest,
                session: AsyncSession = Depends(get_reviews),
                user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT))
            ):
    
    try:
        updated_review = await reviews_manager.update(session, review_id, review_in)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Bad request'
        )

    return updated_review


@reviews_router.delete('/{review_id}', summary='Удалить отзыв', description='Автор или администратор может удалить отзыв',
                        responses={
                            200: {'description': 'Отзыв удалён'},
                            401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                            403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                            404: {'model': ErrorResponse, 'description': 'Ресурс не найден'}
                        }, 
                    )
async def delete_review(
                review_id: int, 
                session: AsyncSession = Depends(get_reviews), 
                user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT))
            ):
    
    delete_review_status = await reviews_manager.delete(session, review_id)
    return {'status': delete_review_status}