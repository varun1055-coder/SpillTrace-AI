from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base, generate_uuid

class Vessel(Base):
    __tablename__ = "vessels"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(128), nullable=False)
    imo = Column(String(32), unique=True, nullable=False, index=True) # e.g. IMO 9876543
    mmsi = Column(String(32), unique=True, nullable=False)
    call_sign = Column(String(32), nullable=True)
    flag = Column(String(64), nullable=False)
    vessel_type = Column(String(64), nullable=False) # Crude Oil Tanker, Chemical Tanker, Bulk Carrier, Container Ship
    
    # Dimensions & Specs
    length_m = Column(Float, default=245.0)
    beam_m = Column(Float, default=42.0)
    draught_m = Column(Float, default=14.8)
    deadweight_tonnage = Column(Float, default=115000.0)
    
    # Voyage Info
    destination = Column(String(128), nullable=True)
    eta = Column(DateTime, nullable=True)
    last_ais_time = Column(DateTime, default=datetime.utcnow)
    
    # Current/Last Telemetry
    current_lat = Column(Float, nullable=False)
    current_lon = Column(Float, nullable=False)
    current_sog_knots = Column(Float, default=12.5) # Speed Over Ground
    current_cog_degrees = Column(Float, default=118.0) # Course Over Ground
    current_heading = Column(Float, default=119.0)
    nav_status = Column(String(64), default="Under way using engine")
    
    is_simulated = Column(Boolean, default=True) # All local reference vessels explicitly flagged

    # Relationships
    trajectories = relationship("VesselTrajectoryPoint", back_populates="vessel", cascade="all, delete-orphan")
    attribution_matches = relationship("CandidateVesselMatch", back_populates="vessel")


class VesselTrajectoryPoint(Base):
    __tablename__ = "vessel_trajectory_points"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    vessel_id = Column(String(64), ForeignKey("vessels.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    sog_knots = Column(Float, nullable=False)
    cog_degrees = Column(Float, nullable=False)
    heading_degrees = Column(Float, nullable=True)
    nav_status = Column(String(64), default="Under way using engine")
    is_interpolated = Column(Boolean, default=False)

    vessel = relationship("Vessel", back_populates="trajectories")
