from fastapi import FastAPI

from app.api.v1.endpoints.auth import auth_router
from app.api.v1.endpoints.users import users_router
from app.api.v1.endpoints.menu import menu_router
from app.api.v1.endpoints.dishes import dishes_router
from app.api.v1.endpoints.orders import orders_router
from app.api.v1.endpoints.reviews import reviews_router
from app.api.v1.endpoints.applications import applications_router
from app.api.v1.endpoints.ingredients import ingredients_router
from app.api.v1.endpoints.statistics import statistics_router
from app.api.v1.endpoints.notifications import notifications_router, ws_router
from app.api.v1.endpoints.reports import reports_router
from app.api.v1.endpoints.subscriptions import subscriptions_router


def include_routers(app: FastAPI):
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(menu_router)
    app.include_router(dishes_router)
    app.include_router(orders_router)
    app.include_router(reviews_router)
    app.include_router(applications_router)
    app.include_router(ingredients_router)
    app.include_router(statistics_router)
    app.include_router(subscriptions_router)
    app.include_router(notifications_router)
    app.include_router(ws_router)
    app.include_router(reports_router)