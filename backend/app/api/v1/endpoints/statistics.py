from fastapi import APIRouter


statistics_router = APIRouter(tags=['Statistics'])

@statistics_router.get('/statistics/payments', summary='Статистика оплат', description='Доступно только администраторам')
async def get_payments(from_date: str, to_date: str):
    pass


@statistics_router.get('/statistics/attendance', summary='Статистика посещаемости', description='Доступно только администраторам')
async def get_attendance(from_date: str, to_date: str):
    pass


@statistics_router.get('/statistics/dishes', summary='Статистика по блюдам', description='Популярность блюд, средние оценки. Доступно администраторам')
async def get_dishes_stat(from_date: str, to_date: str):
    pass


@statistics_router.post('/reports/generate', summary='Сформировать отчет', description='Aдминистратор формирует отчет по питанию и затратам')
async def generate_report():
    pass