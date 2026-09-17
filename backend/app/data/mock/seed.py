"""
SpillTrace AI — local seed data
Populates the SQLite database with realistic maritime forensic reference data.
All data is clearly flagged is_simulated=True and represents operational test scenarios.
Geographic focus: Arabian Sea, Persian Gulf, Red Sea, Bay of Bengal.
"""
from datetime import datetime, timedelta
import json
from sqlalchemy.orm import Session

from app.models.base import engine, Base, SessionLocal
from app.models.investigation import Investigation
from app.models.spill import SpillEvent, SpillDetection
from app.models.vessel import Vessel, VesselTrajectoryPoint
from app.models.drift import DriftSimulation
from app.models.attribution import AttributionResult, CandidateVesselMatch
from app.models.evidence import EvidenceItem
from app.models.report import DataSource, ForensicReport

NOW = datetime(2026, 9, 14, 18, 0, 0)  # Reference timestamp for local seed data


# ─── Helpers ──────────────────────────────────────────────────────────────────

def dt(hours_ago: float) -> datetime:
    return NOW - timedelta(hours=hours_ago)


def make_ellipse_polygon(center_lat: float, center_lon: float,
                          lat_radius: float, lon_radius: float,
                          points: int = 18) -> list:
    import math
    coords = []
    for i in range(points):
        angle = 2 * math.pi * i / points
        coords.append([
            round(center_lon + lon_radius * math.cos(angle), 5),
            round(center_lat + lat_radius * math.sin(angle), 5),
        ])
    coords.append(coords[0])  # close ring
    return coords


def make_backward_tracks(origin_lat, origin_lon, spill_lat, spill_lon, n_tracks=8):
    """Generate simplified backward drift particle tracks."""
    import math, random
    tracks = []
    for i in range(n_tracks):
        jitter_lat = random.uniform(-0.05, 0.05)
        jitter_lon = random.uniform(-0.05, 0.05)
        points = []
        for step in range(9):
            frac = step / 8
            lat = spill_lat + frac * (origin_lat - spill_lat) + jitter_lat * (1 - frac)
            lon = spill_lon + frac * (origin_lon - spill_lon) + jitter_lon * (1 - frac)
            points.append({
                "lat": round(lat, 4),
                "lon": round(lon, 4),
                "timestamp": (NOW - timedelta(hours=8 - step)).isoformat(),
                "probability": round(0.85 - frac * 0.1 + random.uniform(-0.05, 0.05), 2),
            })
        tracks.append(points)
    return tracks


# ─── Investigations ────────────────────────────────────────────────────────────

INVESTIGATIONS = [
    {
        "id": "inv-0047",
        "reference_code": "INV-2026-0047",
        "title": "Arabian Sea Oil Spill — Investigation #0047",
        "status": "Under Investigation",
        "priority": "Critical",
        "region": "Arabian Sea",
        "detection_time": dt(6),
        "estimated_area_km2": 18.6,
        "detection_confidence": 94.7,
        "estimated_spill_age_hours": "4.2–6.1 hours",
        "satellite_source": "Sentinel-1A SAR C-Band (IW Mode)",
        "center_lat": 18.42,
        "center_lon": 67.21,
        "current_stage": 5,
        "summary": (
            "A significant oil slick was detected by Sentinel-1A SAR imagery at 18.42°N 67.21°E "
            "in the Arabian Sea. Estimated area of 18.6 km² with 94.7% detection confidence. "
            "Backward drift reconstruction points to a probable origin 7.4 km NW of the detected slick, "
            "occurring 4–6 hours before detection. Three candidate vessels have been identified via AIS correlation."
        ),
    },
    {
        "id": "inv-0044",
        "reference_code": "INV-2026-0044",
        "title": "Persian Gulf Tanker Route Spill — Investigation #0044",
        "status": "Attributed — Pending Review",
        "priority": "High",
        "region": "Persian Gulf",
        "detection_time": dt(72),
        "estimated_area_km2": 9.3,
        "detection_confidence": 88.2,
        "estimated_spill_age_hours": "2.8–4.5 hours",
        "satellite_source": "Sentinel-1B SAR C-Band (IW Mode)",
        "center_lat": 26.15,
        "center_lon": 55.80,
        "current_stage": 7,
        "summary": (
            "Oil slick detected along the major Persian Gulf tanker route near 26.15°N 55.80°E. "
            "Attribution analysis strongly points to MT Desert Wind based on trajectory and behaviour data. "
            "Case is pending review by senior analyst."
        ),
    },
    {
        "id": "inv-0041",
        "reference_code": "INV-2026-0041",
        "title": "Red Sea Shipping Lane Contamination — Investigation #0041",
        "status": "Under Investigation",
        "priority": "High",
        "region": "Red Sea",
        "detection_time": dt(120),
        "estimated_area_km2": 5.7,
        "detection_confidence": 79.4,
        "estimated_spill_age_hours": "6.0–9.0 hours",
        "satellite_source": "Sentinel-1A SAR C-Band (SM Mode)",
        "center_lat": 21.5,
        "center_lon": 38.3,
        "current_stage": 3,
        "summary": (
            "Smaller slick detected in the Red Sea near 21.5°N 38.3°E. Lower confidence due to "
            "marginal wind conditions (near look-alike threshold). Drift reconstruction underway."
        ),
    },
    {
        "id": "inv-0038",
        "reference_code": "INV-2026-0038",
        "title": "Bay of Bengal Bulk Carrier Incident — Investigation #0038",
        "status": "Closed — Inconclusive",
        "priority": "Medium",
        "region": "Bay of Bengal",
        "detection_time": dt(240),
        "estimated_area_km2": 3.2,
        "detection_confidence": 71.6,
        "estimated_spill_age_hours": "8.0–12.0 hours",
        "satellite_source": "Sentinel-1B SAR C-Band (IW Mode)",
        "center_lat": 13.8,
        "center_lon": 82.5,
        "current_stage": 8,
        "summary": (
            "Small slick detected in Bay of Bengal. Low detection confidence and limited AIS coverage "
            "resulted in inconclusive attribution. Case closed pending new evidence."
        ),
    },
    {
        "id": "inv-0052",
        "reference_code": "INV-2026-0052",
        "title": "Gulf of Oman Crude Tanker Discharge — Investigation #0052",
        "status": "Under Investigation",
        "priority": "Critical",
        "region": "Gulf of Oman",
        "detection_time": dt(2),
        "estimated_area_km2": 24.1,
        "detection_confidence": 96.3,
        "estimated_spill_age_hours": "1.5–3.0 hours",
        "satellite_source": "Sentinel-1A SAR C-Band (IW Mode)",
        "center_lat": 23.5,
        "center_lon": 58.9,
        "current_stage": 2,
        "summary": (
            "Large fresh oil slick detected in Gulf of Oman. Very recent — estimated 1.5–3.0 hours old. "
            "High confidence detection. Spill characterization underway. Candidate vessel identification not yet started."
        ),
    },
]


