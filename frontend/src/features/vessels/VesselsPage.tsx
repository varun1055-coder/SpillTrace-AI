import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { LoadingState, ErrorState, Panel } from '../../components/ui/Panel';
import { Badge, statusVariant } from '../../components/ui/Badge';
import clsx from 'clsx';

const TYPE_FILTERS = ['All', 'Tanker', 'Cargo', 'Bulk', 'Container'] as const;

export function VesselsPage() {
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>('All');
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => api.vessels.list(),
  });

  if (isLoading) return <LoadingState message="Loading vessel registry..." />;
  if (error) return <ErrorState message="Failed to load vessels. AIS feed may be unavailable." />;

  const vessels = (data?.items ?? []).filter((v) => {
    const matchesType =
      typeFilter === 'All' || v.vessel_type.toLowerCase().includes(typeFilter.toLowerCase());
    const q = search.toLowerCase();
    const matchesSearch =
      !q || v.name.toLowerCase().includes(q) || v.imo.includes(q) || v.mmsi.includes(q);
    return matchesType && matchesSearch;
  });

  return (
    <div className="p-6 space-y-4">
      <Panel
        title={`Vessel Registry (${vessels.length})`}
        action={
          <div className="flex items-center gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / IMO / MMSI"
              className="px-3 py-1.5 w-56 bg-navy-800 border border-panel-border rounded text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50"
            />
            <div className="flex border border-panel-border rounded-sm overflow-hidden">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={clsx(
                    'px-2.5 py-1 text-xs transition-colors',
                    typeFilter === t
                      ? 'bg-accent/15 text-accent'
                      : 'bg-navy-800 text-text-muted hover:text-text',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        }
      >
        <p className="text-xs text-text-muted mb-4">
          Live vessel registry view for operational AIS and route analysis.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-panel-border">
                <th className="pb-3 pr-4">Vessel</th>
                <th className="pb-3 pr-4">IMO / MMSI</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Flag</th>
                <th className="pb-3 pr-4">Position</th>
                <th className="pb-3 pr-4">SOG / COG</th>
                <th className="pb-3 pr-4">Destination</th>
                <th className="pb-3">Nav Status</th>
              </tr>
            </thead>
            <tbody>
              {vessels.map((v) => (
                <tr key={v.id} className="border-b border-panel-border/50 hover:bg-navy-800/30">
                  <td className="py-3 pr-4">
                    <Link to={`/vessels/${v.id}`} className="text-accent hover:underline font-medium">
                      {v.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-text-muted">
                    {v.imo}
                    <br />
                    {v.mmsi}
                  </td>
                  <td className="py-3 pr-4 text-text-muted">{v.vessel_type}</td>
                  <td className="py-3 pr-4 text-text-muted">{v.flag}</td>
                  <td className="py-3 pr-4 font-mono text-xs">
                    {v.current_lat.toFixed(2)}°N {v.current_lon.toFixed(2)}°E
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">
                    {v.current_sog_knots.toFixed(1)} kn / {v.current_cog_degrees.toFixed(0)}°
                  </td>
                  <td className="py-3 pr-4 text-text-muted text-xs">{v.destination ?? '—'}</td>
                  <td className="py-3">
                    <Badge variant={statusVariant(v.nav_status)}>{v.nav_status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vessels.length === 0 && (
            <p className="text-sm text-text-muted py-8 text-center">No vessels match the current filters.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
