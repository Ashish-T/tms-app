from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from models import TripStatus, ExpenseType

class DriverCreate(BaseModel):
    name: str
    license_number: str

class DriverResponse(DriverCreate):
    id: int
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class TripCreate(BaseModel):
    driver_id: int
    vehicle_id: int
    source: str
    destination: str
    start_km: float

class TripResponse(TripCreate):
    id: int
    status: TripStatus
    start_time: datetime
    model_config = ConfigDict(from_attributes=True)

class ExpenseCreate(BaseModel):
    expense_type: ExpenseType
    amount: float
    description: Optional[str] = None

class ExpenseResponse(ExpenseCreate):
    id: int
    trip_id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)
