from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime

from app.core.security.jwt import create_access_token, create_refresh_token, decode_token
from app.core.security.password import verify_password

from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.schemas.validation import ErrorResponse, ValidationError

from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_session
from app.crud.user import users_manager
from app.crud.blacklisted_token import blacklisted_token_manager


auth_router = APIRouter(prefix="/auth", tags=["Auth"])

@auth_router.post("/register", summary="Регистрация нового пользователя", description="Регистрация нового ученика в системе",
                response_model=TokenResponse, 
                responses={
                    200: {'model': TokenResponse,'desctiprion': 'Пользователь успешно зарегистрирован'},
                    400: {'model': ErrorResponse, 'desctiprion': 'Некорректный запрос'},
                    409: {'model': ErrorResponse, 'desctiprion': 'Пользователь уже существует'},
                    422: {'model': ValidationError, 'desctiprion': 'Ошибка валидации'},
                })
async def register_user(
                    form: RegisterRequest,
                    session: AsyncSession = Depends(get_session) 
                ):
    try:
        user = await users_manager.get_by_email(session, form.email)
        # user already exists
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User with this email already exists") 
        
    except HTTPException as e:
        if e.status_code == status.HTTP_404_NOT_FOUND:
            # user not found, proceed to create
            user = await users_manager.create(session, form)
            return TokenResponse(
                access_token=create_access_token(user.id, user.role),
                refresh_token=create_refresh_token(user.id),
                token_type='bearer'
            )
        else:
            raise e  


@auth_router.post("/login", summary="Авторизация пользователя", description="Вход в систему с получением JWT токена",
                response_model=TokenResponse, 
                responses={
                    200: {'model': TokenResponse,'desctiprion': 'Успешная авторизация'},
                    400: {'model': ErrorResponse, 'desctiprion': 'Некорректный запрос'},
                    401: {'model': ErrorResponse, 'desctiprion': 'Не авторизован'},
                    422: {'model': ValidationError, 'desctiprion': 'Ошибка валидации'},
                })
async def login_user(
                    form: LoginRequest,
                    session: AsyncSession = Depends(get_session)
                ):
    
    user = await users_manager.get_by_email(session, form.email)

    if not verify_password(form.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong password")

    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id),
        token_type='bearer'
    )    


@auth_router.post("/refresh_token", summary="Обновление access токена", description="Получение нового access токена по refresh токену",
                response_model=TokenResponse, 
                responses={
                    200: {'model': TokenResponse,'desctiprion': 'Успешная авторизация'},
                    400: {'model': ErrorResponse, 'desctiprion': 'Некорректный запрос'},
                    401: {'model': ErrorResponse, 'desctiprion': 'Не авторизован'},
                    422: {'model': ValidationError, 'desctiprion': 'Ошибка валидации'},
                })
async def refresh_token(
                    refresh_token: str,
                    session: AsyncSession = Depends(get_session)
                ):

    payload = decode_token(refresh_token)

    try:
        await blacklisted_token_manager.get_by_jti(session, payload["jti"])
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked")
    
    except HTTPException as e:
        if e.status_code != status.HTTP_404_NOT_FOUND:
            raise e

    if payload["type"] != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Wrong token type. Expected 'refresh', got '{payload['type']}'")

    user = await users_manager.get_by_id(session, int(payload["sub"]))

    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=refresh_token,
        token_type='bearer'
    )


@auth_router.post("/logout", summary="Выход из системы", description="",
                responses={
                    200: {'desctiprion': 'Успешный выход'},
                    400: {'model': ErrorResponse, 'desctiprion': 'Пользователь уже вышел'},
                    401: {'model': ErrorResponse, 'desctiprion': 'Не авторизован или неверный токен'},
                })
async def logout_user(
                    refresh_token: str, 
                    session: AsyncSession = Depends(get_session)
                ):

    payload = decode_token(refresh_token)
    if payload.get('type') != 'refresh':
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Неверный тип токена'
        )
    jti = payload.get('jti')
    ex = datetime.fromtimestamp(payload.get('exp'))

    #Frontend needs to delete access token to logout
    await blacklisted_token_manager.create(session, jti, ex)

    return {'status': 'success'}
