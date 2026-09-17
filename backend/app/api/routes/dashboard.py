from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.repositories.investigations import InvestigationRepository
from app.repositories.spills import SpillRepository
from app.repositories.vessels import VesselRepository
from app.repositories.evidence import AttributionRepository, DriftRepository, DataSourceRepository
from app.schemas.dashboard import (
    DashboardOut, DashboardKPI, DashboardMapData,
    MapSpillFeature, MapVesselFeature, MapOriginFeature,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardOut)
def get_dashboard(db: Session = Depends(get_db)):
    inv_repo = InvestigationRepository(db)
    spill_repo = SpillRepository(db)
    vessel_repo = VesselRepository(db)
    attr_repo = AttributionRepository(db)
    drift_repo = DriftRepository(db)
    ds_repo = DataSourceRepository(db)

    investigations = inv_repo.get_all()
    active = [i for i in investigations if "Investigation" in i.status or "Pending" in i.status]
    spills = spill_repo.get_all()
    vessels = vessel_repo.get_all()

    candidate_ids = set()
    for inv in investigations:
        attr = attr_repo.get_by_investigation(inv.id)
        if attr:
            for c in attr.candidates[:3]:
                candidate_ids.add(c.vessel_id)

    high_risk = sum(
        1 for inv in investigations
        if (attr := attr_repo.get_by_investigation(inv.id))
        and attr.candidates
        and attr.candidates[0].overall_score >= 75
    )

    avg_conf = (
        sum(i.detection_confidence for i in investigations) / len(investigations)
        if investigations else 0
    )

    sources = ds_repo.get_all()
    online_sources = sum(1 for s in sources if s.status == "Online")

    kpis = [
        DashboardKPI(label="Active Spill Events", value=str(len(active)), trend="+2 this week", status="warning"),
        DashboardKPI(label="Investigations", value=str(len(investigations)), trend=f"{len(active)} active", status="neutral"),
        DashboardKPI(label="High-Risk Vessels", value=str(high_risk), trend="Attribution ≥75%", status="negative"),
        DashboardKPI(label="Candidate Vessels", value=str(len(candidate_ids)), trend="Across all cases", status="neutral"),
        DashboardKPI(label="Detection Confidence", value=f"{avg_conf:.1f}%", trend="Avg. across events", status="positive"),
        DashboardKPI(label="Data Sources Online", value=f"{online_sources}/{len(sources)}", trend="All nominal", status="positive"),
    ]

    spill_features = [
        MapSpillFeature(
            id=s.id,
            investigation_id=s.investigation_id,
            name=s.name,
            center_lat=s.center_lat,
            center_lon=s.center_lon,
            polygon_coordinates=s.polygon_coordinates,
            area_km2=s.area_km2,
            status=next((i.status for i in investigations if i.id == s.investigation_id), "Unknown"),
        )
        for s in spills
    ]

    vessel_features = [
        MapVesselFeature(
            id=v.id,
            name=v.name,
            imo=v.imo,
            vessel_type=v.vessel_type,
            lat=v.current_lat,
            lon=v.current_lon,
            heading=v.current_heading,
            sog_knots=v.current_sog_knots,
            is_candidate=v.id in candidate_ids,
        )
        for v in vessels
    ]

    origin_features = []
    for inv in investigations:
        drift = drift_repo.get_by_investigation(inv.id)
        if drift:
            origin_features.append(MapOriginFeature(
                investigation_id=inv.id,
                lat=drift.origin_lat,
                lon=drift.origin_lon,
                probability=drift.origin_probability,
                uncertainty_km=drift.origin_uncertainty_km,
            ))

    map_data = DashboardMapData(
        spills=spill_features,
        vessels=vessel_features,
        origins=origin_features,
        center=[67.0, 20.0],
    )

    return DashboardOut(
        kpis=kpis,
        map_data=map_data,
        system_status="Operational",
        api_status="Online",
        data_timestamp=datetime.utcnow(),
        is_seed_data=False,
    )
