from typing import Generator
from app.db.session import SessionLocalAsync


def get_db() -> Generator:
    """Dependency that provides a database session."""
    try:
        db = SessionLocalAsync()
        yield db
    finally:
        db.close()
        
async def get_db() -> AsyncSession:
    async with SessionLocalAsync() as session:
        yield session
    await engine.dispose()
    