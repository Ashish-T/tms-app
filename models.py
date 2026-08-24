import os
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
import enum
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

Base = declarative_base()

# Fetch DB URL from environment, fallback to SQLite if missing
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://tmsdb:GfsZKytEDuEii7tC8VD8lgEHWwQLwLby@dpg-da68mlv10e5c73eiampg-a.oregon-postgres.render.com/tmsdb_n8md")

# Fix legacy Postgres URLs often provided by cloud hosts
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite requires specific arguments that PostgreSQL does not
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class TripStatus(enum.Enum):
    PENDING = "Pending"
    IN_TRANSIT = "In Transit"
    COMPLETED = "Completed"

class ExpenseType(enum.Enum):
    DIESEL = "Diesel"
    TOLL = "Toll"
    MAINTENANCE = "Maintenance"
    OTHER = "Other"

class Driver(Base):
    __tablename__ = 'drivers'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    trips = relationship("Trip", back_populates="driver")

class Vehicle(Base):
    __tablename__ = 'vehicles'
    id = Column(Integer, primary_key=True)
    registration_number = Column(String, unique=True, nullable=False)
    model = Column(String)
    trips = relationship("Trip", back_populates="vehicle")

class Trip(Base):
    __tablename__ = 'trips'
    id = Column(Integer, primary_key=True)
    driver_id = Column(Integer, ForeignKey('drivers.id'))
    vehicle_id = Column(Integer, ForeignKey('vehicles.id'))
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    status = Column(Enum(TripStatus), default=TripStatus.PENDING)
    start_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    end_time = Column(DateTime, nullable=True)
    start_km = Column(Float, nullable=False)
    end_km = Column(Float, nullable=True)
    
    driver = relationship("Driver", back_populates="trips")
    vehicle = relationship("Vehicle", back_populates="trips")
    expenses = relationship("Expense", back_populates="trip")

class Expense(Base):
    __tablename__ = 'expenses'
    id = Column(Integer, primary_key=True)
    trip_id = Column(Integer, ForeignKey('trips.id'))
    expense_type = Column(Enum(ExpenseType), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    trip = relationship("Trip", back_populates="expenses")
