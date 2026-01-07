from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    code: str
    message: str
    error: Optional[str] = None
    detail: Optional[str] = None


class ValidationError(BaseModel):
    detail: List[Dict[str, Any]]