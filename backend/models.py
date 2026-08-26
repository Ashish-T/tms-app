import os
from sqlalchemy import Column, Integer, String, Float, ForeignKey, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from dotenv import load_dotenv

load_dotenv()
Base = declarative_base()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tms.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    password = Column(String) 
    role = Column(String)
    name = Column(String)
    phone = Column(String, nullable=True)
    supervisor_id = Column(Integer, ForeignKey('users.id'), nullable=True)

class TripLog(Base):
    __tablename__ = 'trip_logs_v4' # <--- V4 Database Upgrade
    id = Column(Integer, primary_key=True)
    
    driver_id = Column(Integer, ForeignKey('users.id'))
    supervisor_id = Column(Integer, ForeignKey('users.id'))
    status = Column(String, default="Started") 
    
    # DRIVER INPUTS
    date = Column(String)
    vehicle_number = Column(String)
    reporting_time = Column(String)
    out_time = Column(String)
    out_km = Column(Float, default=0.0)
    in_time = Column(String)
    in_km = Column(Float, default=0.0)
    
    # SUPERVISOR INPUTS
    vehicle_type = Column(String, nullable=True)
    vehicle_mode = Column(String, nullable=True)
    body_type = Column(String, nullable=True)
    vendor_name = Column(String, nullable=True)
    helper_name = Column(String, nullable=True)
    
    # ADMIN EXPENSE INPUTS (NEW)
    fuel_litres = Column(Float, default=0.0)
    fuel_price = Column(Float, default=0.0)
    toll_charges = Column(Float, default=0.0)
    parking_charges = Column(Float, default=0.0)
    entry_charges = Column(Float, default=0.0)
    loading_charges = Column(Float, default=0.0)
    unloading_charges = Column(Float, default=0.0)
    police_fines = Column(Float, default=0.0)
    other_expenses = Column(Float, default=0.0)
    
    # ADMIN DRIVER COST (NEW)
    driver_daily_salary = Column(Float, default=0.0)
    trip_days = Column(Float, default=0.0)
    driver_bata = Column(Float, default=0.0)
    food_allowance = Column(Float, default=0.0)
    driver_total_cost = Column(Float, default=0.0) # Calculated
    
    # ADMIN FINAL BILLING
    fixed_cost = Column(Float, default=0.0) # Only if Dedicated
    total_running_cost = Column(Float, default=0.0) # Calculated
    billing_amount = Column(Float, default=0.0)
    profit = Column(Float, default=0.0) # Calculated

class VendorList(Base):
    __tablename__ = 'vendor_list'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)

class VehicleList(Base):
    __tablename__ = 'vehicle_list'
    id = Column(Integer, primary_key=True)
    vehicle_number = Column(String, unique=True)