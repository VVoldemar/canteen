from fastapi import APIRouter


orders_router = APIRouter(prefix='/orders', tags=['Orders'])

@orders_router.get('/', summary='Получить список заказов', description='- Ученики видят только свои заказы')
async def get_orders():
    pass


@orders_router.post('/', summary='Создать заказ', description='Оплата разового питания учеником')
async def create_order():
    pass


@orders_router.get('/{order_id}', summary='Получить информацию о заказе', description='')
async def get_order(order_id: int):
    pass


@orders_router.post('/{order_id}/mark-served', summary='Отметить получение питания', description='Ученик может отметить получение своего питания')
async def mark_seved_order(order_id: int):
    pass


@orders_router.post('/{order_id}/cancel', summary='Отменить заказ', description='Отмена заказа (доступно только до момента выдачи)')
async def cancel_order(order_id: int):
    pass


@orders_router.post('/{order_id}/confirm-receipt', summary='Подтвердить получение питания', description='Ученик подтверждает получение питания. Повторная отметка должна приводить к 409.')
async def confirm_order(order_id: int):
    pass


@orders_router.post('/{order_id}/serve', summary='Отметить заказ как выданный', description='Повар отмечает заказ как выданный.')
async def serve_order(order_id: int):
    pass
