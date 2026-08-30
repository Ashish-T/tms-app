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
    __tablename__ = 'trip_logs_v10' # <--- Upgraded to V10
    id = Column(Integer, primary_key=True)
    driver_id = Column(Integer, ForeignKey('users.id'))
    supervisor_id = Column(Integer, ForeignKey('users.id'))
    status = Column(String, default="Started") 
    
    date = Column(String)
    vehicle_number = Column(String)
    reporting_time = Column(String)
    out_time = Column(String)
    out_km = Column(Float, default=0.0)
    in_time = Column(String)
    in_km = Column(Float, default=0.0)
    vehicle_type = Column(String, nullable=True)
    vehicle_mode = Column(String, nullable=True)
    body_type = Column(String, nullable=True)
    vendor_name = Column(String, nullable=True)
    helper_name = Column(String, nullable=True)
    client_name = Column(String, nullable=True)
    source = Column(String, nullable=True)     
    destination = Column(String, nullable=True)
    
    fuel_litres = Column(Float, default=0.0)
    fuel_price = Column(Float, default=0.0)
    toll_charges = Column(Float, default=0.0)
    other_expenses = Column(Float, default=0.0)
    driver_cost = Column(Float, default=0.0)
    trip_days = Column(Float, default=1.0)          
    overtime_allowance = Column(Float, default=0.0) 
    vehicle_cost_type = Column(String, nullable=True)
    vehicle_cost = Column(Float, default=0.0)
    b2c_billing = Column(Float, default=0.0)
    total_running_cost = Column(Float, default=0.0) 
    profit = Column(Float, default=0.0) 

class VendorList(Base):
    __tablename__ = 'vendor_list'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)

class ClientList(Base):
    __tablename__ = 'client_list'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)

class VehicleList(Base):
    __tablename__ = 'vehicle_list_v2' 
    id = Column(Integer, primary_key=True)
    vehicle_number = Column(String, unique=True)
    ownership_type = Column(String, default="Third Party")
    emi = Column(Float, default=0.0)