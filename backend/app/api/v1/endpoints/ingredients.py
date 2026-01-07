from fastapi import APIRouter


ingredients_router = APIRouter(prefix='/ingredients', tags=['Ingredients'])

@ingredients_router.get('/', summary='Получить список ингредиентов', description='')
async def get_ingredients():
    pass


@ingredients_router.post('/', summary='Добавить ингредиент', description='Доступно только администраторам и поварам')
async def add_ingredient():
    pass


@ingredients_router.get('/{ingredient_id}', summary='Получить информацию об ингредиенте', description='')
async def get_ingredient(ingredient_id: int):
    pass


@ingredients_router.patch('/{ingredient_id}', summary='Обновить ингредиент', description='Доступно только администраторам и поварам')
async def update_ingredient(ingredient_id: int):
    pass


@ingredients_router.delete('/{ingredient_id}', summary='Удалить ингредиент', description='Доступно только администраторам')
async def delete_ingredient(ingredient_id: int):
    pass