# ─── Vessels ──────────────────────────────────────────────────────────────────

VESSELS = [
    # Primary candidate for INV-0047
    {
        "id": "v-ocean-star",
        "name": "MT Ocean Star",
        "imo": "IMO9876543",
        "mmsi": "636012345",
        "call_sign": "V7OS9",
        "flag": "Marshall Islands",
        "vessel_type": "Crude Oil Tanker",
        "length_m": 274.0,
        "beam_m": 48.0,
        "draught_m": 16.2,
        "deadweight_tonnage": 158000.0,
        "destination": "Fujairah, UAE",
        "current_lat": 18.98,
        "current_lon": 68.12,
        "current_sog_knots": 13.2,
        "current_cog_degrees": 295.0,
        "current_heading": 296.0,
        "nav_status": "Under way using engine",
    },
    # Secondary candidate for INV-0047
    {
        "id": "v-blue-horizon",
        "name": "MV Blue Horizon",
        "imo": "IMO9123456",
        "mmsi": "248345678",
        "call_sign": "9HA4231",
        "flag": "Malta",
        "vessel_type": "Chemical Tanker",
        "length_m": 189.0,
        "beam_m": 32.5,
        "draught_m": 11.8,
        "deadweight_tonnage": 40000.0,
        "destination": "Karachi, Pakistan",
        "current_lat": 19.45,
        "current_lon": 66.70,
        "current_sog_knots": 11.8,
        "current_cog_degrees": 340.0,
        "current_heading": 342.0,
        "nav_status": "Under way using engine",
    },
    # Third candidate for INV-0047
    {
        "id": "v-pacific-trader",
        "name": "MT Pacific Trader",
        "imo": "IMO9345678",
        "mmsi": "565012789",
        "call_sign": "9V2PT",
        "flag": "Singapore",
        "vessel_type": "Crude Oil Tanker",
        "length_m": 243.0,
        "beam_m": 42.0,
        "draught_m": 14.5,
        "deadweight_tonnage": 105000.0,
        "destination": "Mumbai, India",
        "current_lat": 17.85,
        "current_lon": 67.90,
        "current_sog_knots": 9.4,
        "current_cog_degrees": 115.0,
        "current_heading": 117.0,
        "nav_status": "Under way using engine",
    },
    # Persian Gulf vessels
    {
        "id": "v-desert-wind",
        "name": "MT Desert Wind",
        "imo": "IMO9567890",
        "mmsi": "470123456",
        "call_sign": "A6DW7",
        "flag": "UAE",
        "vessel_type": "Crude Oil Tanker",
        "length_m": 333.0,
        "beam_m": 58.0,
        "draught_m": 20.5,
        "deadweight_tonnage": 295000.0,
        "destination": "Ras Tanura, Saudi Arabia",
        "current_lat": 26.80,
        "current_lon": 56.20,
        "current_sog_knots": 14.8,
        "current_cog_degrees": 270.0,
        "current_heading": 272.0,
        "nav_status": "Under way using engine",
    },
    {
        "id": "v-gulf-pioneer",
        "name": "MV Gulf Pioneer",
        "imo": "IMO9234567",
        "mmsi": "447890123",
        "call_sign": "SU3GP",
        "flag": "Egypt",
        "vessel_type": "General Cargo",
        "length_m": 142.0,
        "beam_m": 22.0,
        "draught_m": 8.4,
        "deadweight_tonnage": 14000.0,
        "destination": "Jebel Ali, UAE",
        "current_lat": 25.90,
        "current_lon": 55.50,
        "current_sog_knots": 10.2,
        "current_cog_degrees": 50.0,
        "current_heading": 52.0,
        "nav_status": "Under way using engine",
    },
    # Red Sea vessels
    {
        "id": "v-nile-carrier",
        "name": "MT Nile Carrier",
        "imo": "IMO9456789",
        "mmsi": "622098765",
        "call_sign": "SU7NC",
        "flag": "Egypt",
        "vessel_type": "Product Tanker",
        "length_m": 183.0,
        "beam_m": 32.0,
        "draught_m": 10.2,
        "deadweight_tonnage": 37000.0,
        "destination": "Port Sudan",
        "current_lat": 21.8,
        "current_lon": 37.9,
        "current_sog_knots": 12.1,
        "current_cog_degrees": 320.0,
        "current_heading": 321.0,
        "nav_status": "Under way using engine",
    },
    {
        "id": "v-eastern-passage",
        "name": "MV Eastern Passage",
        "imo": "IMO9678901",
        "mmsi": "355678901",
        "call_sign": "3FEP4",
        "flag": "Panama",
        "vessel_type": "Bulk Carrier",
        "length_m": 228.0,
        "beam_m": 38.0,
        "draught_m": 13.6,
        "deadweight_tonnage": 82000.0,
        "destination": "Aden, Yemen",
        "current_lat": 21.2,
        "current_lon": 38.7,
        "current_sog_knots": 8.7,
        "current_cog_degrees": 160.0,
        "current_heading": 161.0,
        "nav_status": "Under way using engine",
    },
    # Bay of Bengal vessels
    {
        "id": "v-bay-star",
        "name": "MV Bay Star",
        "imo": "IMO9789012",
        "mmsi": "419012345",
        "call_sign": "ATBS9",
        "flag": "India",
        "vessel_type": "Bulk Carrier",
        "length_m": 195.0,
        "beam_m": 32.0,
        "draught_m": 12.4,
        "deadweight_tonnage": 56000.0,
        "destination": "Chennai, India",
        "current_lat": 14.1,
        "current_lon": 82.1,
        "current_sog_knots": 11.6,
        "current_cog_degrees": 220.0,
        "current_heading": 222.0,
        "nav_status": "Under way using engine",
    },
    {
        "id": "v-andaman-spirit",
        "name": "MT Andaman Spirit",
        "imo": "IMO9890123",
        "mmsi": "524123456",
        "call_sign": "9V9AS",
        "flag": "Singapore",
        "vessel_type": "Product Tanker",
        "length_m": 161.0,
        "beam_m": 27.4,
        "draught_m": 9.8,
        "deadweight_tonnage": 23500.0,
        "destination": "Paradip, India",
        "current_lat": 13.5,
        "current_lon": 83.0,
        "current_sog_knots": 10.9,
        "current_cog_degrees": 278.0,
        "current_heading": 280.0,
        "nav_status": "Under way using engine",
    },
    # Gulf of Oman vessels
    {
        "id": "v-oman-eagle",
        "name": "MT Oman Eagle",
        "imo": "IMO9901234",
        "mmsi": "461234567",
        "call_sign": "A4OE8",
        "flag": "Oman",
        "vessel_type": "Crude Oil Tanker",
        "length_m": 308.0,
        "beam_m": 50.0,
        "draught_m": 18.8,
        "deadweight_tonnage": 220000.0,
        "destination": "Mina Al Fahal Terminal",
        "current_lat": 23.8,
        "current_lon": 59.4,
        "current_sog_knots": 16.1,
        "current_cog_degrees": 200.0,
        "current_heading": 202.0,
        "nav_status": "Under way using engine",
    },
    {
        "id": "v-makran-voyager",
        "name": "MV Makran Voyager",
        "imo": "IMO9012345",
        "mmsi": "431567890",
        "call_sign": "PQMV7",
        "flag": "Pakistan",
        "vessel_type": "Container Ship",
        "length_m": 299.0,
        "beam_m": 46.0,
        "draught_m": 14.2,
        "deadweight_tonnage": 120000.0,
        "destination": "Gwadar, Pakistan",
        "current_lat": 23.2,
        "current_lon": 58.4,
        "current_sog_knots": 18.4,
        "current_cog_degrees": 45.0,
        "current_heading": 47.0,
        "nav_status": "Under way using engine",
    },
    # Misc additional vessels
    {
        "id": "v-indian-lotus",
        "name": "MT Indian Lotus",
        "imo": "IMO9111213",
        "mmsi": "419112233",
        "call_sign": "ATIN2",
        "flag": "India",
        "vessel_type": "Product Tanker",
        "length_m": 176.0,
        "beam_m": 30.4,
        "draught_m": 10.6,
        "deadweight_tonnage": 31000.0,
        "destination": "Kochi, India",
        "current_lat": 17.2,
        "current_lon": 70.8,
        "current_sog_knots": 12.8,
        "current_cog_degrees": 95.0,
        "current_heading": 96.0,
        "nav_status": "Under way using engine",
    },
    {
        "id": "v-silver-mariner",
        "name": "MV Silver Mariner",
        "imo": "IMO9141516",
        "mmsi": "248556677",
        "call_sign": "9HAS5",
        "flag": "Malta",
        "vessel_type": "General Cargo",
        "length_m": 138.0,
        "beam_m": 20.5,
        "draught_m": 7.6,
        "deadweight_tonnage": 11500.0,
        "destination": "Colombo, Sri Lanka",
        "current_lat": 15.4,
        "current_lon": 72.3,
        "current_sog_knots": 10.6,
        "current_cog_degrees": 125.0,
        "current_heading": 126.0,
        "nav_status": "Under way using engine",
    },
    {
        "id": "v-hormuz-ranger",
        "name": "MT Hormuz Ranger",
        "imo": "IMO9171819",
        "mmsi": "470778899",
        "call_sign": "A6HR3",
        "flag": "UAE",
        "vessel_type": "Crude Oil Tanker",
        "length_m": 249.0,
        "beam_m": 43.0,
        "draught_m": 15.1,
        "deadweight_tonnage": 112000.0,
        "destination": "Kharg Island, Iran",
        "current_lat": 24.6,
        "current_lon": 57.1,
        "current_sog_knots": 13.7,
        "current_cog_degrees": 330.0,
        "current_heading": 332.0,
        "nav_status": "Under way using engine",
    },
    {
        "id": "v-cape-fortune",
        "name": "MV Cape Fortune",
        "imo": "IMO9202122",
        "mmsi": "355221100",
        "call_sign": "3FCF8",
        "flag": "Panama",
        "vessel_type": "Bulk Carrier",
        "length_m": 212.0,
        "beam_m": 36.0,
        "draught_m": 13.0,
        "deadweight_tonnage": 72000.0,
        "destination": "Mundra Port, India",
        "current_lat": 20.1,
        "current_lon": 64.7,
        "current_sog_knots": 14.2,
        "current_cog_degrees": 68.0,
        "current_heading": 70.0,
        "nav_status": "Under way using engine",
    },
]


