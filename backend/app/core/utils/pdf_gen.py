import os
from io import BytesIO
from datetime import date
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors

class ReportGenerator:
    def __init__(self):
        self.buffer = BytesIO()
        self.c = canvas.Canvas(self.buffer, pagesize=A4)
        self.width, self.height = A4
        self.y = self.height - 50
        
        
        font_path = os.path.join("static", "fonts", "DejaVuSans.ttf")
        if os.path.exists(font_path):
            pdfmetrics.registerFont(TTFont('DejaVu', font_path))
            self.font_name = 'DejaVu'
        else:
            self.font_name = 'Helvetica'

    def _check_space(self, height_needed):
        if self.y - height_needed < 50:
            self.c.showPage()
            self.y = self.height - 50

    def add_title_page(self, title: str, date_from: date, date_to: date):
        self._check_space(100)
        
        
        self.c.setFont(self.font_name, 20)
        self.c.drawCentredString(self.width / 2, self.y, title.upper())
        
        self.y -= 30
        self.c.setFont(self.font_name, 12)
        self.c.setFillColor(colors.grey)
        self.c.drawCentredString(self.width / 2, self.y, f"Период отчета: {date_from} — {date_to}")
        
        self.c.setFillColor(colors.black) 
        self.y -= 60

    def add_payments_section(self, data):
        self._check_space(100)
        self.c.setFont(self.font_name, 14)
        self.c.drawString(50, self.y, "ФИНАНСОВЫЙ ОТЧЕТ (ЗАКУПКИ)")
        self.y -= 25
        
        self.c.setFont(self.font_name, 12)
        
        rubles = data.estimated_total_cost_kopecks / 100
        
        
        self.c.drawString(60, self.y, f"• Количество заявок на закупку: {data.procurement_applications}")
        self.y -= 20
        self.c.drawString(60, self.y, f"• Общая стоимость: {rubles:,.2f} ₽".replace(",", " "))
        self.y -= 50

    def add_attendance_section(self, data):
        
        
        self._check_space(150)
        self.c.setFont(self.font_name, 14)
        self.c.drawString(50, self.y, "ПОСЕЩАЕМОСТЬ И АНАЛИТИКА ЗАКАЗОВ")
        self.y -= 25
        
        self.c.setFont(self.font_name, 12)
        
        
        meals = data.get("meals", 0)
        calories = data.get("total_calories", 0)
        cancelled = data.get("cancelled_orders", 0)
        ratio = data.get("cancellation_ratio", 0)

        self.c.drawString(60, self.y, f"• Всего приемов пищи (выдано): {meals}")
        self.y -= 20
        self.c.drawString(60, self.y, f"• Отмененных заказов: {cancelled}")
        self.y -= 20
        
        ratio_percent = ratio * 100
        self.c.drawString(60, self.y, f"• Доля отменённых заказов от общего числа: {ratio_percent:.1f}%")
        self.y -= 35

        
        popularity = data.get("popularity", [])
        if popularity:
            self._check_space(100)
            self.c.setFont(self.font_name, 13)
            self.c.drawString(50, self.y, "ТОП ПОПУЛЯРНЫХ БЛЮД:")
            self.y -= 20
            
            self.c.setFont(self.font_name, 11)
            for i, dish in enumerate(popularity, 1):
                
                name = dish.get('name', 'Н/Д')
                count = dish.get('count', 0)
                
                self.c.drawString(70, self.y, f"{i}. {name} — {count} порц.")
                self.y -= 18
                self._check_space(20)

        self.y -= 30

    def add_dishes_section(self, data):
        """
        """
        self._check_space(150)
        self.c.setFont(self.font_name, 14)
        self.c.drawString(50, self.y, "СТАТИСТИКА ПО БЛЮДАМ")
        self.y -= 30

        
        table_data = [["Название блюда", "Количество"]]
        
        
        for item in data.dishes_breakdown:
            
            
            table_data.append([
                str(item.dish_name), 
                str(item.quantity)
            ])

        
        if not data.dishes_breakdown:
            
            self.c.setFont(self.font_name, 12)
            self.c.drawString(60, self.y, "Нет данных за выбранный период")
            self.y -= 30
            return

        table = Table(table_data, colWidths=[350, 100])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), self.font_name),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))

        w, h = table.wrapOn(self.c, self.width - 100, self.height)
        if self.y - h < 50:
            self.c.showPage()
            self.y = self.height - 50
        
        table.drawOn(self.c, 50, self.y - h)
        self.y -= (h + 40)
        
    def get_pdf_bytes(self) -> BytesIO:
        self.c.save()
        self.buffer.seek(0)
        return self.buffer