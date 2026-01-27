from fastapi import APIRouter, Depends

from app.core.security.auth import require_roles
from app.core.enums import UserRole

from app.api.deps import get_session
from app.crud.user import users_manager
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.subscription import SubscriptionResponse, PurchaseSubscriptionRequest
from app.schemas.validation import ErrorResponse


subscriptions_router = APIRouter(prefix='/subscriptions', tags=['Subscriptions'])

@subscriptions_router.get('/my', summary='Получить информацию об абонементе', description='Получить активный абонемент текущего пользователя',
                        response_model=SubscriptionResponse,
                        responses={
                            200: {'model': SubscriptionResponse, 'description': 'Информация об абонементе'},
                            401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                            404: {'model': ErrorResponse, 'description': 'Активный абонемент не найден'}
                        })
async def get_my_subscriptions(
                        user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT)),
                        session: AsyncSession = Depends(get_session)
                    ):
    
    return await users_manager.get_subscription_info(session, user.id)


@subscriptions_router.post('/purchase', summary='Купить абонемент', description='Оплата абонемента на питание',
                        response_model=SubscriptionResponse,
                        responses={
                            200: {'model': SubscriptionResponse, 'description': 'Абонемент успешно приобретен'},
                            400: {'description': 'Недостаточно средств или ошибка в запросе'},
                            401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        })
async def purchase_subscriptions(
                        subscription_data: PurchaseSubscriptionRequest,
                        user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT)),
                        session: AsyncSession = Depends(get_session)
                    ):
    
    return await users_manager.purchase_subscription(session, user.id, subscription_data)