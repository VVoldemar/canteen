from fastapi import APIRouter


reports_router = APIRouter(prefix='/reports', tags=['Reports'])

@reports_router.get('/costs', summary='Отчет по затратам', description='Администратор формирует отчет по затратам на закупки за период.')
async def report_costs(from_date: str, to_date: str):
    pass


@reports_router.get('/nutrition', summary='Отчет по питанию', description='Администратор формирует отчет по питанию (кол-во выданных заказов и разбивка по блюдам) за период.')
async def report_nutrition(from_date: str, to_date: str):
    pass



