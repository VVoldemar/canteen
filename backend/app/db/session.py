from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.core.config import settings

from app.models import SqlAlchemyBase

engine = create_async_engine(settings.database_url, pool_pre_ping=True)

SessionLocalAsync = async_sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine)
