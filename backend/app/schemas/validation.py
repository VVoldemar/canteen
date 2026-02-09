from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class ErrorResponse(BaseModel):
    status_code: int
    detail: Any = None
    headers: dict[str, str] | None = None

    model_config = ConfigDict(from_attributes=True)


class ValidationError(BaseModel):
    detail: List[Dict[str, Any]]

    model_config = ConfigDict(from_attributes=True)