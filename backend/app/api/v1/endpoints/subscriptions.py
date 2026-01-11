from fastapi import APIRouter, Depends
from app.core.security.auth import require_roles


subscriptions_router = APIRouter(prefix='/subscriptions', tags=['Subscriptions'])

@subscriptions_router.get('/my', summary='Получить информацию об абонементе', description='Получить активный абонемент текущего пользователя')
async def get_my_subscriptions(user=Depends(require_roles('student', 'admin', 'cook'))):
    pass


@subscriptions_router.post('/purchase', summary='Купить абонемент', description='Оплата абонемента на питание')
async def purchase_subscriptions(user=Depends(require_roles('student', 'admin', 'cook'))):
    pass