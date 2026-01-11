from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security.jwt import decode_token
from app.crud.user import users_manager
from app.api.deps import get_session


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", refreshUrl="/auth/refresh_token")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session)
    ):

    payload = decode_token(token)

    if payload["type"] != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Wrong token type. Expected 'access', got '{payload['type']}'")

    return await users_manager.get_by_id(session, int(payload["sub"]))


def require_roles(*allowed_roles: str):
    async def dep(user=Depends(get_current_user)):
        role = user.role

        if role == "admin":
            return user

        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden"
            )

        return user
    return dep