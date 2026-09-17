export interface Investigation {
  id: string;
  reference_code: string;
  title: string;
  status: string;
  priority: string;
  region: string;
  detection_time: string;
  estimated_area_km2: number;
  detection_confidence: number;
  estimated_spill_age_hours: string;
  satellite_source: string;
  center_lat: number;
  center_lon: number;
  current_stage: number;
  summary?: string;
  disclaimer?: string;
  created_at: string;
  updated_at: string;
}

export interface SpillDetection {
  id: string;
  spill_id: string;
  satellite_name: string;
  sensor_type: string;
  acquisition_time: string;
  confidence: number;
  mean_backscatter_db: number;
  ambient_backscatter_db: number;
  contrast_db: number;
  incidence_angle_deg: number;
  polarization: string;
  biogenic_slick_rejection: number;
  low_wind_calm_rejection: number;
  internal_wave_rejection: number;
  rain_cell_rejection: number;
  sar_preview_url?: string;
  mask_geometry?: unknown;
}

export interface SpillEvent {
  id: string;
  investigation_id: string;
  name: string;
  detected_at: string;
  center_lat: number;
  center_lon: number;
  polygon_coordinates: number[][];
  area_km2: number;
  estimated_volume_m3: number;
  oil_type: string;
  estimated_age_min_hours: number;
  estimated_age_max_hours: number;
  detections: SpillDetection[];
}

export interface Vessel {
  id: string;
  name: string;
  imo: string;
  mmsi: string;
  call_sign?: string;
  flag: string;
  vessel_type: string;
  length_m: number;
  beam_m: number;
  draught_m: number;
  deadweight_tonnage: number;
  destination?: string;
  current_lat: number;
  current_lon: number;
  current_sog_knots: number;
  current_cog_degrees: number;
  current_heading: number;
  nav_status: string;
  last_ais_time: string;
  is_simulated: boolean;
}

export interface TrajectoryPoint {
  id: string;
  vessel_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  sog_knots: number;
  cog_degrees: number;
  heading_degrees?: number;
  nav_status: string;
  is_interpolated: boolean;
}

export interface DriftSimulation {
  id: string;
  investigation_id: string;
  simulation_type: string;
  model_version: string;
  particle_count: number;
  time_step_hours: number;
  total_hours: number;
  origin_lat: number;
  origin_lon: number;
  origin_uncertainty_km: number;
  origin_probability: number;
  origin_time_start?: string;
  origin_time_end?: string;
  probability_zones?: {
    high: number[][];
    medium: number[][];
    low: number[][];
  };
  particle_tracks?: Array<Array<{ lat: number; lon: number; timestamp: string; probability: number }>>;
  current_dataset: string;
  wind_dataset: string;
  wind_speed_ms: number;
  wind_direction_deg: number;
  current_speed_ms: number;
  current_direction_deg: number;
  is_simulated: boolean;
  created_at: string;
}

export interface CandidateVesselMatch {
  id: string;
  vessel_id: string;
  rank: number;
  overall_score: number;
  confidence_level: string;
  temporal_compatibility: number;
  spatial_proximity: number;
  drift_consistency: number;
  trajectory_compatibility: number;
  behaviour_anomaly: number;
  counterfactual_similarity: number;
  evidence_bullets: string[];
  evidence_strength: string;
  counterfactual_spatial_overlap_pct?: number;
  counterfactual_centroid_error_km?: number;
  counterfactual_shape_similarity?: number;
  counterfactual_temporal_consistency?: number;
  counterfactual_overall_similarity?: number;
  is_simulated: boolean;
  vessel_name?: string;
  vessel_imo?: string;
  vessel_type?: string;
  vessel_flag?: string;
}

export interface AttributionResult {
  id: string;
  investigation_id: string;
  model_version: string;
  created_at: string;
  candidates: CandidateVesselMatch[];
}

export interface EvidenceItem {
  id: string;
  investigation_id: string;
  evidence_type: string;
  title: string;
  description?: string;
  source: string;
  confidence: number;
  relevance: number;
  weight: number;
  evidence_timestamp?: string;
  ingested_at: string;
  is_simulated: boolean;
}

export interface ForensicReport {
  id: string;
  investigation_id: string;
  title: string;
  report_type: string;
  status: string;
  sections?: Record<string, string>;
  overall_confidence: number;
  data_completeness: number;
  primary_attribution_score?: number;
  generated_by: string;
  generated_at: string;
  disclaimer: string;
  is_simulated: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  category: string;
  provider?: string;
  description?: string;
  status: string;
  last_update: string;
  update_interval_minutes: number;
  latency_seconds?: number;
  coverage?: string;
  records_processed: number;
  is_mock: boolean;
}

export interface DashboardKPI {
  label: string;
  value: string;
  trend?: string;
  status: string;
}

export interface DashboardMapData {
  spills: Array<{
    id: string;
    investigation_id: string;
    name: string;
    center_lat: number;
    center_lon: number;
    polygon_coordinates: number[][];
    area_km2: number;
    status: string;
  }>;
  vessels: Array<{
    id: string;
    name: string;
    imo: string;
    vessel_type: string;
    lat: number;
    lon: number;
    heading: number;
    sog_knots: number;
    is_candidate: boolean;
  }>;
  origins: Array<{
    investigation_id: string;
    lat: number;
    lon: number;
    probability: number;
    uncertainty_km: number;
  }>;
  center: [number, number];
}

export interface Dashboard {
  kpis: DashboardKPI[];
  map_data: DashboardMapData;
  system_status: string;
  api_status: string;
  data_timestamp: string;
  is_seed_data: boolean;
}

export const WORKFLOW_STAGES = [
  'Detection',
  'Spill Characterization',
  'Drift Reconstruction',
  'Origin Estimation',
  'AIS Correlation',
  'Vessel Analysis',
  'Attribution',
  'Evidence Review',
] as const;
