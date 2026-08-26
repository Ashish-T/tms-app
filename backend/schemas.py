from pydantic import BaseModel, ConfigDict
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class UserCreate(BaseModel):
    username: str
    password: str
    name: str
    phone: Optional[str] = None
    role: str
    supervisor_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    role: str
    phone: Optional[str] = None
    supervisor_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class TripDriverCreate(BaseModel):
    date: str
    vehicle_number: str
    reporting_time: str
    out_time: str
    out_km: float

class TripDriverUpdate(BaseModel):
    in_time: str
    in_km: float

class TripSupervisorUpdate(BaseModel):
    vehicle_type: str
    vehicle_mode: str
    body_type: str
    vendor_name: str
    helper_name: str

class TripAdminUpdate(BaseModel):
    toll_money: float
    fuel_litres: float
    fuel_price: float
    police_fines: float
    overtime_money: float
    miscellaneous_cost: float # <--- NEW
    fixed_cost: float         # <--- NEW
    driver_cost: float
    vehicle_charged: float
    billing_amount: float

class TripLogResponse(BaseModel):
    id: int
    driver_id: Optional[int]
    supervisor_id: Optional[int]
    status: str
    date: Optional[str]
    vehicle_number: Optional[str]
    reporting_time: Optional[str]
    out_time: Optional[str]
    out_km: float
    in_time: Optional[str]
    in_km: float
    vehicle_type: Optional[str]
    vehicle_mode: Optional[str]
    body_type: Optional[str]
    vendor_name: Optional[str]
    helper_name: Optional[str]
    toll_money: float
    fuel_litres: float
    fuel_price: float
    police_fines: float
    miscellaneous_cost: float # <--- NEW
    fixed_cost: float         # <--- NEW
    overtime_money: float
    driver_cost: float
    vehicle_charged: float
    billing_amount: float
    total_cost: float
    profit: float
    model_config = ConfigDict(from_attributes=True)

class DropdownItemCreate(BaseModel):
    name: str

class DropdownItemResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class VehicleCreate(BaseModel):
    vehicle_number: str

class VehicleResponse(BaseModel):
    id: int
    vehicle_number: str
    model_config = ConfigDict(from_attributes=True)