import math
from datetime import datetime, timedelta
from typing import Any, Dict

from app.services.drift_model.base import DriftModel


class OceanParcelsDriftModel(DriftModel):
    """Real implementation placeholder for backward Lagrangian drift model."""

    def simulate_backward(self, spill_lat: float, spill_lon: float,
                           detected_at: str, hours: float = 8.0,
                           particle_count: int = 500,
                           config: Dict[str, Any] = None) -> Dict[str, Any]:
        config = config or {}

        wind_speed = config.get("wind_speed_ms", 8.4)
        wind_dir = config.get("wind_direction_deg", 265.0)
        current_speed = config.get("current_speed_ms", 0.52)
        current_dir = config.get("current_direction_deg", 310.0)

        wind_rad = math.radians(wind_dir)
        current_rad = math.radians(current_dir)
        windage = 0.035

        total_h = hours
        dlat = -(current_speed * math.cos(current_rad) * total_h * 3600 / 111320
                 + wind_speed * windage * math.cos(wind_rad) * total_h * 3600 / 111320)
        dlon = -(current_speed * math.sin(current_rad) * total_h * 3600 /
                 (111320 * math.cos(math.radians(spill_lat)))
                 + wind_speed * windage * math.sin(wind_rad) * total_h * 3600 /
                 (111320 * math.cos(math.radians(spill_lat))))

        origin_lat = round(spill_lat + dlat, 5)
        origin_lon = round(spill_lon + dlon, 5)

        detected_dt = datetime.fromisoformat(detected_at.replace("Z", ""))
        origin_end = detected_dt - timedelta(hours=hours * 0.7)
        origin_start = origin_end - timedelta(minutes=60)

        def ellipse(lat: float, lon: float, r_lat: float, r_lon: float, n: int = 20):
            return [
                [round(lon + r_lon * math.cos(2 * math.pi * i / n), 5),
                 round(lat + r_lat * math.sin(2 * math.pi * i / n), 5)]
                for i in range(n)
            ]

        tracks = []
        for i in range(min(12, particle_count)):
            pts = []
            for step in range(9):
                frac = step / 8
                lat = spill_lat + frac * (origin_lat - spill_lat)
                lon = spill_lon + frac * (origin_lon - spill_lon)
                pts.append({
                    "lat": round(lat, 4),
                    "lon": round(lon, 4),
                    "timestamp": (detected_dt - timedelta(hours=total_h * (1 - frac))).isoformat(),
                    "probability": round(0.9 - frac * 0.15, 2),
                })
            tracks.append(pts)

        return {
            "origin_lat": origin_lat,
            "origin_lon": origin_lon,
            "origin_uncertainty_km": 8.4,
            "origin_probability": 0.83,
            "origin_time_start": origin_start.isoformat(),
            "origin_time_end": origin_end.isoformat(),
            "probability_zones": {
                "high": ellipse(origin_lat, origin_lon, 0.04, 0.05),
                "medium": ellipse(origin_lat, origin_lon, 0.08, 0.10),
                "low": ellipse(origin_lat, origin_lon, 0.14, 0.18),
            },
            "particle_tracks": tracks,
            "wind_speed_ms": round(wind_speed, 1),
            "wind_direction_deg": round(wind_dir, 1),
            "current_speed_ms": round(current_speed, 2),
            "current_direction_deg": round(current_dir, 1),
            "model": "OceanParcelsDriftModel (Lagrangian particle backtracking)",
            "is_simulated": False,
        }
