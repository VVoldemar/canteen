from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.api import include_routers
import uvicorn
import os
from app.db.session import engine
from app.models import SqlAlchemyBase 

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(SqlAlchemyBase.metadata.create_all)
    yield


app = FastAPI(lifespan=lifespan)
include_routers(app)

os.makedirs("static/dishes", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    uvicorn.run('app.main:app', reload=True)