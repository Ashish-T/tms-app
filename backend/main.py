from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
from typing import List

import models, schemas
from models import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TMS Enterprise RBAC API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tms-app-web.onrender.com", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "super_secret_tms_key_change_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 12

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def create_initial_admin(db: Session):
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin:
        hashed_pw = pwd_context.hash("admin123")
        db_admin = models.User(username="admin", password=hashed_pw, role="admin", name="Master Admin")
        db.add(db_admin)
        db.commit()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None: raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None: raise HTTPException(status_code=401, detail="User not found")
    return user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    token = jwt.encode({"sub": user.username, "role": user.role, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer", "role": user.role, "name": user.name}

@app.get("/users/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)): return current_user

@app.get("/users/all", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "admin": return db.query(models.User).all()
    elif current_user.role == "supervisor": return db.query(models.User).filter(models.User.supervisor_id == current_user.id).all()
    return []

@app.post("/users/supervisor", response_model=schemas.UserResponse)
def create_supervisor(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Only admins can create supervisors")
    hashed_pw = pwd_context.hash(user.password)
    db_user = models.User(username=user.username, password=hashed_pw, role="supervisor", name=user.name, phone=user.phone)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/users/driver", response_model=schemas.UserResponse)
def create_driver(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "supervisor": raise HTTPException(status_code=403, detail="Only supervisors can create drivers")
    hashed_pw = pwd_context.hash(user.password)
    db_user = models.User(username=user.username, password=hashed_pw, role="driver", name=user.name, phone=user.phone, supervisor_id=current_user.id)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Not authorized")
    obj = db.query(models.User).filter(models.User.id == user_id).first()
    if obj: db.delete(obj); db.commit()
    return {"ok": True}

@app.post("/trips/", response_model=schemas.TripLogResponse)
def create_trip(trip: schemas.TripSupervisorCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "supervisor": raise HTTPException(status_code=403, detail="Not authorized")
    active_trip = db.query(models.TripLog).filter(models.TripLog.vehicle_number == trip.vehicle_number, models.TripLog.status.notin_(["Billed / Completed", "Pending for Admin Final Review", "Completed", "Submitted for Review"])).first()
    if active_trip: raise HTTPException(status_code=400, detail="Vehicle is already assigned to an active trip!")
    db_trip = models.TripLog(**trip.model_dump(), supervisor_id=current_user.id, status="Waiting for Driver")
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.patch("/trips/{trip_id}/shuffle_vehicle", response_model=schemas.TripLogResponse)
def shuffle_vehicle(trip_id: int, update: schemas.TripVehicleUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "supervisor": raise HTTPException(status_code=403, detail="Not authorized")
    active_trip = db.query(models.TripLog).filter(models.TripLog.vehicle_number == update.vehicle_number, models.TripLog.status.notin_(["Billed / Completed", "Pending for Admin Final Review", "Completed", "Submitted for Review"])).first()
    if active_trip: raise HTTPException(status_code=400, detail="Vehicle is already assigned to an active trip!")
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    db_trip.vehicle_number = update.vehicle_number
    db_trip.status = "Pending Approval"
    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.patch("/trips/{trip_id}/approve", response_model=schemas.TripLogResponse)
def approve_trip(trip_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Not authorized")
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    db_trip.status = "Waiting for Driver"
    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.patch("/trips/{trip_id}/report", response_model=schemas.TripLogResponse)
def driver_report(trip_id: int, report: schemas.TripDriverReport, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "driver": raise HTTPException(status_code=403, detail="Not authorized")
    active = db.query(models.TripLog).filter(models.TripLog.driver_id == current_user.id, models.TripLog.status.in_(["Reported", "Trip Started"])).first()
    if active: raise HTTPException(status_code=400, detail="Close current trip first.")
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    db_trip.reporting_time = report.reporting_time
    db_trip.status = "Reported"
    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.patch("/trips/{trip_id}/start", response_model=schemas.TripLogResponse)
def driver_start(trip_id: int, start_data: schemas.TripDriverStart, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "driver": raise HTTPException(status_code=403, detail="Not authorized")
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    db_trip.out_time = start_data.out_time
    db_trip.out_km = start_data.out_km
    db_trip.status = "Trip Started"
    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.patch("/trips/{trip_id}/end", response_model=schemas.TripLogResponse)
def end_trip(trip_id: int, trip_update: schemas.TripDriverUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["driver", "supervisor"]: raise HTTPException(status_code=403, detail="Not authorized")
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    if not db_trip: raise HTTPException(status_code=404, detail="Trip not found")
    
    db_trip.in_time = trip_update.in_time
    db_trip.in_km = trip_update.in_km
    
    # Status only advances to completed if the truck was actively running
    if db_trip.status in ["Trip Started", "Submitted for Review"]:
        db_trip.status = "Completed"
        
    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.patch("/trips/{trip_id}/review", response_model=schemas.TripLogResponse)
def supervisor_review(trip_id: int, review: schemas.TripSupervisorUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "supervisor": raise HTTPException(status_code=403, detail="Not authorized")
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id, models.TripLog.supervisor_id == current_user.id).first()
    if not db_trip: raise HTTPException(status_code=404, detail="Trip not found")
    
    for key, value in review.model_dump().items(): setattr(db_trip, key, value)
    
    # If the trip is already completely done, it advances to Review stage. Otherwise it stays running!
    if db_trip.status == "Completed": 
        db_trip.status = "Submitted for Review"
        
    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.patch("/trips/{trip_id}/supervisor_expenses", response_model=schemas.TripLogResponse)
def supervisor_expenses(trip_id: int, expenses: schemas.TripFinancialsUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["supervisor", "admin"]: raise HTTPException(status_code=403, detail="Not authorized")
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    if not db_trip: raise HTTPException(status_code=404, detail="Trip not found")
    
    for key, value in expenses.model_dump().items(): setattr(db_trip, key, value)
    
    fuel_cost = expenses.fuel_litres * expenses.fuel_price
    db_trip.total_running_cost = fuel_cost + expenses.toll_charges + expenses.other_expenses + expenses.driver_cost + expenses.overtime_allowance + expenses.vehicle_cost
    db_trip.profit = expenses.b2c_billing - db_trip.total_running_cost
    
    # PREVENT PREMATURE CLOSING: Only send to Admin if the physical trip has actually finished!
    if db_trip.status in ["Completed", "Submitted for Review"]:
        db_trip.status = "Pending for Admin Final Review"
        
    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.patch("/trips/{trip_id}/finalize", response_model=schemas.TripLogResponse)
def admin_finalize(trip_id: int, billing: schemas.TripFinancialsUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Not authorized")
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    if not db_trip: raise HTTPException(status_code=404, detail="Trip not found")
    
    for key, value in billing.model_dump().items(): setattr(db_trip, key, value)
    
    fuel_cost = billing.fuel_litres * billing.fuel_price
    db_trip.total_running_cost = fuel_cost + billing.toll_charges + billing.other_expenses + billing.driver_cost + billing.overtime_allowance + billing.vehicle_cost
    db_trip.profit = billing.b2c_billing - db_trip.total_running_cost
    db_trip.status = "Billed / Completed"
    
    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.patch("/trips/{trip_id}/admin_edit", response_model=schemas.TripLogResponse)
def admin_edit_trip(trip_id: int, edit_data: schemas.TripSupervisorUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Not authorized")
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    if not db_trip: raise HTTPException(status_code=404, detail="Trip not found")
        
    for key, value in edit_data.model_dump().items(): setattr(db_trip, key, value)
    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.get("/trips/", response_model=List[schemas.TripLogResponse])
def get_trips(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "admin": return db.query(models.TripLog).order_by(models.TripLog.id.desc()).all()
    elif current_user.role == "supervisor": return db.query(models.TripLog).filter(models.TripLog.supervisor_id == current_user.id).order_by(models.TripLog.id.desc()).all()
    elif current_user.role == "driver": return db.query(models.TripLog).filter(models.TripLog.driver_id == current_user.id).order_by(models.TripLog.id.desc()).all()
    return []

@app.get("/vendors_list/", response_model=List[schemas.DropdownItemResponse])
def get_vendors(db: Session = Depends(get_db)): return db.query(models.VendorList).all()

@app.post("/vendors_list/", response_model=schemas.DropdownItemResponse)
def add_vendor(vendor: schemas.DropdownItemCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Not authorized")
    db_vendor = models.VendorList(name=vendor.name)
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

@app.delete("/vendors_list/{vendor_id}")
def delete_vendor(vendor_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Not authorized")
    obj = db.query(models.VendorList).filter(models.VendorList.id == vendor_id).first()
    if obj: db.delete(obj); db.commit()
    return {"ok": True}

@app.get("/clients_list/", response_model=List[schemas.DropdownItemResponse])
def get_clients(db: Session = Depends(get_db)): return db.query(models.ClientList).all()

@app.post("/clients_list/", response_model=schemas.DropdownItemResponse)
def add_client(client: schemas.DropdownItemCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Not authorized")
    db_client = models.ClientList(name=client.name)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@app.delete("/clients_list/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin": raise HTTPException(status_code=403, detail="Not authorized")
    obj = db.query(models.ClientList).filter(models.ClientList.id == client_id).first()
    if obj: db.delete(obj); db.commit()
    return {"ok": True}

@app.get("/vehicles_list/", response_model=List[schemas.VehicleResponse])
def get_vehicles(db: Session = Depends(get_db)): return db.query(models.VehicleList).all()

@app.post("/vehicles_list/", response_model=schemas.VehicleResponse)
def add_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["admin", "supervisor"]: raise HTTPException(status_code=403, detail="Not authorized")
    db_vehicle = models.VehicleList(vehicle_number=vehicle.vehicle_number, ownership_type=vehicle.ownership_type, emi=vehicle.emi)
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@app.delete("/vehicles_list/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["admin", "supervisor"]: raise HTTPException(status_code=403, detail="Not authorized")
    obj = db.query(models.VehicleList).filter(models.VehicleList.id == vehicle_id).first()
    if obj: db.delete(obj); db.commit()
    return {"ok": True}

@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    create_initial_admin(db)
    db.close()