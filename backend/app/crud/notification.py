from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc, or_
from app.models.notification import Notification

from app.core.websockets_manager import websocket_manager
from app.core.enums import UserRole


class NotificationCRUD:
    def __init__(self, model=Notification):
        self.model = model

    async def create_and_send(self, session: AsyncSession, user_id: int, title: str, body: str):
        try:
            db_obj = self.model(
                user_id=user_id,
                title=title,
                body=body,
                read=False
            )
            session.add(db_obj)
            await session.commit()
            await session.refresh(db_obj)

            await websocket_manager.send_personal_message(
                user_id=user_id,
                message={"id": db_obj.id, "title": db_obj.title}
            )
            return db_obj
        except Exception as e:
            await session.rollback()
        
            return None
        
    async def create_and_send_for_role(self, session: AsyncSession, role: UserRole, title: str, body: str):
        try:
            db_obj = self.model(
                role=role,
                title=title,
                body=body,
                read=False
            )
            session.add(db_obj)
            await session.commit()
            await session.refresh(db_obj)

            await websocket_manager.broadcast_to_role(
                role=role,
                message={"id": db_obj.id, "title": db_obj.title}
            )
            return db_obj
        except Exception as e:
            await session.rollback()
        
            return None

    async def mark_as_read(self, session: AsyncSession, notification_id: int, user_id: int) -> Notification:
        stmt = (
            update(self.model)
            .where(self.model.id == notification_id, self.model.user_id == user_id)
            .values(read=True)
            .returning(self.model)
        )
        result = await session.execute(stmt)
        db_obj = result.scalar_one_or_none()
        await session.commit()
        return db_obj

    async def get_all_by_user(self, session: AsyncSession, user_id: int, user_role: UserRole):
        stmt = select(self.model).where(or_(self.model.user_id == user_id, self.model.role == user_role)).order_by(desc(self.model.created_at))
        result = await session.execute(stmt)
        return result.scalars().all()
    
    async def get_by_id(self, session: AsyncSession, notification_id: int) -> Optional[Notification]:
        stmt = select(self.model).where(self.model.id == notification_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

notifications_manager = NotificationCRUD()