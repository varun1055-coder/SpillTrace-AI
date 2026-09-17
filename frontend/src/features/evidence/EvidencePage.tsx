import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { LoadingState, ErrorState, Panel } from '../../components/ui/Panel';
import { EvidenceList } from '../../components/investigation/EvidenceList';
import clsx from 'clsx';

const TYPE_FILTERS = [
  ['all', 'All'],
  ['sar_imagery', 'SAR Imagery'],
  ['ais_trajectory', 'AIS Trajectory'],
  ['wind_data', 'Wind'],
  ['ocean_current', 'Currents'],
  ['drift_simulation', 'Drift Sim'],
  ['vessel_behaviour', 'Behaviour'],
  ['counterfactual', 'Counterfactual'],
  ['model_prediction', 'Model Output'],
] as const;

export function EvidencePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const investigationId = searchParams.get('investigation') ?? undefined;
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: investigations } = useQuery({
    queryKey: ['investigations'],
    queryFn: () => api.investigations.list(),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['evidence', investigationId ?? 'all'],
    queryFn: () => api.evidence.list(investigationId),
  });

  if (isLoading) return <LoadingState message="Loading evidence chain..." />;
  if (error) return <ErrorState message="Failed to load evidence records." />;

  const items = (data?.items ?? []).filter(
    (e) => typeFilter === 'all' || e.evidence_type === typeFilter,
  );

  return (
    <div className="p-6 space-y-4">
      <Panel
        title={`Evidence Chain (${items.length})`}
        action={
          <select
            value={investigationId ?? ''}
            onChange={(e) =>
              setSearchParams(e.target.value ? { investigation: e.target.value } : {})
            }
            className="bg-navy-800 border border-panel-border rounded text-xs text-text px-3 py-1.5 focus:outline-none focus:border-accent/50"
          >
            <option value="">All investigations</option>
            {investigations?.items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.reference_code}
              </option>
            ))}
          </select>
        }
      >
        <div className="flex flex-wrap gap-1.5 mb-4">
          {TYPE_FILTERS.map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setTypeFilter(v)}
              className={clsx(
                'px-2.5 py-1 text-xs rounded-sm border transition-colors',
                typeFilter === v
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-panel-border bg-navy-800 text-text-muted hover:text-text',
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <EvidenceList items={items} />
        {items.length === 0 && (
          <p className="text-sm text-text-muted py-6 text-center">
            No evidence items match the current filter.
          </p>
        )}
      </Panel>
    </div>
  );
}
