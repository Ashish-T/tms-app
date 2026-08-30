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

class TripSupervisorCreate(BaseModel):
    driver_id: int
    vehicle_number: str
    date: str

class TripVehicleUpdate(BaseModel):
    vehicle_number: str

class TripDriverReport(BaseModel):
    reporting_time: str

class TripDriverStart(BaseModel):
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
    client_name: str
    source: str
    destination: str

class TripFinancialsUpdate(BaseModel):
    fuel_litres: float
    fuel_price: float
    toll_charges: float
    other_expenses: float
    driver_cost: float
    trip_days: float           # <--- NEW
    overtime_allowance: float  # <--- NEW
    vehicle_cost_type: Optional[str] = "Third Party"
    vehicle_cost: float
    b2c_billing: float

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
    client_name: Optional[str]
    source: Optional[str]
    destination: Optional[str]
    fuel_litres: float
    fuel_price: float
    toll_charges: float
    other_expenses: float
    driver_cost: float
    trip_days: float
    overtime_allowance: float
    vehicle_cost_type: Optional[str]
    vehicle_cost: float
    b2c_billing: float
    total_running_cost: float
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
    ownership_type: str
    emi: float

class VehicleResponse(BaseModel):
    id: int
    vehicle_number: str
    ownership_type: str
    emi: float
    model_config = ConfigDict(from_attributes=True)