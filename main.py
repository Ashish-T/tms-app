from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from models import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Transport Management System API")

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Transport Management System API!",
        "docs_url": "https://tms-app-c03d.onrender.com/docs"
    }

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/drivers/", response_model=schemas.DriverResponse)
def create_driver(driver: schemas.DriverCreate, db: Session = Depends(get_db)):
    db_driver = models.Driver(**driver.model_dump())
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver

@app.post("/trips/", response_model=schemas.TripResponse)
def create_trip(trip: schemas.TripCreate, db: Session = Depends(get_db)):
    db_trip = models.Trip(**trip.model_dump())
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.post("/trips/{trip_id}/expenses/", response_model=schemas.ExpenseResponse)
def add_expense(trip_id: int, expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    db_trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    db_expense = models.Expense(**expense.model_dump(), trip_id=trip_id)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.get("/trips/{trip_id}/summary")
def get_trip_summary(trip_id: int, db: Session = Depends(get_db)):
    db_trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    total_expenses = sum(exp.amount for exp in db_trip.expenses)
    distance_run = (db_trip.end_km - db_trip.start_km) if db_trip.end_km else 0
    
    return {
        "trip_id": trip_id,
        "status": db_trip.status,
        "total_distance_km": distance_run,
        "total_cost": total_expenses
    }
