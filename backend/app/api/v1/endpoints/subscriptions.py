from fastapi import APIRouter


subscriptions_router = APIRouter(prefix='/subscriptions', tags=['Subscriptions'])

@subscriptions_router.get('/my', summary='Получить информацию об абонементе', description='Получить активный абонемент текущего пользователя')
async def get_my_subscriptions():
    pass


@subscriptions_router.post('/purchase', summary='Купить абонемент', description='Оплата абонемента на питание')
async def purchase_subscriptions():
    pass