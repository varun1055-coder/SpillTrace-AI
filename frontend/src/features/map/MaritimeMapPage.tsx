import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { LoadingState, ErrorState, Panel } from '../../components/ui/Panel';
import { MaritimeMap } from '../../components/map/MaritimeMap';
import { Badge } from '../../components/ui/Badge';
import type { FeatureCollection, Feature } from 'geojson';
import clsx from 'clsx';

export function MaritimeMapPage() {
  const navigate = useNavigate();
  const [vesselFilter, setVesselFilter] = useState<'all' | 'candidates'>('all');
  const [spillFilter, setSpillFilter] = useState<'all' | 'active'>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard,
  });
  const { data: vesselsData } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => api.vessels.list(),
  });

  // Build vessel trajectory lines from the first few vessels' current positions
  // toward the investigation region (mock tracks until trajectory endpoint is wired).
  const trajectoryGeoJson = useMemo<FeatureCollection | undefined>(() => {
    if (!data || !vesselsData) return undefined;
    const features: Feature[] = [];
    const candidates = data.map_data.vessels.filter((v) => v.is_candidate);
    for (const v of candidates) {
      // Simple two-point track toward the nearest origin — placeholder geometry.
      const origin = data.map_data.origins[0];
      if (!origin) continue;
      features.push({
        type: 'Feature',
        properties: { vessel: v.name },
        geometry: {
          type: 'LineString',
          coordinates: [
            [v.lon - 0.8, v.lat - 0.5],
            [v.lon - 0.4, v.lat - 0.25],
            [v.lon, v.lat],
          ],
        },
      });
    }
    return { type: 'FeatureCollection', features };
  }, [data, vesselsData]);

  if (isLoading) return <LoadingState message="Loading maritime intelligence map..." />;
  if (error || !data) return <ErrorState message="Failed to load map data. AIS or satellite feeds may be unavailable." />;

  const mapData = {
    ...data.map_data,
    vessels:
      vesselFilter === 'candidates'
        ? data.map_data.vessels.filter((v) => v.is_candidate)
        : data.map_data.vessels,
    spills:
      spillFilter === 'active'
        ? data.map_data.spills.filter((s) => !s.status.toLowerCase().includes('closed'))
        : data.map_data.spills,
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-4 pb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FilterGroup
            label="Vessels"
            options={[['all', 'All'], ['candidates', 'Candidates']]}
            value={vesselFilter}
            onChange={(v) => setVesselFilter(v as typeof vesselFilter)}
          />
          <FilterGroup
            label="Spills"
            options={[['all', 'All'], ['active', 'Active']]}
            value={spillFilter}
            onChange={(v) => setSpillFilter(v as typeof spillFilter)}
          />
        </div>
      </div>

      <div className="flex-1 px-6 pb-4 grid grid-cols-1 xl:grid-cols-4 gap-4 min-h-0">
        <Panel className="xl:col-span-3 h-full flex flex-col" title="Maritime Intelligence Map">
          <div className="flex-1 min-h-[480px]">
            <MaritimeMap
              mapData={mapData}
              center={data.map_data.center}
              zoom={5.5}
              height="100%"
              showTimeline
              trajectoryGeoJson={trajectoryGeoJson}
              onVesselClick={(id) => navigate(`/vessels/${id}`)}
            />
          </div>
        </Panel>

        <div className="space-y-4 overflow-y-auto">
          <Panel title="Layer Legend">
            <ul className="space-y-2 text-xs">
              <LegendSwatch color="#f59e0b" label="Oil Spill Detection" />
              <LegendSwatch color="#22d3ee" label="Probable Origin" />
              <LegendSwatch color="#64748b" label="AIS Vessel" />
              <LegendSwatch color="#ef4444" label="Candidate Vessel" />
              <LegendSwatch color="#67e8f9" dashed label="Vessel Trajectory" />
              <LegendSwatch color="#0891b2" label="Drift Probability Zone" />
            </ul>
          </Panel>

          <Panel title={`Spill Events (${mapData.spills.length})`}>
            <div className="space-y-2">
              {mapData.spills.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => navigate(`/investigations/${s.investigation_id}`)}
                  className="w-full text-left p-2.5 bg-navy-800/40 border border-panel-border rounded-sm hover:border-accent/30 transition-colors"
                >
                  <p className="text-sm text-text truncate">{s.name}</p>
                  <p className="font-mono text-[10px] text-text-muted mt-0.5">
                    {s.area_km2} km² · {s.center_lat.toFixed(2)}°N {s.center_lon.toFixed(2)}°E
                  </p>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title={`Candidate Vessels (${data.map_data.vessels.filter((v) => v.is_candidate).length})`}>
            <div className="space-y-2">
              {data.map_data.vessels
                .filter((v) => v.is_candidate)
                .map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => navigate(`/vessels/${v.id}`)}
                    className="w-full text-left p-2.5 bg-navy-800/40 border border-panel-border rounded-sm hover:border-red-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-text truncate">{v.name}</p>
                      <Badge variant="critical">candidate</Badge>
                    </div>
                    <p className="font-mono text-[10px] text-text-muted mt-0.5">
                      {v.imo} · {v.sog_knots.toFixed(1)} kn · hdg {v.heading.toFixed(0)}°
                    </p>
                  </button>
                ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<[string, string]>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-text-muted">{label}:</span>
      <div className="flex border border-panel-border rounded-sm overflow-hidden">
        {options.map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={clsx(
              'px-2.5 py-1 transition-colors',
              value === v ? 'bg-accent/15 text-accent' : 'bg-navy-800 text-text-muted hover:text-text',
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function LegendSwatch({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className="w-4 h-2 rounded-sm flex-shrink-0"
        style={
          dashed
            ? { borderTop: `2px dashed ${color}` }
            : { background: color, opacity: 0.8 }
        }
      />
      <span className="text-text-muted">{label}</span>
    </li>
  );
}
