from fastapi import APIRouter


users_router = APIRouter(prefix="/users", tags=["Users"])

@users_router.get("/me", summary="Информация о пользователе", description="Получить информацию о текущем пользователе")
async def get_current_user():
    return 


@users_router.patch("/me", summary="Обновить профиль текущего пользователя", description="")
async def update_current_user():
    return


@users_router.get("/me/allergies", summary="Получить список аллергий текущего пользователя", description="")
async def get_current_user_allergies():
    return


@users_router.post("/me/allergies", summary="Добавить аллергию", description="Указать аллерген для текущего пользователя")
async def add_current_user_allergy(): 
    return


@users_router.delete("/me/allergies", summary="Удалить аллергию", description="Удалить аллерген из списка")
async def delete_current_user_allergy():
    return


@users_router.get("/", summary="Получить список пользователей", description="Доступно только администраторам")
async def get_users():  
    return


@users_router.get("/{user_id}", summary="Получить информацию о пользователе", description="Доступно только администраторам")
async def get_user(user_id: int):  
    return


@users_router.patch("/{user_id}", summary="Обновить информацию о пользователе", description="Доступно только администраторам")
async def update_user(user_id: int): 
    return