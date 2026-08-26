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

# --- SECURITY CONFIGURATION ---
SECRET_KEY = "super_secret_tms_key_change_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 12

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_initial_admin(db: Session):
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin:
        hashed_pw = pwd_context.hash("admin123")
        db_admin = models.User(username="admin", password=hashed_pw, role="admin", name="Master Admin")
        db.add(db_admin)
        db.commit()

# --- AUTHENTICATION DEPENDENCIES ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# --- AUTH ROUTES ---
@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    token_data = {"sub": user.username, "role": user.role, "exp": expire}
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": token, "token_type": "bearer", "role": user.role, "name": user.name}

# --- USER MANAGEMENT ---
@app.get("/users/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/users/supervisor", response_model=schemas.UserResponse)
def create_supervisor(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create supervisors")
    
    hashed_pw = pwd_context.hash(user.password)
    db_user = models.User(username=user.username, password=hashed_pw, role="supervisor", name=user.name, phone=user.phone)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/users/driver", response_model=schemas.UserResponse)
def create_driver(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisors can create drivers")
    
    hashed_pw = pwd_context.hash(user.password)
    db_user = models.User(username=user.username, password=hashed_pw, role="driver", name=user.name, phone=user.phone, supervisor_id=current_user.id)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- COLLABORATIVE TRIP PIPELINE ---

@app.post("/trips/", response_model=schemas.TripLogResponse)
def start_trip(trip: schemas.TripDriverCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can start trips")
        
    db_trip = models.TripLog(
        **trip.model_dump(),
        driver_id=current_user.id,
        supervisor_id=current_user.supervisor_id,
        status="Started"
    )
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip


# UPDATE: Both Drivers AND Supervisors can now end trips!
@app.patch("/trips/{trip_id}/end", response_model=schemas.TripLogResponse)
def end_trip(trip_id: int, trip_update: schemas.TripDriverUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["driver", "supervisor"]:
        raise HTTPException(status_code=403, detail="Only drivers and supervisors can end trips")
        
    if current_user.role == "driver":
        db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id, models.TripLog.driver_id == current_user.id).first()
    else:
        db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id, models.TripLog.supervisor_id == current_user.id).first()
        
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    db_trip.in_time = trip_update.in_time
    db_trip.in_km = trip_update.in_km
    
    # Smart routing: If the supervisor already reviewed it earlier, jump straight to "Reviewed" so Admin can bill it.
    if db_trip.vehicle_type: 
        db_trip.status = "Reviewed"
    else:
        db_trip.status = "Completed"
        
    db.commit()
    db.refresh(db_trip)
    return db_trip


# UPDATE: Review no longer overwrites the "Started" status
@app.patch("/trips/{trip_id}/review", response_model=schemas.TripLogResponse)
def supervisor_review(trip_id: int, review: schemas.TripSupervisorUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisors can review trips")
        
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id, models.TripLog.supervisor_id == current_user.id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found in your team")
        
    for key, value in review.model_dump().items():
        setattr(db_trip, key, value)
        
    # Only change the status to "Reviewed" if the driver has already ended the trip.
    # If the trip is still "Started", leave the status as "Started" so it stays active!
    if db_trip.status == "Completed":
        db_trip.status = "Reviewed"
        
    db.commit()
    db.refresh(db_trip)
    return db_trip


@app.patch("/trips/{trip_id}/finalize", response_model=schemas.TripLogResponse)
def admin_finalize(trip_id: int, billing: schemas.TripAdminUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can finalize billing")
        
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    for key, value in billing.model_dump().items():
        setattr(db_trip, key, value)
    
    # CALCULATE DRIVER COST: (Daily Salary * Days) + Bata + Food
    db_trip.driver_total_cost = (billing.driver_daily_salary * billing.trip_days) + billing.driver_bata + billing.food_allowance
    
    # CALCULATE TOTAL RUNNING COST
    fuel_cost = db_trip.fuel_litres * db_trip.fuel_price
    db_trip.total_running_cost = (
        fuel_cost + db_trip.toll_charges + db_trip.parking_charges + db_trip.entry_charges + 
        db_trip.driver_total_cost + db_trip.loading_charges + db_trip.unloading_charges + 
        db_trip.other_expenses + db_trip.police_fines + db_trip.fixed_cost
    )
    
    # CALCULATE PROFIT (Customer Revenue - Running Cost)
    db_trip.profit = billing.billing_amount - db_trip.total_running_cost
    db_trip.status = "Billed"
    
    db.commit()
    db.refresh(db_trip)
    return db_trip

# NEW: Admin Editing Supervisor Inputs
@app.patch("/trips/{trip_id}/admin_edit", response_model=schemas.TripLogResponse)
def admin_edit_trip(trip_id: int, edit_data: schemas.TripSupervisorUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can edit trip details")
        
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    for key, value in edit_data.model_dump().items():
        setattr(db_trip, key, value)
        
    db.commit()
    db.refresh(db_trip)
    return db_trip


# --- FETCH ROUTES ---
@app.get("/trips/", response_model=List[schemas.TripLogResponse])
def get_trips(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "admin":
        return db.query(models.TripLog).order_by(models.TripLog.id.desc()).all()
    elif current_user.role == "supervisor":
        return db.query(models.TripLog).filter(models.TripLog.supervisor_id == current_user.id).order_by(models.TripLog.id.desc()).all()
    elif current_user.role == "driver":
        return db.query(models.TripLog).filter(models.TripLog.driver_id == current_user.id).order_by(models.TripLog.id.desc()).all()

@app.get("/users/all", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "admin":
        return db.query(models.User).all()
    elif current_user.role == "supervisor":
        return db.query(models.User).filter(models.User.supervisor_id == current_user.id).all()
    return []

@app.get("/vendors_list/", response_model=List[schemas.DropdownItemResponse])
def get_vendors(db: Session = Depends(get_db)):
    return db.query(models.VendorList).all()

@app.post("/vendors_list/", response_model=schemas.DropdownItemResponse)
def add_vendor(vendor: schemas.DropdownItemCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage vendors")
    db_vendor = models.VendorList(name=vendor.name)
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

@app.get("/vehicles_list/", response_model=List[schemas.VehicleResponse])
def get_vehicles(db: Session = Depends(get_db)):
    return db.query(models.VehicleList).all()

@app.post("/vehicles_list/", response_model=schemas.VehicleResponse)
def add_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Only admins and supervisors can add vehicles")
    db_vehicle = models.VehicleList(vehicle_number=vehicle.vehicle_number)
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

# BOOT SEQUENCE
@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    create_initial_admin(db)
    db.close()