from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict


class GenerateReportRequest(BaseModel):
    report_type: str
    date_from: Optional[date] = None
    date_to: Optional[date] = None


class ReportResponse(BaseModel):
    report_id: str
    report_type: str
    generated_at: datetime
    download_url: str
    
    model_config = ConfigDict(from_attributes=True)


class CostsReportResponse(BaseModel):
    from_: date = Field(alias="from")
    to: date
    procurement_applications: int
    estimated_total_cost_kopecks: int

    model_config = ConfigDict(populate_by_name=True)


class NutritionDishBreakdown(BaseModel):
    dish_id: int
    dish_name: str
    quantity: int


class NutritionReportResponse(BaseModel):
    from_: date = Field(alias="from")
    to: date
    served_orders: int
    dishes_breakdown: List[NutritionDishBreakdown]

    model_config = ConfigDict(populate_by_name=True)