from fastapi import APIRouter


notifications_router = APIRouter(prefix='/notifications', tags=['Notifications'])

@notifications_router.get('/', summary='Список уведомлений' ,description='Пользователь видит свои уведомления.', )
async def get_notifications():
    pass


@notifications_router.post('/', summary='Создать уведомление' ,description='Администратор или повар создаёт уведомление (например, изменения меню/статусы заявок).', )
async def create_notification():
    pass