from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel


class DashboardKPI(BaseModel):
    label: str
    value: str
    trend: Optional[str] = None
    status: str = "neutral"  # positive | negative | warning | neutral


class MapSpillFeature(BaseModel):
    id: str
    investigation_id: str
    name: str
    center_lat: float
    center_lon: float
    polygon_coordinates: List[List[float]]
    area_km2: float
    status: str


class MapVesselFeature(BaseModel):
    id: str
    name: str
    imo: str
    vessel_type: str
    lat: float
    lon: float
    heading: float
    sog_knots: float
    is_candidate: bool = False


class MapOriginFeature(BaseModel):
    investigation_id: str
    lat: float
    lon: float
    probability: float
    uncertainty_km: float


class DashboardMapData(BaseModel):
    spills: List[MapSpillFeature]
    vessels: List[MapVesselFeature]
    origins: List[MapOriginFeature]
    center: List[float]  # [lon, lat]


class DashboardOut(BaseModel):
    kpis: List[DashboardKPI]
    map_data: DashboardMapData
    system_status: str
    api_status: str
    data_timestamp: datetime
    is_seed_data: bool = False
