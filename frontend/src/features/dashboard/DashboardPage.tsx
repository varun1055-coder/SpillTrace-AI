import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { KPICard, LoadingState, ErrorState, Panel } from '../../components/ui/Panel';
import { MaritimeMap } from '../../components/map/MaritimeMap';
import { Badge, statusVariant } from '../../components/ui/Badge';

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: api.dashboard });

  if (isLoading) return <LoadingState message="Loading command center..." />;
  if (error || !data) return <ErrorState message="Failed to load dashboard data. Ensure the backend is running on port 8000." />;

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">SpillTrace AI</h2>
        <p className="text-sm text-accent">From Oil Spill Detection to Intelligent Vessel Attribution</p>
        <p className="text-sm text-text-muted max-w-3xl mt-2">
          Detect marine oil pollution, reconstruct probable spill origins, correlate vessel movements,
          and investigate potential sources using satellite, environmental and AIS intelligence.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {data.kpis.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4" style={{ minHeight: '520px' }}>
        <div className="xl:col-span-2">
          <Panel title="Maritime Situation Overview" className="h-full">
            <MaritimeMap mapData={data.map_data} center={data.map_data.center} zoom={5} height="480px" />
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="Active Investigations">
            <ActiveInvestigations />
          </Panel>
          <Panel title="System Status">
            <div className="space-y-2 text-sm">
              <StatusRow label="System" value={data.system_status} ok />
              <StatusRow label="API" value={data.api_status} ok />
              <StatusRow label="Data Mode" value="Operational" />
              <p className="font-mono text-[10px] text-text-muted pt-+2">
                Last sync: {new Date(data.data_timestamp).toLocaleString()} UTC
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ActiveInvestigations() {
  const { data } = useQuery({ queryKey: ['investigations'], queryFn: () => api.investigations.list() });
  const active = data?.items.filter((i) => i.status.includes('Investigation') || i.status.includes('Pending')).slice(0, 4);

  return (
    <div className="space-y-2">
      {active?.map((inv) => (
        <Link
          key={inv.id}
          to={`/investigations/${inv.id}`}
          className="block p-3 bg-navy-800/50 border border-panel-border rounded-sm hover:border-accent/30 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono text-xs text-accent">{inv.reference_code}</p>
              <p className="text-sm text-text mt-0.5 line-clamp-1">{inv.title}</p>
            </div>
            <Badge variant={statusVariant(inv.priority)}>{inv.priority}</Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">{inv.region} · {inv.estimated_area_km2} km²</p>
        </Link>
      ))}
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-text-muted">{label}</span>
      <span className={ok ? 'text-emerald-400' : 'text-text'}>{value}</span>
    </div>
  );
}
