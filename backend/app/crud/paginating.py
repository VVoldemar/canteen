import math
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select
from app.schemas.paginating import PaginatedResponse, PaginationParams

async def paginate(
                   session: AsyncSession,
                   query: Select,
                   params: PaginationParams
                  ) -> PaginatedResponse:
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    offset = (params.page - 1) * params.size
    paginated_query = query.offset(offset).limit(params.size)
    
    result = await session.execute(paginated_query)
    items = result.scalars().all()

    pages = math.ceil(total / params.size) if params.size > 0 else 0

    return PaginatedResponse(
                            items=items,
                            total=total,
                            page=params.page,
                            pages=pages
                            )