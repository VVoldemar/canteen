import logging
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from fastapi import HTTPException, status

from app.models.notification import Notification
from app.schemas.notification import CreateNotificationRequest
from app.core.websockets_manager import notification_manager 

logger = logging.getLogger(__name__)

class NotificationCRUD:
    def __init__(self, model=Notification):
        self.model = model

    async def create(self, session: AsyncSession, obj_in: CreateNotificationRequest) -> Notification:
        """Создает уведомление в БД и отправляет его через WebSocket."""
        try:
            db_obj = self.model(
                title=obj_in.title,
                body=obj_in.body,
                user_id=obj_in.user_id,
                read=False
            )
            session.add(db_obj)
            await session.commit()
            await session.refresh(db_obj)
            await notification_manager.send_personal_notification(
                user_id=db_obj.user_id,
                message={
                    "id": db_obj.id,
                    "title": db_obj.title,
                    "body": db_obj.body,
                    "created_at": db_obj.created_at.isoformat()
                }
            )

            return db_obj
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating notification: {e}")
            raise HTTPException(status_code=500, detail="Failed to create notification")
            
    async def get_all_by_user(self, session: AsyncSession, user_id: int):
        stmt = select(self.model).where(self.model.user_id == user_id).order_by(self.model.created_at.desc())
        result = await session.execute(stmt)
        return result.scalars().all()
 
    async def get_user_notifications(
        self, session: AsyncSession, user_id: int, unread_only: bool = False
    ) -> List[Notification]:
        """Получить уведомления конкретного пользователя."""
        query = select(self.model).where(self.model.user_id == user_id)
        if unread_only:
            query = query.where(self.model.read == False)
        
        query = query.order_by(self.model.created_at.desc())
        result = await session.execute(query)
        return result.scalars().all()

    async def mark_as_read(self, session: AsyncSession, notification_id: int, user_id: int) -> Notification:
        """Пометить уведомление как прочитанное."""
        stmt = (
            update(self.model)
            .where(self.model.id == notification_id, self.model.user_id == user_id)
            .values(read=True)
            .returning(self.model)
        )
        result = await session.execute(stmt)
        db_obj = result.scalar_one_or_none()
        
        if not db_obj:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        await session.commit()
        return db_obj

    async def delete_all_for_user(self, session: AsyncSession, user_id: int):
        """Очистить все уведомления пользователя."""
        stmt = delete(self.model).where(self.model.user_id == user_id)
        await session.execute(stmt)
        await session.commit()

notifications_manager = NotificationCRUD()