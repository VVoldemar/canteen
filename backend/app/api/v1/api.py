from fastapi import FastAPI

from endpoints.auth import auth_router
from endpoints.users import users_router
from endpoints.menu import menu_router
from endpoints.dishes import dishes_router
from endpoints.orders import orders_router
from endpoints.reviews import reviews_router
from endpoints.applications import applications_router
from endpoints.ingredients import ingredients_router
from endpoints.statistics import statistics_router
from endpoints.notifications import notifications_router
from endpoints.reports import reports_router
from endpoints.subscriptions import subscriptions_router


app = FastAPI()
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
app.include_router(reports_router)