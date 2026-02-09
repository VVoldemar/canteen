from fastapi import APIRouter, Depends, status, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.security.auth import require_roles
from app.core.security.jwt import decode_token
from app.core.enums import UserRole
from app.core.websockets_manager import notification_manager

from app.schemas.notification import NotificationResponse, CreateNotificationRequest 
from app.schemas.validation import ErrorResponse, ValidationError
from app.api.deps import get_session
from app.crud.notification import notifications_manager

notifications_router = APIRouter(prefix='/notifications', tags=['Notifications'])

ws_router = APIRouter()

@ws_router.websocket("/ws/notifications")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4003)
            return
        user_id = int(user_id)
    except Exception:
        await websocket.close(code=4003)
        return
    
    await notification_manager.connect(user_id, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(user_id, websocket)


@notifications_router.get('/', 
                        summary='Список уведомлений', 
                        description='Пользователь видит свои уведомления.',
                        response_model=List[NotificationResponse], 
                        responses={
                            200: {'model': List[NotificationResponse], 'description': 'OK'},
                            401: {'model': ErrorResponse, 'description': 'Не авторизован'}
                        })
async def get_notifications(
                        user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT)),
                        session: AsyncSession = Depends(get_session)
                    ):
    
    return await notifications_manager.get_all_by_user(session, user_id=user.id)


@notifications_router.post('/', 
                           summary='Создать уведомление', 
                           description='Администратор или повар создаёт уведомление.', 
                           response_model=NotificationResponse,
                           status_code=status.HTTP_201_CREATED,
                           responses={
                               201: {'model': NotificationResponse, 'description': 'Уведомление создано'},
                               401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                               403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                               422: {'model': ValidationError, 'description': 'Ошибка валидации'},
                           })
async def create_notification(
    notification_in: CreateNotificationRequest, 
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK)),
    session: AsyncSession = Depends(get_session)
):
    return await notifications_manager.create(session, notification_in)


@notifications_router.patch(
    "/{notification_id}/read", 
    summary="Отметить прочитанным", 
    response_model=NotificationResponse 
)
async def make_readed(
    notification_id: int, 
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK, UserRole.STUDENT)),
    session: AsyncSession = Depends(get_session)
):
    notification = await notifications_manager.get_by_id(session, notification_id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    if notification.user_id != user.id:
        raise HTTPException(status_code=403, detail="It's not your notification")

    return await notifications_manager.mark_as_read(session, notification_id)