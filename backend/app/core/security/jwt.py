import jwt
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from dotenv import load_dotenv
from os import getenv
import uuid


load_dotenv('.env')

SECRET_KEY = getenv('JWT_SECRET_KEY')
ALGORITHM = getenv('JWT_ALGORITHM')
ACCESS_TTL = getenv('ACCESS_TTL')
REFRESH_TTL = getenv('REFRESH_TTL')

def create_access_token(user_id: int, role: str):
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "exp": datetime.utcnow() + timedelta(minutes=int(ACCESS_TTL))
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": str(uuid.uuid4()),
        "exp": datetime.utcnow() + timedelta(days=int(REFRESH_TTL))
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token expired"
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token"
        )