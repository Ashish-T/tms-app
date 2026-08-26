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

# Auto-create the Master Admin on startup
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

# 1. Driver Starts Trip
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

# 1b. Driver Ends Trip (Updates In KM/Time)
@app.patch("/trips/{trip_id}/end", response_model=schemas.TripLogResponse)
def end_trip(trip_id: int, trip_update: schemas.TripDriverUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can end trips")
        
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id, models.TripLog.driver_id == current_user.id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    db_trip.in_time = trip_update.in_time
    db_trip.in_km = trip_update.in_km
    db_trip.status = "Completed"
    db.commit()
    db.refresh(db_trip)
    return db_trip

# 2. Supervisor Reviews Trip
@app.patch("/trips/{trip_id}/review", response_model=schemas.TripLogResponse)
def supervisor_review(trip_id: int, review: schemas.TripSupervisorUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisors can review trips")
        
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id, models.TripLog.supervisor_id == current_user.id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found in your team")
        
    for key, value in review.model_dump().items():
        setattr(db_trip, key, value)
        
    db_trip.status = "Reviewed"
    db.commit()
    db.refresh(db_trip)
    return db_trip

# 3. Admin Finalizes Billing & Expenses
@app.patch("/trips/{trip_id}/finalize", response_model=schemas.TripLogResponse)
def admin_finalize(trip_id: int, billing: schemas.TripAdminUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can finalize billing")
        
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Save all admin inputs
    for key, value in billing.model_dump().items():
        setattr(db_trip, key, value)
    
    # Auto-Calculate Total Cost (Now includes Overtime!)
    fuel_cost = db_trip.fuel_litres * db_trip.fuel_price
    db_trip.total_cost = db_trip.toll_money + fuel_cost + db_trip.police_fines + billing.driver_cost + billing.overtime_money
    
    # Auto-Calculate Profit
    db_trip.profit = billing.billing_amount - db_trip.total_cost
    db_trip.status = "Billed"
    
    db.commit()
    db.refresh(db_trip)
    return db_trip

# --- FETCH TRIPS BASED ON ROLE ---
@app.get("/trips/", response_model=List[schemas.TripLogResponse])
def get_trips(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "admin":
        return db.query(models.TripLog).order_by(models.TripLog.id.desc()).all()
    elif current_user.role == "supervisor":
        return db.query(models.TripLog).filter(models.TripLog.supervisor_id == current_user.id).order_by(models.TripLog.id.desc()).all()
    elif current_user.role == "driver":
        return db.query(models.TripLog).filter(models.TripLog.driver_id == current_user.id).order_by(models.TripLog.id.desc()).all()

# BOOT SEQUENCE
@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    create_initial_admin(db)
    db.close()