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

# --- NEW: USER ACCOUNTS & ROLES ---
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    password = Column(String) 
    role = Column(String) # 'admin', 'supervisor', or 'driver'
    name = Column(String)
    phone = Column(String, nullable=True)
    
    # Links drivers to their specific supervisor
    supervisor_id = Column(Integer, ForeignKey('users.id'), nullable=True)

# --- UPDATED: TRIP LOGS ---
class TripLog(Base):
    __tablename__ = 'trip_logs_v3'
    id = Column(Integer, primary_key=True)
    
    # Relational Links
    driver_id = Column(Integer, ForeignKey('users.id'))
    supervisor_id = Column(Integer, ForeignKey('users.id'))
    status = Column(String, default="Initiated") # Initiated -> Reviewed -> Billed
    
    # 1. DRIVER INPUTS
    date = Column(String)
    vehicle_number = Column(String)
    reporting_time = Column(String)
    out_time = Column(String)
    out_km = Column(Float, default=0.0)
    in_time = Column(String)
    in_km = Column(Float, default=0.0)
    
    # 2. SUPERVISOR INPUTS
    vehicle_type = Column(String, nullable=True)
    vehicle_mode = Column(String, nullable=True)
    body_type = Column(String, nullable=True)
    vendor_name = Column(String, nullable=True)
    helper_name = Column(String, nullable=True)
    
    # 3. ADMIN INPUTS & EXPENSES
    toll_money = Column(Float, default=0.0)
    fuel_litres = Column(Float, default=0.0)
    fuel_price = Column(Float, default=0.0)
    police_fines = Column(Float, default=0.0)
    
    # 4. ADMIN FINANCIALS
    overtime_money = Column(Float, default=0.0) # Newly added
    driver_cost = Column(Float, default=0.0)
    vehicle_charged = Column(Float, default=0.0)
    billing_amount = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    profit = Column(Float, default=0.0)

# --- ADMIN DROPDOWN TABLES ---
class VendorList(Base):
    __tablename__ = 'vendor_list'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)