from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict

from app.core.enums import Reports

class GenerateReportRequest(BaseModel):
    report_type: Reports
    date_from: Optional[date] = None
    date_to: Optional[date] = None


class ReportResponse(BaseModel):
    id: int
    report_type: str
    generated_at: datetime
    download_url: str
    
    model_config = ConfigDict(from_attributes=True)


class CostsReportResponse(BaseModel):
    from_: date = Field(alias="from")
    to: date = Field(alias="to")
    procurement_applications: int
    estimated_total_cost_kopecks: int

    model_config = ConfigDict(populate_by_name=True, by_alias=True)


class NutritionDishBreakdown(BaseModel):
    dish_id: int
    dish_name: str
    quantity: int


class NutritionReportResponse(BaseModel):
    from_: date = Field(alias="from")
    to: date = Field(alias="to")
    served_orders: int
    dishes_breakdown: List[NutritionDishBreakdown]

    model_config = ConfigDict(populate_by_name=True, by_alias=True)


class DishPopularity(BaseModel):
    name: str
    count: int


class AttendanceReportResponse(BaseModel):
    date_from: date = Field(alias="from")
    date_to: date = Field(alias="to")
    
    meals: int
    
    cancelled_orders: int
    cancellation_ratio: float
    
    popularity: List[DishPopularity] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True, from_attributes=True, by_alias=True)