from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security.auth import require_roles
from app.core.enums import UserRole
from app.schemas.notification import NotificationResponse, CreateNotificationRequest
from app.schemas.validation import ErrorResponse, ValidationError
from app.api.deps import get_session


notifications_router = APIRouter(prefix='/notifications', tags=['Notifications'])

@notifications_router.get('/', summary='Список уведомлений', description='Пользователь видит свои уведомления.',
                        response_model=NotificationResponse,
                        responses={
                            200: {'model': NotificationResponse, 'description': 'OK'},
                            401: {'model': ErrorResponse, 'description': 'Не авторизован'}
                        })
async def get_notifications(
                        user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT)),
                        session: AsyncSession = Depends(get_session)
                    ):
    pass


@notifications_router.post('/', summary='Создать уведомление' ,description='Администратор или повар создаёт уведомление (например, изменения меню/статусы заявок).', 
                           response_model=NotificationResponse,
                           responses={
                               201: {'model': NotificationResponse, 'description': 'Некорректный запрос'},
                               401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                               403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                               422: {'model': ValidationError, 'description': 'Ошибка валидации'},
                           })
async def create_notification(user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK))):
    pass