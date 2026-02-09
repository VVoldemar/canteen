# from typing import Generator
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import SessionLocalAsync
from typing import AsyncGenerator


# def get_session() -> Generator:
#     """Dependency that provides a database session."""
#     try:
#         db = SessionLocalAsync()
#         yield db
#     finally:
#         db.close()
        
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocalAsync() as session:
        yield session
    