def generate_trajectory(vessel_id: str, current_lat: float, current_lon: float,
                        cog: float, hours: int = 12, interval_h: float = 0.5) -> list:
    """Generate a realistic AIS trajectory going backward in time."""
    import math
    points = []
    lat, lon = current_lat, current_lon
    cog_rad = math.radians(cog)
    speed_deg_per_hour = 0.14  # ~15 knots
    for i in range(int(hours / interval_h)):
        t = NOW - timedelta(hours=i * interval_h)
        # Slight course variation
        variation = math.sin(i * 0.3) * 3
        lat -= speed_deg_per_hour * interval_h * math.cos(math.radians(cog + variation))
        lon -= speed_deg_per_hour * interval_h * math.sin(math.radians(cog + variation))
        sog = 12.0 + math.sin(i * 0.5) * 2.5
        # Anomalous slowdown for primary candidate vessels around spill time
        if vessel_id in ("v-ocean-star",) and 5 <= i <= 7:
            sog = 3.1  # Suspicious slowdown
        points.append({
            "vessel_id": vessel_id,
            "timestamp": t,
            "latitude": round(lat, 5),
            "longitude": round(lon, 5),
            "sog_knots": round(sog, 1),
            "cog_degrees": round(cog + variation, 1),
            "heading_degrees": round(cog + variation + 1.0, 1),
            "nav_status": "Under way using engine",
            "is_interpolated": False,
        })
    return points


