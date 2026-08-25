from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas
from models import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TMS Unified API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tms-app-web.onrender.com", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/trips/", response_model=schemas.TripLogResponse)
def create_trip_log(trip: schemas.TripLogCreate, db: Session = Depends(get_db)):
    db_trip = models.TripLog(**trip.model_dump())
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.get("/trips/", response_model=list[schemas.TripLogResponse])
def get_all_trips(db: Session = Depends(get_db)):
    return db.query(models.TripLog).order_by(models.TripLog.id.desc()).all()

@app.patch("/trips/{trip_id}/billing", response_model=schemas.TripLogResponse)
def process_admin_billing(trip_id: int, billing: schemas.TripLogAdminUpdate, db: Session = Depends(get_db)):
    db_trip = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # 1. Save Admin Inputs
    db_trip.driver_cost = billing.driver_cost
    db_trip.vehicle_charged = billing.vehicle_charged
    db_trip.billing_amount = billing.billing_amount
    
    # 2. Auto-Calculate Total Cost
    fuel_cost = db_trip.fuel_litres * db_trip.fuel_price
    db_trip.total_cost = db_trip.toll_money + fuel_cost + db_trip.police_fines + billing.driver_cost
    
    # 3. Auto-Calculate Profit
    db_trip.profit = billing.billing_amount - db_trip.total_cost
    
    # 4. Mark as processed
    db_trip.is_billed = True
    
    db.commit()
    db.refresh(db_trip)
    return db_trip