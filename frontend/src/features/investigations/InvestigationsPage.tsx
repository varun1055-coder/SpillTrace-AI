import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { LoadingState, ErrorState, Panel } from '../../components/ui/Panel';
import { Badge, statusVariant } from '../../components/ui/Badge';

export function InvestigationsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['investigations'], queryFn: () => api.investigations.list() });

  if (isLoading) return <LoadingState message="Loading investigations..." />;
  if (error) return <ErrorState message="Failed to load investigations." />;

  return (
    <div className="p-6 space-y-4">
      <Panel title={`Investigations (${data?.total ?? 0})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-panel-border">
                <th className="pb-3 pr-4">Reference</th>
                <th className="pb-3 pr-4">Title</th>
                <th className="pb-3 pr-4">Region</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Priority</th>
                <th className="pb-3 pr-4">Area</th>
                <th className="pb-3">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((inv) => (
                <tr key={inv.id} className="border-b border-panel-border/50 hover:bg-navy-800/30">
                  <td className="py-3 pr-4">
                    <Link to={`/investigations/${inv.id}`} className="font-mono text-accent hover:underline">
                      {inv.reference_code}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-text max-w-xs truncate">{inv.title}</td>
                  <td className="py-3 pr-4 text-text-muted">{inv.region}</td>
                  <td className="py-3 pr-4"><Badge variant={statusVariant(inv.status)}>{inv.status}</Badge></td>
                  <td className="py-3 pr-4"><Badge variant={statusVariant(inv.priority)}>{inv.priority}</Badge></td>
                  <td className="py-3 pr-4 font-mono">{inv.estimated_area_km2} km²</td>
                  <td className="py-3 font-mono">{inv.detection_confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
