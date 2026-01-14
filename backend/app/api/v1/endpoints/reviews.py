from fastapi import APIRouter, Depends
from app.core.security.auth import require_roles
from app.core.enums import UserRole


reviews_router = APIRouter(prefix='/reviews', tags=['Reviews'])

@reviews_router.get('/', summary='Получить список отзывов', description='')
async def get_reviews():
    pass


@reviews_router.post('/', summary='Оставить отзыв', description='Ученик может оставить отзыв о блюде')
async def create_review(user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT))):
    pass


@reviews_router.get('/{review_id}', summary='Получить отзыв', description='')
async def get_review(review_id: int, user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT))):
    pass


@reviews_router.patch('/{review_id}', summary='Обновить отзыв', description='Автор может обновить свой отзыв')
async def update_review(review_id: int, user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT))):
    pass


@reviews_router.delete('/{review_id}', summary='Удалить отзыв', description='Автор или администратор может удалить отзыв')
async def delete_review(review_id: int, user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT))):
    pass