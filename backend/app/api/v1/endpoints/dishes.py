import json
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Form

from typing import Annotated, Optional
import json
import os
from app.core.utils.generation import generate_unique_filename

from app.core.security.auth import require_roles
from app.core.enums import UserRole

from app.api.deps import get_session
from app.crud.dish import dish_manager
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.dish import DishDetailResponse, DishResponse, CreateDishRequest, UpdateDishRequest
from app.schemas.validation import ValidationError, ErrorResponse
from app.schemas.paginating import PaginationParams, PaginatedResponse

dishes_router = APIRouter(prefix='/dishes', tags=['Dishes'])

@dishes_router.get('/', summary='Получить список блюд', description='',
                response_model=PaginatedResponse[DishResponse],
                responses={
                    200: {'model': PaginatedResponse[DishResponse], 'description': 'Список блюд'}
                })
async def get_dishes(
                params: Annotated[PaginationParams, Depends()],
                search: Annotated[Optional[str], Query(description="Поиск по названию блюда")] = None,
                session: AsyncSession = Depends(get_session),
            ):

    return await dish_manager.get_all_paginated(session, params, search)


@dishes_router.post('/', response_model=DishResponse, status_code=status.HTTP_201_CREATED)
async def create_dish(
    dish_data: str = Form(...),
    image: Optional[UploadFile] = File(None),
    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK)),
    session: AsyncSession = Depends(get_session)
):
    public_url = None  

    try:
        try:
            dish_in = CreateDishRequest.model_validate_json(dish_data)
        except (json.JSONDecodeError, ValidationError) as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
                detail=f"Invalid JSON: {e}"
            )

        if image:
            if image.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
                raise HTTPException(status_code=400, detail="Allowed types: jpeg, png, jpg")
            
            unique_filename = generate_unique_filename(image.filename)
            upload_dir = os.path.join("static", "dishes")
            os.makedirs(upload_dir, exist_ok=True)
            
            file_path = os.path.join(upload_dir, unique_filename)
            
            try:
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)
            except Exception:
                raise HTTPException(status_code=500, detail="Could not save file")
            finally:
                await image.close()

            public_url = f"/static/dishes/{unique_filename}"

        return await dish_manager.create(session, dish_in, image_url=public_url)

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Bad request'
        )


@dishes_router.get('/{dish_id}', summary='Получить информацию о блюде', description='',
                    response_model=DishDetailResponse,
                    responses={
                        200: {'model': DishDetailResponse, 'description': 'Информация о блюде'},
                        404: {'model': ErrorResponse, 'description': 'Ресурс не найден'},
                    })
async def get_dish(
                dish_id: int,
                session: AsyncSession = Depends(get_session)
            ):
    
    return await dish_manager.get_by_id(session, dish_id)


@dishes_router.patch('/{dish_id}', summary='Oбновить блюдо', description='Доступно только администраторам и поварам',
                    response_model=DishDetailResponse,
                    responses={
                        200: {'model': DishDetailResponse, 'description': 'Блюдо обновлено'},
                        400: {'model': ErrorResponse, 'description': 'Некорректный запрос'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                        404: {'model': ErrorResponse, 'description': 'Ресурс не найден'}
                    })
async def update_dish(
                    dish_id: int, 
                    dish_data: str = Form(...),
                    image: Optional[UploadFile] = File(None),
                    user=Depends(require_roles(UserRole.ADMIN, UserRole.COOK)),
                    session: AsyncSession = Depends(get_session)
                ):
    unique_filename = None
    if image:
        if image.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(status_code=400, detail="Allowed types: jpeg, png, jpg")
        
        unique_filename = generate_unique_filename(image.filename)
        upload_dir = os.path.join("static", "dishes")
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, unique_filename)
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)

        except Exception:
            raise HTTPException(status_code=500, detail="Could not save file")
        finally:
            await image.close()
            
    public_url = f"/static/dishes/{unique_filename}"
        
    try:
        data_dict = json.loads(dish_data)

        update_data = UpdateDishRequest(**data_dict)
    except (json.JSONDecodeError, TypeError, ValidationError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
            detail=f"Ошибка валидации данных: {e}"
        )

    return await dish_manager.update(session, dish_id, update_data, public_url)


@dishes_router.delete('/{dish_id}', summary='Удалить блюдо', description='Доступно только администраторам',
                    status_code=status.HTTP_204_NO_CONTENT,
                    responses={
                        204: {'description': 'Блюдо удалено'},
                        401: {'model': ErrorResponse, 'description': 'Не авторизован'},
                        403: {'model': ErrorResponse, 'description': 'Доступ запрещен'},
                        404: {'model': ErrorResponse, 'description': 'Ресурс не найден'}
                    })
async def delete_dish(
                    dish_id: int, 
                    user=Depends(require_roles(UserRole.ADMIN)),
                    session: AsyncSession = Depends(get_session)
                ):
    
    await dish_manager.delete(session, dish_id)
    return 