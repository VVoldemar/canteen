from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class ErrorResponse(BaseModel):
    code: str
    message: str
    error: Optional[str] = None
    detail: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ValidationError(BaseModel):
    detail: List[Dict[str, Any]]

    model_config = ConfigDict(from_attributes=True)