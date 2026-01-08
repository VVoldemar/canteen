from typing import Annotated
from pydantic import Field


Name = Annotated[str, Field(ge=2)]
Surname = Annotated[str, Field(ge=2)]
Password = Annotated[str, Field(ge=6)]
Rating = Annotated[int, Field(ge=1, le=5)]
Price = Annotated[int, Field(ge=0)]