from fastapi import APIRouter


auth_router = APIRouter(prefix="/auth", tags="Auth")

auth_router.post("/register", summary="Регистрация нового пользователя", description="Регистрация нового ученика в системе")
async def register_user():
    return


auth_router.post("/login", summary="Авторизация пользователя", description="Вход в систему с получением JWT токена")
async def login_user():
    return


auth_router.post("/logout", summary="Выход из системы", description="")
async def logout_user():
    return