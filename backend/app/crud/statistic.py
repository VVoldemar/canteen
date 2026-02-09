from datetime import date, datetime, time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case



from app.models.order import Order
from app.models.associations import OrderItem
from app.models.dish import Dish
from app.models.review import Review
from app.models.user import User

from app.core.enums import OrderStatus


from app.schemas.statistic import (
    PaymentStatisticsResponse,
    AttendanceStatisticsResponse,
    AttendanceStatisticsByDay,
    DishStatisticsResponse,
    DishStatistic,
)
from app.schemas.dish import DishResponse

class StatisticCRUD:
    def _apply_date_filter(self, query, model_date_field, date_from: date, date_to: date):
        dt_from = datetime.combine(date_from, time.min)
        dt_to = datetime.combine(date_to, time.max)
        return query.where(and_(model_date_field >= dt_from, model_date_field <= dt_to))

    async def get_payment_statistics(
        self, session: AsyncSession, date_from: date, date_to: date
    ) -> PaymentStatisticsResponse:

        stmt_orders = (
            select(
                func.count(Order.id).label("count"),
                func.sum(Dish.price * OrderItem.quantity).label("total_amount")
            )
            .select_from(Order)
            .join(Order.dishes)
            .join(OrderItem.dish)
            .where(Order.status.in_([OrderStatus.PAID, OrderStatus.SERVED]))
        )
        stmt_orders = self._apply_date_filter(stmt_orders, Order.ordered_at, date_from, date_to)
        
        result_orders = (await session.execute(stmt_orders)).one()
        orders_count = result_orders.count or 0
        total_order_amount = result_orders.total_amount or 0

        stmt_subs = select(func.count(User.id)).where(User.subscription_start.isnot(None))
        stmt_subs = self._apply_date_filter(stmt_subs, User.subscription_start, date_from, date_to)
        
        subscriptions_count = (await session.execute(stmt_subs)).scalar() or 0

        avg_amount = 0
        if orders_count > 0:
            avg_amount = int(total_order_amount / orders_count)

        return PaymentStatisticsResponse(
            total_amount=total_order_amount, 
            orders_count=orders_count,
            subscriptions_count=subscriptions_count,
            average_order_amount=avg_amount,
            period={"from": date_from, "to": date_to}
        )

    async def get_attendance_statistics(
        self, session: AsyncSession, date_from: date, date_to: date
    ) -> AttendanceStatisticsResponse:
        

        stmt_base = select(Order.status).select_from(Order)
        stmt_base = self._apply_date_filter(stmt_base, Order.ordered_at, date_from, date_to)
        stmt_base = stmt_base.where(Order.status != OrderStatus.CANCELLED)
        
        result_all = (await session.execute(stmt_base)).scalars().all()
        
        total_paid = len(result_all)
        total_served = len([s for s in result_all if s == OrderStatus.SERVED])
        
        attendance_rate = 0.0
        if total_paid > 0:
            attendance_rate = round((total_served / total_paid) * 100, 2)

        stmt_by_date = (
            select(
                func.date(Order.ordered_at).label("day"),
                func.count(Order.id).label("total"),
                func.sum(case((Order.status == OrderStatus.SERVED, 1), else_=0)).label("served")
            )
            .where(and_(
                Order.ordered_at >= datetime.combine(date_from, time.min),
                Order.ordered_at <= datetime.combine(date_to, time.max),
                Order.status != OrderStatus.CANCELLED
            ))
            .group_by(func.date(Order.ordered_at))
            .order_by("day")
        )
        
        result = await session.execute(stmt_by_date)
        by_date_rows = result.all()
        
        by_date_list = []
        for row in by_date_rows:
            # SQLite's date() function returns string in YYYY-MM-DD format
            date_value = date.fromisoformat(row.day) if isinstance(row.day, str) else row.day
            by_date_list.append(AttendanceStatisticsByDay(
                date=date_value,
                paid=row.total,
                served=row.served or 0
            ))

        return AttendanceStatisticsResponse(
            total_served=total_served,
            total_paid=total_paid,
            attendance_rate=attendance_rate,
            by_date=by_date_list
        )

    async def get_dish_statistics(
        self, session: AsyncSession, date_from: date, date_to: date
    ) -> DishStatisticsResponse:
        
        stmt_sales = (
            select(
                Dish,
                func.count(OrderItem.dish_id).label("orders_count")
            )
            .select_from(Dish)
            .join(OrderItem)
            .join(Order)
            .where(Order.status != OrderStatus.CANCELLED)
        )
        stmt_sales = self._apply_date_filter(stmt_sales, Order.ordered_at, date_from, date_to)
        stmt_sales = stmt_sales.group_by(Dish.id)
        
        sales_result = (await session.execute(stmt_sales)).all()
        
        stmt_reviews = (
            select(
                Review.dish_id,
                func.count(Review.id).label("review_count"),
                func.avg(Review.rating).label("avg_rating")
            )
            .select_from(Review)
        )
        stmt_reviews = self._apply_date_filter(stmt_reviews, Review.datetime, date_from, date_to)
        stmt_reviews = stmt_reviews.group_by(Review.dish_id)
        
        reviews_result = (await session.execute(stmt_reviews)).all()
        
        reviews_map = {r.dish_id: (r.review_count, r.avg_rating) for r in reviews_result}
        
        items = []
        for row in sales_result:
            dish_obj = row.Dish
            orders_count = row.orders_count
            
            r_count, r_avg = reviews_map.get(dish_obj.id, (0, None))
            
            avg_rating_val = round(float(r_avg), 1) if r_avg else None

            items.append(DishStatistic(
                dish=DishResponse(id=dish_obj.id, name=dish_obj.name, price=dish_obj.price), 
                orders_count=orders_count,
                average_rating=avg_rating_val,
                reviews_count=r_count
            ))
            
        return DishStatisticsResponse(dishes=items)


statistic_manager = StatisticCRUD()