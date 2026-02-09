from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, Select, distinct, desc



from app.models.order import Order
from app.models.associations import OrderItem
from app.models.dish import Dish
from app.models.report import Report
from app.models.application import Application
from app.models.associations import ApplicationItem
from app.models.dish import Ingredient

from app.core.enums import OrderStatus

from app.schemas.report import (
    CostsReportResponse,
    GenerateReportRequest,
    NutritionReportResponse,
    NutritionDishBreakdown,
)

class ReportCRUD:
    def __init__(self):
        self.model = Report


    async def create(self, session: AsyncSession, data: GenerateReportRequest, download_url: str):
        new_report = self.model(
            report_type=data.report_type,
            download_url=download_url,
            date_from=data.date_from,
            date_to=data.date_to
        )
        session.add(new_report)
        await session.commit()
        await session.refresh(new_report)
        return new_report


    async def get(self, session: AsyncSession, data_in: GenerateReportRequest):
        stmt = select(self.model).where(
            self.model.report_type == data_in.report_type,
            self.model.date_from == data_in.date_from,
            self.model.date_to == data_in.date_to
        ).order_by(self.model.generated_at.desc())
        result = await session.execute(stmt)
        return result.scalars().first()


    async def create_report_entry(self, report_type: str, download_url: str, date_from: datetime = None, date_to: datetime = None):
        new_report = self.model(
            report_type=report_type,
            download_url=download_url,
            from_=date_from,
            to=date_to
        )
        self.session.add(new_report)
        await self.session.commit()
        await self.session.refresh(new_report)
        return new_report
    async def get_costs_report_data(
        self, session: AsyncSession, date_from: date = None, date_to: date = None
        ) -> CostsReportResponse:
        
        if date_from is None:
            date_from = datetime.now().date() - timedelta(days=7)
        if date_to is None:
            date_to = datetime.now().date()
        
        stmt = (
            select(
                func.count(func.distinct(Application.id)).label("app_count"),
                func.sum(ApplicationItem.quantity * Ingredient.price).label("total_cost")
            )
            .select_from(Application)
            .join(Application.products)
            .join(ApplicationItem.ingredient)
            .where(Application.status != OrderStatus.CANCELLED)
        )
        stmt = self._apply_date_filter(stmt, Application.datetime, date_from, date_to)
        
        result = (await session.execute(stmt)).one()
        
        return CostsReportResponse(
            **{
                "from": date_from,
                "to": date_to,
                "procurement_applications": result.app_count or 0,
                "estimated_total_cost_kopecks": result.total_cost or 0
            }
        )

    async def get_nutrition_report_data(
            self, session: AsyncSession, date_from: date = None, date_to: date = None
        ) -> NutritionReportResponse:
            """
            Отчет по питанию: общее кол-во выданных заказов и детальная разбивка по блюдам.
            """
            
            if date_from is None:
                date_from = datetime.now().date() - timedelta(days=7)
            if date_to is None:
                date_to = datetime.now().date()
            
            stmt_count = (
                select(func.count(Order.id))
                .where(Order.status == OrderStatus.SERVED)
            )
            stmt_count = self._apply_date_filter(stmt_count, Order.ordered_at, date_from, date_to)

            served_orders_result = await session.execute(stmt_count)
            served_orders = served_orders_result.scalar() or 0

            
            
            stmt_dishes = (
                select(
                    Dish.id.label("dish_id"),
                    Dish.name.label("dish_name"),
                    func.sum(OrderItem.quantity).label("total_qty")
                )
                .select_from(OrderItem)
                .join(Order, OrderItem.order_id == Order.id) 
                .join(Dish, OrderItem.dish_id == Dish.id)    
                .where(Order.status == OrderStatus.SERVED)
            )

            
            stmt_dishes = self._apply_date_filter(stmt_dishes, Order.ordered_at, date_from, date_to)

            
            stmt_dishes = stmt_dishes.group_by(Dish.id, Dish.name)

            dish_rows = (await session.execute(stmt_dishes)).all()

            
            breakdown = [
                NutritionDishBreakdown(
                    dish_id=row.dish_id,
                    dish_name=row.dish_name,
                    quantity=row.total_qty
                ) for row in dish_rows
            ]

            
            
            return NutritionReportResponse(
                **{
                    "from": date_from,
                    "to": date_to,
                    "served_orders": served_orders,
                    "dishes_breakdown": breakdown
                }
            )

    async def get_attendance_report_data(self, session: AsyncSession, date_from: date = None, date_to: date = None):
        
        if date_from is None:
            date_from = datetime.now().date() - timedelta(days=7)
        if date_to is None:
            date_to = datetime.now().date()
       
        stats_stmt = (
            select(
                func.count(distinct(Order.id)).filter(Order.status == OrderStatus.SERVED).label("served_count"),
                func.count(distinct(Order.id)).filter(Order.status == OrderStatus.CANCELLED).label("cancelled_count"),
            )
            .select_from(Order)
            .outerjoin(OrderItem, Order.id == OrderItem.order_id)
            .outerjoin(Dish, OrderItem.dish_id == Dish.id)
        )
        stats_stmt = self._apply_date_filter(stats_stmt, Order.ordered_at, date_from, date_to)
        
        stats_result = (await session.execute(stats_stmt)).one()
       
        popularity_stmt = (
            select(
                Dish.name,
                func.sum(OrderItem.quantity).label("total_quantity")
            )
            .select_from(OrderItem)
            .join(Order, OrderItem.order_id == Order.id)
            .join(Dish, OrderItem.dish_id == Dish.id)
            .where(Order.status == OrderStatus.SERVED)
            .group_by(Dish.id, Dish.name)
            .order_by(desc("total_quantity"))
            .limit(5)
        )
        popularity_stmt = self._apply_date_filter(popularity_stmt, Order.ordered_at, date_from, date_to)
        popularity_rows = (await session.execute(popularity_stmt)).all()
        
        popularity_list = [
            {"name": row.name, "count": row.total_quantity} 
            for row in popularity_rows
        ]

        served = stats_result.served_count or 0
        cancelled = stats_result.cancelled_count or 0
        
        ratio = round(cancelled / served, 2) if served > 0 else 0

        return {
            "from": date_from,
            "to": date_to,
            "meals": served,
            "cancelled_orders": cancelled,
            "cancellation_ratio": ratio,
            "popularity": popularity_list
        }
    
    def _apply_date_filter(self, stmt: Select, column, date_from, date_to) -> Select:
        """
        Вспомогательный метод для фильтрации запроса по диапазону дат.
        """
        if date_from:
            
            stmt = stmt.where(column >= date_from)
        if date_to:
            stmt = stmt.where(column <= date_to)
        return stmt

reports_manager = ReportCRUD()