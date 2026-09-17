import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { LoadingState, ErrorState, Panel } from '../../components/ui/Panel';
import { Badge, statusVariant } from '../../components/ui/Badge';
import { WorkflowSteps } from '../../components/investigation/WorkflowSteps';
import { MaritimeMap, buildDriftGeoJson } from '../../components/map/MaritimeMap';

export function InvestigationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: inv, isLoading } = useQuery({
    queryKey: ['investigation', id],
    queryFn: () => api.investigations.get(id!),
    enabled: !!id,
  });
  const { data: attribution } = useQuery({
    queryKey: ['attribution', id],
    queryFn: () => api.investigations.attribution(id!),
    enabled: !!id,
    retry: false,
  });
  const { data: drift } = useQuery({
    queryKey: ['drift', id],
    queryFn: () => api.investigations.drift(id!),
    enabled: !!id,
    retry: false,
  });
  const { data: spills } = useQuery({
    queryKey: ['spills', id],
    queryFn: () => api.investigations.spills(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingState message="Loading investigation..." />;
  if (!inv) return <ErrorState message="Investigation not found." />;

  const mapData = spills ? {
    spills: spills.map((s) => ({
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
    origins: drift ? [{ investigation_id: id!, lat: drift.origin_lat, lon: drift.origin_lon, probability: drift.origin_probability, uncertainty_km: drift.origin_uncertainty_km }] : [],
    center: [inv.center_lon, inv.center_lat] as [number, number],
  } : undefined;

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-accent text-sm">{inv.reference_code}</p>
          <h2 className="text-xl font-bold text-white mt-1">{inv.title}</h2>
          <div className="flex gap-2 mt-2">
            <Badge variant={statusVariant(inv.status)}>{inv.status}</Badge>
            <Badge variant={statusVariant(inv.priority)}>{inv.priority}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/drift-analysis?investigation=${id}`} className="px-3 py-1.5 text-xs bg-navy-700 border border-panel-border rounded hover:border-accent/40 text-text">Drift Analysis</Link>
          <Link to={`/reports?investigation=${id}`} className="px-3 py-1.5 text-xs bg-accent/10 border border-accent/30 rounded text-accent hover:bg-accent/20">Generate Report</Link>
        </div>
      </div>

      <Panel title="Investigation Workflow">
        <WorkflowSteps currentStage={inv.current_stage} />
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Incident Metadata" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            <MetaRow label="Detection Time" value={new Date(inv.detection_time).toUTCString()} mono />
            <MetaRow label="Coordinates" value={`${inv.center_lat.toFixed(2)}° N, ${inv.center_lon.toFixed(2)}° E`} mono />
            <MetaRow label="Estimated Area" value={`${inv.estimated_area_km2} km²`} mono />
            <MetaRow label="Spill Age" value={inv.estimated_spill_age_hours} />
            <MetaRow label="Satellite Source" value={inv.satellite_source} />
            <MetaRow label="Detection Confidence" value={`${inv.detection_confidence}%`} mono />
          </dl>
          {inv.summary && <p className="text-xs text-text-muted mt-4 leading-relaxed border-t border-panel-border pt-4">{inv.summary}</p>}
        </Panel>

        <Panel title="Situation Map" className="lg:col-span-2">
          {mapData && (
            <MaritimeMap
              mapData={mapData}
              center={[inv.center_lon, inv.center_lat]}
              zoom={7}
              height="320px"
              driftGeoJson={drift ? buildDriftGeoJson(drift) : undefined}
            />
          )}
        </Panel>
      </div>

      {attribution && (
        <Panel title="Potential Source Vessels">
          <p className="text-xs text-text-muted mb-4">
            Ranked by attribution likelihood based on currently available evidence. Not definitive proof of responsibility.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-muted uppercase border-b border-panel-border">
                  <th className="pb-2 pr-4">Rank</th>
                  <th className="pb-2 pr-4">Vessel</th>
                  <th className="pb-2 pr-4">IMO</th>
                  <th className="pb-2 pr-4">Attribution</th>
                  <th className="pb-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {attribution.candidates.map((c) => (
                  <tr key={c.id} className="border-b border-panel-border/50">
                    <td className="py-3 pr-4 font-mono">{c.rank}</td>
                    <td className="py-3 pr-4">
                      <Link to={`/vessels/${c.vessel_id}?investigation=${id}`} className="text-accent hover:underline">
                        {c.vessel_name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-mono text-text-muted">{c.vessel_imo}</td>
                    <td className="py-3 pr-4 font-mono">{c.overall_score}%</td>
                    <td className="py-3"><Badge variant={statusVariant(c.confidence_level)}>{c.confidence_level}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <p className="text-xs text-text-muted italic border border-panel-border rounded-sm p-3 bg-navy-800/30">
        {inv.disclaimer}
      </p>
    </div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-muted">{label}</dt>
      <dd className={mono ? 'font-mono text-text text-right' : 'text-text text-right'}>{value}</dd>
    </div>
  );
}
