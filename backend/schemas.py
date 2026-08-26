from pydantic import BaseModel, ConfigDict

class TripLogCreate(BaseModel):
    date: str
    vehicle_number: str
    vehicle_type: str
    vehicle_mode: str
    body_type: str
    reporting_time: str
    out_time: str
    out_km: float
    in_time: str
    in_km: float
    driver_name: str
    mobile_number: str
    vendor_name: str
    helper_name: str
    toll_money: float
    fuel_litres: float
    fuel_price: float
    police_fines: float

class TripLogAdminUpdate(BaseModel):
    driver_cost: float
    vehicle_charged: float
    billing_amount: float

class TripLogResponse(TripLogCreate):
    id: int
    driver_cost: float
    vehicle_charged: float
    billing_amount: float
    total_cost: float
    profit: float
    is_billed: bool
    model_config = ConfigDict(from_attributes=True)

# --- NEW SCHEMAS FOR ADMIN DROPDOWNS ---
class DropdownItemCreate(BaseModel):
    name: str

class DropdownItemResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

