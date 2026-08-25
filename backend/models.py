import os
from sqlalchemy import Column, Integer, String, Float, Boolean, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()
Base = declarative_base()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tms.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class TripLog(Base):
    __tablename__ = 'trip_logs'
    id = Column(Integer, primary_key=True)
    
    # 1-16: Driver Inputs
    date = Column(String)
    vehicle_number = Column(String)
    vehicle_type = Column(String)
    reporting_time = Column(String)
    out_time = Column(String)
    out_km = Column(Float)
    in_time = Column(String)
    in_km = Column(Float)
    driver_name = Column(String)
    mobile_number = Column(String)
    vendor_name = Column(String)
    helper_name = Column(String)
    toll_money = Column(Float, default=0.0)
    fuel_litres = Column(Float, default=0.0)
    fuel_price = Column(Float, default=0.0)
    police_fines = Column(Float, default=0.0)
    
    # 17-21: Admin Inputs & Calculated Fields
    driver_cost = Column(Float, default=0.0)
    vehicle_charged = Column(Float, default=0.0)
    billing_amount = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    profit = Column(Float, default=0.0)
    
    # Status Flag
    is_billed = Column(Boolean, default=False)