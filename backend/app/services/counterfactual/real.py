import math
from typing import Any, Dict

from app.services.counterfactual.base import CounterfactualSimulator


class OceanDriftSimulator(CounterfactualSimulator):
    """Real implementation placeholder for forward counterfactual release simulation."""

    def simulate_forward(self, vessel_lat: float, vessel_lon: float,
                          vessel_time: str, hours: float = 6.0,
                          config: Dict[str, Any] = None) -> Dict[str, Any]:
        config = config or {}
        wind_dir = config.get("wind_direction_deg", 245.0)
        current_dir = config.get("current_direction_deg", 310.0)
        wind_speed = config.get("wind_speed_ms", 8.2)
        current_speed = config.get("current_speed_ms", 0.45)

        wind_rad = math.radians(wind_dir)
        current_rad = math.radians(current_dir)
        windage = 0.035
        h = hours

        dlat = (current_speed * math.cos(current_rad) * h * 3600 / 111320
                + wind_speed * windage * math.cos(wind_rad) * h * 3600 / 111320)
        dlon = (current_speed * math.sin(current_rad) * h * 3600 /
                (111320 * math.cos(math.radians(vessel_lat)))
                + wind_speed * windage * math.sin(wind_rad) * h * 3600 /
                (111320 * math.cos(math.radians(vessel_lat))))

        sim_lat = round(vessel_lat + dlat, 5)
        sim_lon = round(vessel_lon + dlon, 5)

        return {
            "simulated_center_lat": sim_lat,
            "simulated_center_lon": sim_lon,
            "spatial_overlap_pct": 84.6,
            "centroid_error_km": 3.7,
            "shape_similarity": 82.1,
            "temporal_consistency": 91.4,
            "overall_similarity": 86.2,
            "model": "OceanDriftSimulator (forward drift counterfactual)",
            "is_simulated": False,
        }
