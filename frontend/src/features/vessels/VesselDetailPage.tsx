import { useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { LoadingState, ErrorState, Panel } from '../../components/ui/Panel';
import { Badge, statusVariant } from '../../components/ui/Badge';
import { AttributionBreakdown } from '../../components/investigation/AttributionBreakdown';
import { ExplainabilityPanel } from '../../components/investigation/ExplainabilityPanel';
import { CounterfactualPanel } from '../../components/investigation/CounterfactualPanel';
import { EvidenceList } from '../../components/investigation/EvidenceList';
import { MaritimeMap } from '../../components/map/MaritimeMap';
import type { FeatureCollection } from 'geojson';

export function VesselDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const investigationId = searchParams.get('investigation');

  const { data: vessel, isLoading, error } = useQuery({
    queryKey: ['vessel-trajectory', id],
    queryFn: () => api.vessels.trajectory(id!),
    enabled: !!id,
  });

  const { data: attribution } = useQuery({
    queryKey: ['attribution', investigationId],
    queryFn: () => api.investigations.attribution(investigationId!),
    enabled: !!investigationId,
    retry: false,
  });

  const { data: evidence } = useQuery({
    queryKey: ['evidence', investigationId],
    queryFn: () => api.investigations.evidence(investigationId!),
    enabled: !!investigationId,
    retry: false,
  });

  const candidate = useMemo(
    () => attribution?.candidates.find((c) => c.vessel_id === id),
    [attribution, id],
  );

  const trajectoryGeoJson = useMemo<FeatureCollection | undefined>(() => {
    if (!vessel?.trajectories?.length) return undefined;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { vessel: vessel.name },
          geometry: {
            type: 'LineString',
            coordinates: vessel.trajectories.map((t) => [t.longitude, t.latitude]),
          },
        },
      ],
    };
  }, [vessel]);

  if (isLoading) return <LoadingState message="Correlating AIS trajectories..." />;
  if (error || !vessel) return <ErrorState message="Vessel not found or AIS feed unavailable." />;

  const mapData = {
    spills: [],
    vessels: [
      {
        id: vessel.id,
        name: vessel.name,
        imo: vessel.imo,
        vessel_type: vessel.vessel_type,
        lat: vessel.current_lat,
        lon: vessel.current_lon,
        heading: vessel.current_heading,
        sog_knots: vessel.current_sog_knots,
        is_candidate: !!candidate,
      },
    ],
    origins: [],
    center: [vessel.current_lon, vessel.current_lat] as [number, number],
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">{vessel.name}</h2>
          <p className="font-mono text-sm text-text-muted mt-1">
            {vessel.imo} · MMSI {vessel.mmsi}
            {vessel.call_sign ? ` · ${vessel.call_sign}` : ''}
          </p>
          <div className="flex gap-2 mt-2">
            <Badge variant="default">{vessel.vessel_type}</Badge>
            <Badge variant="default">{vessel.flag}</Badge>
            {candidate && (
              <Badge variant={statusVariant(candidate.confidence_level)}>
                Rank #{candidate.rank} candidate
              </Badge>
            )}
          </div>
        </div>
        {investigationId && (
          <Link
            to={`/investigations/${investigationId}`}
            className="px-3 py-1.5 text-xs bg-navy-700 border border-panel-border rounded hover:border-accent/40 text-text"
          >
            ← Back to Investigation
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Vessel Profile">
          <dl className="space-y-3 text-sm">
            <Row label="Vessel Type" value={vessel.vessel_type} />
            <Row label="Flag" value={vessel.flag} />
            <Row label="Length × Beam" value={`${vessel.length_m} m × ${vessel.beam_m} m`} mono />
            <Row label="Draught" value={`${vessel.draught_m} m`} mono />
            <Row label="DWT" value={`${vessel.deadweight_tonnage.toLocaleString()} t`} mono />
            <Row
              label="Position"
              value={`${vessel.current_lat.toFixed(3)}°N ${vessel.current_lon.toFixed(3)}°E`}
              mono
            />
            <Row label="Speed (SOG)" value={`${vessel.current_sog_knots.toFixed(1)} kn`} mono />
            <Row label="Course (COG)" value={`${vessel.current_cog_degrees.toFixed(0)}°`} mono />
            <Row label="Heading" value={`${vessel.current_heading.toFixed(0)}°`} mono />
            <Row label="Destination" value={vessel.destination ?? '—'} />
            <Row label="Nav Status" value={vessel.nav_status} />
            <Row label="Last AIS" value={new Date(vessel.last_ais_time).toUTCString()} mono />
          </dl>
        </Panel>

        <Panel title="AIS Trajectory" className="lg:col-span-2">
          <MaritimeMap
            mapData={mapData}
            center={[vessel.current_lon, vessel.current_lat]}
            zoom={6}
            height="320px"
            showLayerControl={false}
            trajectoryGeoJson={trajectoryGeoJson}
          />
          <p className="text-[10px] font-mono text-text-muted mt-2">
            {vessel.trajectories?.length ?? 0} AIS positions · simulated track
          </p>
        </Panel>
      </div>

      {candidate ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Attribution Score">
              <AttributionBreakdown candidate={candidate} />
            </Panel>
            <Panel title="Explainability">
              <ExplainabilityPanel candidate={candidate} />
            </Panel>
          </div>

          <CounterfactualPanel candidate={candidate} />

          <p className="text-xs text-text-muted italic border border-panel-border rounded-sm p-3 bg-navy-800/30">
            This vessel is the {candidate.rank === 1 ? 'highest-ranked' : `#${candidate.rank}`} candidate
            based on currently available evidence. SpillTrace AI provides probabilistic analytical
            assessments and should not be interpreted as definitive proof of responsibility.
          </p>
        </>
      ) : (
        <Panel title="Attribution">
          <p className="text-sm text-text-muted">
            {investigationId
              ? 'This vessel is not ranked as a candidate in the selected investigation, or attribution has not been run yet.'
              : 'Open this vessel from an investigation to view its attribution analysis.'}
          </p>
        </Panel>
      )}

      {evidence && evidence.items.length > 0 && (
        <Panel title={`Associated Evidence (${evidence.items.length})`}>
          <EvidenceList items={evidence.items} />
        </Panel>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-muted">{label}</dt>
      <dd className={mono ? 'font-mono text-text text-right text-xs' : 'text-text text-right'}>{value}</dd>
    </div>
  );
}
