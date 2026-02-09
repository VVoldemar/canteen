
from datetime import datetime
from sqlalchemy import Enum as SAEnum, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import SqlAlchemyBase
from app.core.enums import Reports

class Report(SqlAlchemyBase):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    report_type: Mapped[Reports] = mapped_column(SAEnum(Reports, native_enum=False), nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    
    download_url: Mapped[str] = mapped_column(String, nullable=False)
    
    date_from: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    date_to: Mapped[datetime] = mapped_column(DateTime, nullable=True)