from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from fastapi import HTTPException, status
import logging

from app.models.blacklisted_token import BlacklistedToken


logger = logging.getLogger(__name__)

class BlacklistedTokenCRUD:
    def __init__(self, model):
        self.model = model

    async def get_by_jti(self, session: AsyncSession, jti: str) -> BlacklistedToken:
        """
        Возвращает ORM модель.
        """
        stmt = select(self.model).where(self.model.jti == jti)
        result = await session.execute(stmt)
        token = result.scalar_one_or_none()

        if not token:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token not found in blacklist"
            )
        return token

    async def get_by_id(self, session: AsyncSession, id: int) -> BlacklistedToken:
        """
        Возвращает ORM модель.
        """
        stmt = select(self.model).where(self.model.id == id)
        result = await session.execute(stmt)
        token = result.scalar_one_or_none()

        if not token:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token not found in blacklist"
            )
        return token

    async def create(self, session: AsyncSession, jti: str, expires_at: datetime) -> BlacklistedToken:
        try:
            stmt = select(self.model).where(self.model.jti == jti)
            if (await session.execute(stmt)).scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Token already in blacklist"
                )

            db_token = self.model(
                jti=jti,
                expires_at=expires_at,
            )

            session.add(db_token)
            await session.commit()
            await session.refresh(db_token)
            return db_token

        except HTTPException:
            raise
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating token: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create token. {e}")

    async def delete(self, session: AsyncSession, jti: str) -> bool:
            """Delete a token by jti."""
            try:
                stmt = select(self.model).where(self.model.jti == jti)
                result = await session.execute(stmt)
                token = result.scalar_one_or_none()

                if not token:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail='Token not found'
                    )
                await session.delete(token)
                await session.commit()

                logger.info(f'Token {jti} deleted successfully')
                return True

            except HTTPException:
                raise
            except Exception as e:
                await session.rollback() 
                logger.error(f'Error deleting token with jti {jti}: {e}')
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail='Failed to delete token'
                )


blacklisted_token_manager = BlacklistedTokenCRUD(BlacklistedToken)