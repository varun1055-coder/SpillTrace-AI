import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { LoadingState, Panel, ScoreBar } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { MaritimeMap, buildDriftGeoJson } from '../../components/map/MaritimeMap';
import { Wind, Waves, Play } from 'lucide-react';

export function DriftAnalysisPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const investigationId = searchParams.get('investigation');
  const [timeStep, setTimeStep] = useState(100); // percent of backward window
  const [simulating, setSimulating] = useState(false);

  const { data: investigations } = useQuery({
    queryKey: ['investigations'],
    queryFn: () => api.investigations.list(),
  });

  const selectedInvId = investigationId ?? investigations?.items?.[0]?.id;

  const { data: inv } = useQuery({
    queryKey: ['investigation', selectedInvId],
    queryFn: () => api.investigations.get(selectedInvId!),
    enabled: !!selectedInvId,
  });
  const { data: spills } = useQuery({
    queryKey: ['spills', selectedInvId],
    queryFn: () => api.investigations.spills(selectedInvId!),
    enabled: !!selectedInvId,
  });
  const { data: drift, error } = useQuery({
    queryKey: ['drift', selectedInvId],
    queryFn: () => api.investigations.drift(selectedInvId!),
    enabled: !!selectedInvId,
    retry: false,
  });

  const simulateMutation = useMutation({
    mutationFn: (id: string) => api.drift.simulate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drift', selectedInvId] });
      setSimulating(false);
    },
    onError: () => setSimulating(false),
  });

  const driftGeoJson = useMemo(() => (drift ? buildDriftGeoJson(drift) : undefined), [drift]);

  const mapData = useMemo(() => {
    if (!inv) return undefined;
    return {
      spills: (spills ?? []).map((s) => ({
        id: s.id,
        investigation_id: s.investigation_id,
        name: s.name,
        center_lat: s.center_lat,
        center_lon: s.center_lon,
        polygon_coordinates: s.polygon_coordinates,
        area_km2: s.area_km2,
        status: inv.status,
      })),
      vessels: [],
      origins: drift
        ? [
            {
              investigation_id: inv.id,
              lat: drift.origin_lat,
              lon: drift.origin_lon,
              probability: drift.origin_probability,
              uncertainty_km: drift.origin_uncertainty_km,
            },
          ]
        : [],
      center: [inv.center_lon, inv.center_lat] as [number, number],
    };
  }, [inv, spills, drift]);

  if (!investigations) return <LoadingState message="Loading drift analysis..." />;

  const runSimulation = () => {
    if (!selectedInvId) return;
    setSimulating(true);
    setTimeout(() => simulateMutation.mutate(selectedInvId), 2200);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs text-text-muted">Investigation:</label>
          <select
            value={selectedInvId ?? ''}
            onChange={(e) => setSearchParams({ investigation: e.target.value })}
            className="bg-navy-800 border border-panel-border rounded text-sm text-text px-3 py-1.5 focus:outline-none focus:border-accent/50"
          >
            {investigations.items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.reference_code} — {i.region}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={runSimulation}
          disabled={simulating || !selectedInvId}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent/10 border border-accent/30 rounded text-accent hover:bg-accent/20 disabled:opacity-50"
        >
          {simulating ? (
            <>
              <Waves className="w-3.5 h-3.5 animate-pulse-subtle" />
              Running drift reconstruction...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Run Drift Reconstruction
            </>
          )}
        </button>
      </div>

      {error && !drift && !simulating && (
        <div className="border border-amber-500/30 bg-amber-500/10 rounded-sm p-4 text-sm text-amber-300">
          No drift reconstruction exists for this investigation yet. Run a simulation to generate
          backward particle trajectories and a probable origin field.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Backward Drift Reconstruction" className="xl:col-span-2">
          <div className="relative">
            {simulating && (
              <div className="absolute inset-0 z-20 bg-navy-950/70 flex flex-col items-center justify-center gap-3 rounded-sm">
                <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-accent font-mono">Running drift reconstruction...</p>
                <p className="text-xs text-text-muted">Advecting particles backward through current + wind fields</p>
              </div>
            )}
            {mapData && (
              <MaritimeMap
                mapData={mapData}
                center={mapData.center}
                zoom={7}
                height="440px"
                driftGeoJson={driftGeoJson}
              />
            )}
          </div>

          {/* Time slider */}
          <div className="mt-4 px-1">
            <div className="flex justify-between text-[10px] font-mono text-text-muted mb-1">
              <span>T-{drift?.total_hours ?? 12}h (origin window)</span>
              <span>Detection time</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={timeStep}
              onChange={(e) => setTimeStep(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <p className="text-[10px] font-mono text-text-muted mt-1 text-center">
              Showing reconstruction at {timeStep}% of backward window — particle positions are
              illustrative until OceanParcels integration.
            </p>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Estimated Origin">
            {drift ? (
              <div className="space-y-4">
                <div className="text-center py-3 border border-panel-border rounded-sm bg-navy-800/30">
                  <p className="font-mono text-3xl font-bold text-accent">
                    {drift.origin_probability.toFixed(0)}%
                  </p>
                  <p className="text-xs text-text-muted mt-1">origin probability</p>
                </div>
                <dl className="space-y-2.5 text-sm">
                  <Row
                    label="Origin position"
                    value={`${drift.origin_lat.toFixed(3)}°N ${drift.origin_lon.toFixed(3)}°E`}
                  />
                  <Row label="Uncertainty" value={`± ${drift.origin_uncertainty_km} km`} />
                  <Row
                    label="Time window"
                    value={
                      drift.origin_time_start && drift.origin_time_end
                        ? `${new Date(drift.origin_time_start).toUTCString().slice(17, 22)}–${new Date(drift.origin_time_end).toUTCString().slice(17, 22)} UTC`
                        : '—'
                    }
                  />
                  <Row label="Particles" value={drift.particle_count.toLocaleString()} />
                  <Row label="Model" value={drift.model_version} />
                </dl>
                <ScoreBar label="Origin probability" value={drift.origin_probability} />
              </div>
            ) : (
              <p className="text-sm text-text-muted">No simulation results yet.</p>
            )}
          </Panel>

          <Panel title="Environmental Conditions">
            {drift ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-2.5 bg-navy-800/50 border border-panel-border rounded-sm">
                  <Wind className="w-4 h-4 text-accent flex-shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted">Wind ({drift.wind_dataset})</p>
                    <p className="font-mono text-text">
                      {drift.wind_speed_ms.toFixed(1)} m/s from {drift.wind_direction_deg.toFixed(0)}°
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-navy-800/50 border border-panel-border rounded-sm">
                  <Waves className="w-4 h-4 text-accent flex-shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted">Surface current ({drift.current_dataset})</p>
                    <p className="font-mono text-text">
                      {drift.current_speed_ms.toFixed(2)} m/s toward {drift.current_direction_deg.toFixed(0)}°
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted">Environmental fields load with a simulation.</p>
            )}
          </Panel>

          <Panel title="Probability Zones">
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-cyan-400/60" />
                <span className="text-text-muted">High-probability origin zone</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-cyan-700/50" />
                <span className="text-text-muted">Medium probability</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-cyan-900/60" />
                <span className="text-text-muted">Low probability / uncertainty boundary</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 border-t-2 border-dashed border-cyan-300" />
                <span className="text-text-muted">Backward particle tracks</span>
              </li>
            </ul>
            <div className="mt-3 pt-3 border-t border-panel-border">
              <Badge variant="medium">OceanParcels-ready interface</Badge>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-muted">{label}</dt>
      <dd className="font-mono text-text text-right text-xs">{value}</dd>
    </div>
  );
}