# ─── Attribution Evidence Bullets ─────────────────────────────────────────────

OCEAN_STAR_EVIDENCE = [
    "Vessel was within the probable origin zone (HIGH confidence region) during the estimated spill window (12:10–13:05 UTC).",
    "AIS trajectory is spatially consistent with the reconstructed backward drift vector (deviation < 2.3°).",
    "Vessel passed within 3.8 km of the highest-probability origin centroid.",
    "AIS data shows an anomalous speed reduction from 13.2 to 3.1 knots during 12:10–12:48 UTC — inconsistent with normal transit.",
    "Counterfactual forward drift simulation initiated from vessel position at T-5h produced 81.6% spatial overlap with observed slick.",
    "Vessel type (Crude Oil Tanker, 158,000 DWT) is consistent with the inferred oil composition (Heavy Crude API 28.5).",
]

BLUE_HORIZON_EVIDENCE = [
    "Vessel was in the broader origin zone (MEDIUM confidence region) during the estimated spill window.",
    "Trajectory is partially consistent with the drift direction (deviation 14.7°).",
    "Vessel passed within 12.4 km of the high-probability origin centroid.",
    "No significant speed anomaly detected during the relevant window.",
    "Counterfactual simulation produced 52.3% spatial overlap — moderate consistency.",
    "Vessel type (Chemical Tanker) is compatible but less likely given inferred oil type.",
]

PACIFIC_TRADER_EVIDENCE = [
    "Vessel was at the outer edge of the medium-probability origin zone.",
    "Trajectory deviation of 31.2° from optimal drift direction — low consistency.",
    "Vessel passed 24.1 km from the high-probability origin centroid.",
    "No speed anomalies detected.",
    "Counterfactual simulation produced only 34.1% spatial overlap.",
    "Evidence is insufficient to confirm as a likely source.",
]


