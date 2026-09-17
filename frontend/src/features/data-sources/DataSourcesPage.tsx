import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { LoadingState, ErrorState, Panel } from '../../components/ui/Panel';
import { Badge, statusVariant } from '../../components/ui/Badge';
import { Satellite, Radio, Waves, Wind, Database, CloudSun } from 'lucide-react';
import type { DataSource } from '../../types';

const CATEGORY_ICONS: Record<string, typeof Satellite> = {
  satellite: Satellite,
  ais: Radio,
  ocean_currents: Waves,
  currents: Waves,
  wind: Wind,
  weather: CloudSun,
};

function iconFor(source: DataSource) {
  const key = source.category.toLowerCase().replace(/[\s-]+/g, '_');
  return CATEGORY_ICONS[key] ?? Database;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diff / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function DataSourcesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['data-sources'],
    queryFn: api.dataSources,
    refetchInterval: 30_000,
  });

  if (isLoading) return <LoadingState message="Synchronizing data sources..." />;
  if (error) return <ErrorState message="Failed to load data source status." />;

  const online = data?.filter((s) => s.status.toLowerCase() === 'online').length ?? 0;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          <span className="font-mono text-emerald-400">{online}</span>
          <span className="font-mono text-text-muted"> / {data?.length ?? 0}</span> sources online
        </p>
        <p className="text-[10px] font-mono text-text-muted">Auto-refresh: 30s</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {data?.map((source) => {
          const Icon = iconFor(source);
          const isOnline = source.status.toLowerCase() === 'online';
          return (
            <Panel key={source.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-sm bg-navy-700 border border-panel-border flex items-center justify-center">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{source.name}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">
                      {source.category}
                    </p>
                  </div>
                </div>
                <Badge variant={statusVariant(source.status)}>{source.status}</Badge>
              </div>

              {source.description && (
                <p className="text-xs text-text-muted mb-3 leading-relaxed">{source.description}</p>
              )}

              <dl className="space-y-1.5 text-xs">
                <Row label="Provider" value={source.provider ?? '—'} />
                <Row label="Last update" value={timeAgo(source.last_update)} />
                <Row label="Interval" value={`${source.update_interval_minutes} min`} />
                <Row
                  label="Latency"
                  value={source.latency_seconds != null ? `${source.latency_seconds}s` : '—'}
                />
                <Row label="Coverage" value={source.coverage ?? '—'} />
                <Row label="Records" value={source.records_processed.toLocaleString()} mono />
              </dl>

              <div className="mt-3 pt-3 border-t border-panel-border flex items-center gap-1.5">
                <span
                  className={
                    isOnline
                      ? 'w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle'
                      : 'w-1.5 h-1.5 rounded-full bg-red-400'
                  }
                />
                <span className="text-[10px] font-mono text-text-muted">
                  {isOnline ? 'INGESTING' : 'OFFLINE'} · {source.is_mock ? 'adapter' : 'live adapter'}
                </span>
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel title="Integration Points">
        <p className="text-xs text-text-muted leading-relaxed max-w-3xl">
          Each source is accessed through an adapter interface in
          <code className="font-mono text-accent"> backend/app/data/adapters/</code>. Production adapters
          for Copernicus Sentinel-1, AIS streams, HYCOM/CMEMS currents, and ERA5 reanalysis can be registered
          without changing the API contract.
        </p>
      </Panel>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className={mono ? 'font-mono text-text text-right' : 'text-text text-right'}>{value}</dd>
    </div>
  );
}
