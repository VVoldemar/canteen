from fastapi import APIRouter, Depends
from app.core.security.auth import require_roles
from app.core.enums import UserRole
from app.schemas.notification import NotificationResponse

notifications_router = APIRouter(prefix='/notifications', tags=['Notifications'])

@notifications_router.get('/', response_model=NotificationResponse, summary='Список уведомлений' ,description='Пользователь видит свои уведомления.', )
async def get_notifications(user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT))):
    pass


@notifications_router.post('/', summary='Создать уведомление' ,description='Администратор или повар создаёт уведомление (например, изменения меню/статусы заявок).', )
async def create_notification(user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK))):
    pass