def seed_all(db: Session) -> None:
    """Seed all local reference data into the database."""
    print("Seeding SpillTrace AI local reference data...")

    # ── Data Sources ────────────────────────────────────────────────────────
    data_sources_data = [
        {
            "name": "Sentinel-1 SAR (ESA Copernicus)",
            "category": "Satellite",
            "provider": "European Space Agency / Copernicus",
            "description": "C-Band Synthetic Aperture Radar imagery for oil spill detection. 6-day repeat cycle, 10m spatial resolution.",
            "status": "Online",
            "last_update": dt(0.13),
            "update_interval_minutes": 360.0,
            "latency_seconds": 480.0,
            "coverage": "Global (revisit ~6 days)",
            "records_processed": 14723.0,
        },
        {
            "name": "AIS Historical Feed (Spire Maritime)",
            "category": "AIS",
            "provider": "Spire Maritime (Simulated)",
            "description": "Historical Automatic Identification System vessel positions and voyage data. Global coverage.",
            "status": "Online",
            "last_update": dt(0.02),
            "update_interval_minutes": 5.0,
            "latency_seconds": 45.0,
            "coverage": "Global (terrestrial + satellite AIS)",
            "records_processed": 2847291.0,
        },
        {
            "name": "CMEMS Ocean Currents (GLORYS12)",
            "category": "Ocean Currents",
            "provider": "Copernicus Marine Service",
            "description": "Global Ocean Physics Reanalysis. 1/12° horizontal resolution, daily frequency. Used for Lagrangian drift modelling.",
            "status": "Online",
            "last_update": dt(1.2),
            "update_interval_minutes": 1440.0,
            "latency_seconds": 2400.0,
            "coverage": "Global Ocean (1/12°)",
            "records_processed": 38492.0,
        },
        {
            "name": "ERA5 Wind Reanalysis (ECMWF)",
            "category": "Wind",
            "provider": "European Centre for Medium-Range Weather Forecasts",
            "description": "Hourly wind fields at 10m height. 31km spatial resolution. Critical for windage correction in drift modelling.",
            "status": "Online",
            "last_update": dt(2.1),
            "update_interval_minutes": 60.0,
            "latency_seconds": 900.0,
            "coverage": "Global (0.25°)",
            "records_processed": 104820.0,
        },
        {
            "name": "OpenOil Weathering Model",
            "category": "Model",
            "provider": "SINTEF / OpenOil (Simulated Interface)",
            "description": "Oil weathering and properties modelling. Estimates evaporation, emulsification, and viscosity changes over time.",
            "status": "Online",
            "last_update": dt(0.5),
            "update_interval_minutes": 30.0,
            "latency_seconds": 120.0,
            "coverage": "On-demand computation",
            "records_processed": 847.0,
        },
        {
            "name": "SpillTrace Attribution Engine",
            "category": "Model",
            "provider": "SpillTrace AI Internal",
            "description": "Multi-evidence attribution scoring engine. Combines spatial, temporal, behavioural, and simulation evidence.",
            "status": "Online",
            "last_update": dt(0.0),
            "update_interval_minutes": 15.0,
            "latency_seconds": 60.0,
            "coverage": "All active investigations",
            "records_processed": 523.0,
        },
    ]
    ds_map = {}
    for dsd in data_sources_data:
        ds = DataSource(**dsd, is_mock=True)
        db.add(ds)
        ds_map[dsd["name"]] = ds

    # ── Investigations ───────────────────────────────────────────────────────
    inv_map = {}
    for inv_data in INVESTIGATIONS:
        inv = Investigation(**inv_data)
        db.add(inv)
        inv_map[inv_data["id"]] = inv
    db.flush()

    # ── Spill Events ─────────────────────────────────────────────────────────
    spill_0047 = SpillEvent(
        id="spill-0047",
        investigation_id="inv-0047",
        name="Arabian Sea Slick — INV-0047",
        detected_at=dt(6),
        center_lat=18.42,
        center_lon=67.21,
        polygon_coordinates=make_ellipse_polygon(18.42, 67.21, 0.08, 0.12),
        area_km2=18.6,
        estimated_volume_m3=620.0,
        oil_type="Heavy Crude Oil (API 28.5)",
        estimated_age_min_hours=4.2,
        estimated_age_max_hours=6.1,
    )
    db.add(spill_0047)

    det_0047 = SpillDetection(
        id="det-0047",
        spill_id="spill-0047",
        satellite_name="Sentinel-1A",
        sensor_type="C-SAR (IW Mode)",
        acquisition_time=dt(6),
        confidence=94.7,
        mean_backscatter_db=-24.6,
        ambient_backscatter_db=-14.2,
        contrast_db=-10.4,
        incidence_angle_deg=36.4,
        polarization="VV+VH",
        biogenic_slick_rejection=96.2,
        low_wind_calm_rejection=92.8,
        internal_wave_rejection=98.5,
        rain_cell_rejection=95.1,
        sar_preview_url=None,
    )
    db.add(det_0047)

    spill_0044 = SpillEvent(
        id="spill-0044",
        investigation_id="inv-0044",
        name="Persian Gulf Slick — INV-0044",
        detected_at=dt(72),
        center_lat=26.15,
        center_lon=55.80,
        polygon_coordinates=make_ellipse_polygon(26.15, 55.80, 0.05, 0.07),
        area_km2=9.3,
        estimated_volume_m3=290.0,
        oil_type="Medium Crude Oil (API 34.0)",
        estimated_age_min_hours=2.8,
        estimated_age_max_hours=4.5,
    )
    db.add(spill_0044)

    spill_0041 = SpillEvent(
        id="spill-0041",
        investigation_id="inv-0041",
        name="Red Sea Slick — INV-0041",
        detected_at=dt(120),
        center_lat=21.5,
        center_lon=38.3,
        polygon_coordinates=make_ellipse_polygon(21.5, 38.3, 0.03, 0.05),
        area_km2=5.7,
        estimated_volume_m3=145.0,
        oil_type="Light Fuel Oil (IFO 380)",
        estimated_age_min_hours=6.0,
        estimated_age_max_hours=9.0,
    )
    db.add(spill_0041)

    spill_0038 = SpillEvent(
        id="spill-0038",
        investigation_id="inv-0038",
        name="Bay of Bengal Slick — INV-0038",
        detected_at=dt(240),
        center_lat=13.8,
        center_lon=82.5,
        polygon_coordinates=make_ellipse_polygon(13.8, 82.5, 0.02, 0.03),
        area_km2=3.2,
        estimated_volume_m3=78.0,
        oil_type="Unknown — Low Signal",
        estimated_age_min_hours=8.0,
        estimated_age_max_hours=12.0,
    )
    db.add(spill_0038)

    spill_0052 = SpillEvent(
        id="spill-0052",
        investigation_id="inv-0052",
        name="Gulf of Oman Fresh Slick — INV-0052",
        detected_at=dt(2),
        center_lat=23.5,
        center_lon=58.9,
        polygon_coordinates=make_ellipse_polygon(23.5, 58.9, 0.10, 0.15),
        area_km2=24.1,
        estimated_volume_m3=890.0,
        oil_type="Heavy Crude Oil (API 27.1)",
        estimated_age_min_hours=1.5,
        estimated_age_max_hours=3.0,
    )
    db.add(spill_0052)
    db.flush()

    # ── Vessels ───────────────────────────────────────────────────────────────
    vessel_map = {}
    for vd in VESSELS:
        v = Vessel(**vd, is_simulated=True, last_ais_time=dt(0.1))
        db.add(v)
        vessel_map[vd["id"]] = v
    db.flush()

    # ── Trajectories ─────────────────────────────────────────────────────────
    for vd in VESSELS:
        v = vessel_map[vd["id"]]
        points = generate_trajectory(
            vd["id"], vd["current_lat"], vd["current_lon"],
            vd["current_cog_degrees"], hours=18
        )
        for p in points:
            tp = VesselTrajectoryPoint(**p)
            db.add(tp)

    # ── Drift Simulations ──────────────────────────────────────────────────
    drift_0047 = DriftSimulation(
        id="drift-0047",
        investigation_id="inv-0047",
        simulation_type="backward",
        model_version="mock-lagrangian-v1.0",
        particle_count=500,
        time_step_hours=1.0,
        total_hours=8.0,
        origin_lat=18.48,
        origin_lon=67.09,
        origin_uncertainty_km=7.4,
        origin_probability=0.78,
        origin_time_start=dt(12.2),
        origin_time_end=dt(11.0),
        probability_zones={
            "high": make_ellipse_polygon(18.48, 67.09, 0.04, 0.05),
            "medium": make_ellipse_polygon(18.48, 67.09, 0.08, 0.10),
            "low": make_ellipse_polygon(18.48, 67.09, 0.14, 0.18),
        },
        particle_tracks=make_backward_tracks(18.48, 67.09, 18.42, 67.21),
        current_dataset="CMEMS GLORYS12 (simulated)",
        wind_dataset="ERA5 Reanalysis (simulated)",
        wind_speed_ms=8.2,
        wind_direction_deg=245.0,
        current_speed_ms=0.45,
        current_direction_deg=310.0,
        is_simulated=True,
    )
    db.add(drift_0047)

    drift_0044 = DriftSimulation(
        id="drift-0044",
        investigation_id="inv-0044",
        simulation_type="backward",
        model_version="mock-lagrangian-v1.0",
        particle_count=500,
        time_step_hours=1.0,
        total_hours=6.0,
        origin_lat=26.22,
        origin_lon=55.65,
        origin_uncertainty_km=5.2,
        origin_probability=0.86,
        origin_time_start=dt(76.5),
        origin_time_end=dt(75.2),
        probability_zones={
            "high": make_ellipse_polygon(26.22, 55.65, 0.03, 0.04),
            "medium": make_ellipse_polygon(26.22, 55.65, 0.06, 0.08),
            "low": make_ellipse_polygon(26.22, 55.65, 0.11, 0.14),
        },
        particle_tracks=make_backward_tracks(26.22, 55.65, 26.15, 55.80),
        current_dataset="CMEMS GLORYS12 (simulated)",
        wind_dataset="ERA5 Reanalysis (simulated)",
        wind_speed_ms=12.4,
        wind_direction_deg=310.0,
        current_speed_ms=0.62,
        current_direction_deg=285.0,
        is_simulated=True,
    )
    db.add(drift_0044)
    db.flush()

    # ── Attribution ────────────────────────────────────────────────────────
    attr_0047 = AttributionResult(
        id="attr-0047",
        investigation_id="inv-0047",
        model_version="mock-attribution-v1.0",
    )
    db.add(attr_0047)
    db.flush()

    candidates_0047 = [
        CandidateVesselMatch(
            attribution_result_id="attr-0047",
            vessel_id="v-ocean-star",
            rank=1, overall_score=87.4, confidence_level="High",
            temporal_compatibility=82.0, spatial_proximity=91.0,
            drift_consistency=94.0, trajectory_compatibility=86.0,
            behaviour_anomaly=71.0, counterfactual_similarity=92.0,
            evidence_bullets=OCEAN_STAR_EVIDENCE, evidence_strength="Strong",
            counterfactual_spatial_overlap_pct=81.6,
            counterfactual_centroid_error_km=4.2,
            counterfactual_shape_similarity=84.3,
            counterfactual_temporal_consistency=91.0,
            counterfactual_overall_similarity=86.8,
            is_simulated=True,
        ),
        CandidateVesselMatch(
            attribution_result_id="attr-0047",
            vessel_id="v-blue-horizon",
            rank=2, overall_score=64.2, confidence_level="Medium",
            temporal_compatibility=68.0, spatial_proximity=58.0,
            drift_consistency=61.0, trajectory_compatibility=72.0,
            behaviour_anomaly=54.0, counterfactual_similarity=52.0,
            evidence_bullets=BLUE_HORIZON_EVIDENCE, evidence_strength="Moderate",
            counterfactual_spatial_overlap_pct=52.3,
            counterfactual_centroid_error_km=12.8,
            counterfactual_shape_similarity=49.7,
            counterfactual_temporal_consistency=71.0,
            counterfactual_overall_similarity=56.4,
            is_simulated=True,
        ),
        CandidateVesselMatch(
            attribution_result_id="attr-0047",
            vessel_id="v-pacific-trader",
            rank=3, overall_score=41.8, confidence_level="Low",
            temporal_compatibility=45.0, spatial_proximity=38.0,
            drift_consistency=44.0, trajectory_compatibility=41.0,
            behaviour_anomaly=36.0, counterfactual_similarity=34.0,
            evidence_bullets=PACIFIC_TRADER_EVIDENCE, evidence_strength="Weak",
            counterfactual_spatial_overlap_pct=34.1,
            counterfactual_centroid_error_km=22.5,
            counterfactual_shape_similarity=31.2,
            counterfactual_temporal_consistency=48.0,
            counterfactual_overall_similarity=36.9,
            is_simulated=True,
        ),
    ]
    for c in candidates_0047:
        db.add(c)

    attr_0044 = AttributionResult(
        id="attr-0044",
        investigation_id="inv-0044",
        model_version="mock-attribution-v1.0",
    )
    db.add(attr_0044)
    db.flush()

    db.add(CandidateVesselMatch(
        attribution_result_id="attr-0044",
        vessel_id="v-desert-wind",
        rank=1, overall_score=91.2, confidence_level="High",
        temporal_compatibility=94.0, spatial_proximity=96.0,
        drift_consistency=89.0, trajectory_compatibility=92.0,
        behaviour_anomaly=84.0, counterfactual_similarity=94.0,
        evidence_bullets=[
            "Vessel was within the high-probability origin zone at the estimated spill time.",
            "Trajectory precisely matches backward drift vector (deviation < 1.8°).",
            "Vessel passed within 1.2 km of the origin centroid.",
            "AIS shows a 47-minute gap in position reports — likely AIS transponder switched off.",
            "Counterfactual simulation shows 89.4% spatial overlap.",
            "Vessel type (VLCC, 295,000 DWT) is consistent with spill volume estimate.",
        ],
        evidence_strength="Strong",
        counterfactual_spatial_overlap_pct=89.4,
        counterfactual_centroid_error_km=1.8,
        counterfactual_shape_similarity=91.2,
        counterfactual_temporal_consistency=96.0,
        counterfactual_overall_similarity=92.1,
        is_simulated=True,
    ))

    # ── Evidence ─────────────────────────────────────────────────────────────
    evidence_items = [
        EvidenceItem(
            investigation_id="inv-0047",
            evidence_type="SAR Imagery",
            title="Sentinel-1A SAR Scene — Arabian Sea",
            description="C-Band SAR image acquired at 12:18 UTC showing oil slick signature with high backscatter contrast. Slick outline clearly visible against ambient sea surface.",
            source="Sentinel-1A / ESA Copernicus",
            confidence=94.7, relevance=98.0, weight=2.0,
            evidence_timestamp=dt(6), is_simulated=True,
        ),
        EvidenceItem(
            investigation_id="inv-0047",
            evidence_type="AIS Trajectory",
            title="MT Ocean Star AIS Track (6-hour window)",
            description="AIS position data for IMO 9876543 showing trajectory across the probable origin zone. Includes anomalous speed reduction event.",
            source="Spire Maritime AIS Feed (Simulated)",
            confidence=89.2, relevance=94.0, weight=1.8,
            evidence_timestamp=dt(7), is_simulated=True,
        ),
        EvidenceItem(
            investigation_id="inv-0047",
            evidence_type="Drift Simulation",
            title="Backward Drift Reconstruction — INV-0047",
            description="Lagrangian backward particle simulation using CMEMS GLORYS12 currents and ERA5 wind fields. 500 particles, 8-hour window.",
            source="SpillTrace Drift Module (Mock Lagrangian v1.0)",
            confidence=78.0, relevance=92.0, weight=1.6,
            evidence_timestamp=dt(5), is_simulated=True,
        ),
        EvidenceItem(
            investigation_id="inv-0047",
            evidence_type="Ocean Current Data",
            title="CMEMS Surface Current Analysis",
            description="Surface current velocities from CMEMS GLORYS12 global reanalysis. Current speed: 0.45 m/s direction 310°.",
            source="Copernicus Marine Service",
            confidence=85.0, relevance=82.0, weight=1.2,
            evidence_timestamp=dt(8), is_simulated=True,
        ),
        EvidenceItem(
            investigation_id="inv-0047",
            evidence_type="Wind Data",
            title="ERA5 10m Wind Field",
            description="ECMWF ERA5 reanalysis wind data. Wind speed: 8.2 m/s, direction: 245°. Used for windage correction in drift model.",
            source="ECMWF ERA5 Reanalysis",
            confidence=88.0, relevance=80.0, weight=1.2,
            evidence_timestamp=dt(8), is_simulated=True,
        ),
        EvidenceItem(
            investigation_id="inv-0047",
            evidence_type="Vessel Behaviour",
            title="AIS Anomaly — Speed Reduction Event",
            description="MT Ocean Star reduced speed from 13.2 to 3.1 knots for 38 minutes during 12:10–12:48 UTC. No weather or traffic event recorded that would explain this behaviour.",
            source="SpillTrace Behavioural Analysis Module",
            confidence=71.0, relevance=88.0, weight=1.5,
            evidence_timestamp=dt(6.5), is_simulated=True,
        ),
        EvidenceItem(
            investigation_id="inv-0047",
            evidence_type="Counterfactual Simulation",
            title="Counterfactual Forward Simulation — MT Ocean Star",
            description="Forward drift simulation initiated from MT Ocean Star position at T-5h. Simulated slick produced 81.6% spatial overlap with observed slick.",
            source="SpillTrace Counterfactual Engine (Mock)",
            confidence=86.8, relevance=93.0, weight=1.9,
            evidence_timestamp=dt(4), is_simulated=True,
        ),
        EvidenceItem(
            investigation_id="inv-0047",
            evidence_type="Model Prediction",
            title="Spill Detection Model Output",
            description="U-Net-compatible segmentation model output (mock). Classified 18.6 km² as oil slick with 94.7% confidence. Look-alike rejection passed for biogenic slick, internal waves, rain cells, and low-wind zones.",
            source="SpillTrace Spill Detection Module (Mock CNN v1.0)",
            confidence=94.7, relevance=99.0, weight=2.0,
            evidence_timestamp=dt(6), is_simulated=True,
        ),
        # Evidence for INV-0044
        EvidenceItem(
            investigation_id="inv-0044",
            evidence_type="SAR Imagery",
            title="Sentinel-1B SAR Scene — Persian Gulf",
            description="SAR imagery over Persian Gulf tanker route. Oil slick clearly visible near 26.15°N 55.80°E.",
            source="Sentinel-1B / ESA Copernicus",
            confidence=88.2, relevance=97.0, weight=2.0,
            evidence_timestamp=dt(72), is_simulated=True,
        ),
        EvidenceItem(
            investigation_id="inv-0044",
            evidence_type="AIS Trajectory",
            title="MT Desert Wind AIS Track — 47-Minute AIS Gap",
            description="AIS gap detected for IMO 9567890 between 09:14–10:01 UTC. Vessel reappeared 2.3 km from the origin centroid. Gap consistent with deliberate AIS transponder deactivation.",
            source="Spire Maritime AIS Feed (Simulated)",
            confidence=91.2, relevance=97.0, weight=2.0,
            evidence_timestamp=dt(73), is_simulated=True,
        ),
    ]
    for ev in evidence_items:
        db.add(ev)

    # ── Reports ────────────────────────────────────────────────────────────
    report_0047 = ForensicReport(
        id="report-0047",
        investigation_id="inv-0047",
        title="SpillTrace AI Investigation Report — INV-2026-0047",
        report_type="Full Investigation Report",
        status="Draft",
        sections={
            "1. Incident Summary": (
                "On 14 September 2026 at 12:18 UTC, a Sentinel-1A SAR satellite pass over the Arabian Sea "
                "detected an oil slick of approximately 18.6 km² at coordinates 18.42°N, 67.21°E. "
                "The detection confidence is 94.7%. This investigation was initiated immediately under reference INV-2026-0047."
            ),
            "2. Spill Detection": (
                "Detection performed using SAR C-Band (IW Mode) imagery. Backscatter contrast: -10.4 dB. "
                "Look-alike rejection confidence: Biogenic 96.2%, Low-wind 92.8%, Internal waves 98.5%, Rain cells 95.1%. "
                "Estimated oil type: Heavy Crude Oil (API 28.5). Estimated volume: 620 m³."
            ),
            "3. Estimated Origin": (
                "Backward Lagrangian drift simulation using CMEMS GLORYS12 currents and ERA5 wind reanalysis "
                "places the probable spill origin at 18.48°N, 67.09°E. "
                "Origin probability: 78%. Estimated origin time window: 06:00–07:05 UTC. "
                "Origin uncertainty: ±7.4 km."
            ),
            "4. Environmental Conditions": (
                "Wind: 8.2 m/s from 245° (WSW). Surface current: 0.45 m/s toward 310° (NW). "
                "Sea state: moderate (Hs ~1.8m). Conditions are within acceptable range for reliable SAR detection."
            ),
            "5. AIS Correlation": (
                "Three vessels were identified passing through the high-probability origin zone during the estimated spill window. "
                "MT Ocean Star (IMO 9876543), MV Blue Horizon (IMO 9123456), MT Pacific Trader (IMO 9345678)."
            ),
            "6. Candidate Vessels": (
                "1. MT Ocean Star — Overall Score: 87.4/100 (HIGH). "
                "2. MV Blue Horizon — Overall Score: 64.2/100 (MEDIUM). "
                "3. MT Pacific Trader — Overall Score: 41.8/100 (LOW)."
            ),
            "7. Attribution Analysis": (
                "MT Ocean Star is the highest-ranked candidate. Key factors: vessel was in the high-probability origin zone; "
                "anomalous speed reduction detected; trajectory is spatially consistent with drift; "
                "counterfactual simulation shows 81.6% spatial overlap with observed slick."
            ),
            "8. Counterfactual Simulation": (
                "Forward drift simulation from MT Ocean Star position at T-5h: Spatial overlap 81.6%, "
                "Centroid error 4.2 km, Shape similarity 84.3%, Temporal consistency 91.0%. "
                "Overall similarity score: 86.8%."
            ),
            "9. Evidence Summary": (
                "8 evidence items collected. Types: SAR Imagery (1), AIS Trajectory (1), Drift Simulation (1), "
                "Ocean Currents (1), Wind Data (1), Vessel Behaviour (1), Counterfactual (1), Model Output (1)."
            ),
            "10. Confidence & Limitations": (
                "Overall investigation confidence: 87.4%. Data completeness: 91.2%. "
                "Limitations: drift model uses reanalysis data (not real-time); AIS coverage gaps possible; "
                "oil type identification based on SAR characteristics only. "
                "All assessments are probabilistic and should not be interpreted as definitive proof of responsibility."
            ),
        },
        overall_confidence=87.4,
        data_completeness=91.2,
        primary_attribution_score=87.4,
        generated_by="SpillTrace AI — Mock Report Engine v1.0",
        generated_at=dt(0),
        is_simulated=True,
    )
    db.add(report_0047)

    db.commit()
    print("SpillTrace AI local reference data seeded successfully.")
    print(f"   Investigations: {len(INVESTIGATIONS)}")
    print(f"   Vessels: {len(VESSELS)}")
    print(f"   Evidence items: {len(evidence_items)}")
    print(f"   Data sources: {len(data_sources_data)}")


def init_db() -> None:
    """Create all tables and seed local reference data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Only seed if DB is empty
        existing = db.query(Investigation).count()
        if existing == 0:
            seed_all(db)
        else:
            print(f"Database already contains {existing} investigations — skipping seed.")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
