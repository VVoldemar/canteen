import os
import aiofiles
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.report import GenerateReportRequest, ReportResponse
from app.core.enums import Reports
from app.crud.reports import reports_manager
from app.core.utils.pdf_gen import ReportGenerator

upload_dir = os.path.join("static", "reports")


def generate_unique_filename(original_filename: str) -> str:
    """ Генерирует случайное имя, сохраняя расширение оригинала """
    extension = os.path.splitext(original_filename)[1]
    
    random_name = uuid4().hex
    
    return f"{random_name}{extension}"


async def generate_report(session: AsyncSession, request: GenerateReportRequest) -> ReportResponse:
    pptx_gen = ReportGenerator()
    
    report_names = {
        Reports.PAYMENT: "Финансовый отчет",
        Reports.ATTEND: "Отчет по посещаемости",
        Reports.DISH: "Отчет по блюдам",
        Reports.ALL: "Полный отчет столовой"
    }
    pptx_gen.add_title_page(report_names[request.report_type], request.date_from, request.date_to)

    
    if request.report_type in [Reports.PAYMENT, Reports.ALL]:
        data = await reports_manager.get_costs_report_data(session, request.date_from, request.date_to)
        pptx_gen.add_payments_section(data)

    if request.report_type in [Reports.ATTEND, Reports.ALL]:
        data = await reports_manager.get_attendance_report_data(session, request.date_from, request.date_to)
        pptx_gen.add_attendance_section(data)

    if request.report_type in [Reports.DISH, Reports.ALL]:
        data = await reports_manager.get_nutrition_report_data(session, request.date_from, request.date_to)
        pptx_gen.add_dishes_section(data)

    file_stream = pptx_gen.get_pdf_bytes()
    
    filename = f"{request.report_type.value}_{request.date_from}_{request.date_to}.pdf"
    
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)
    
    async with aiofiles.open(filepath, "wb") as out_file:
        await out_file.write(file_stream.read())
    report = await reports_manager.create(session, request, filepath)
    return ReportResponse.model_validate(report)