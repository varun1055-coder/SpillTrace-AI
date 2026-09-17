import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { LoadingState, Panel, ScoreBar } from '../../components/ui/Panel';
import { Badge, statusVariant } from '../../components/ui/Badge';
import { FileText, FileDown } from 'lucide-react';

const SECTION_ORDER = [
  'incident_summary',
  'spill_detection',
  'estimated_origin',
  'environmental_conditions',
  'ais_correlation',
  'candidate_vessels',
  'attribution_analysis',
  'counterfactual_simulation',
  'evidence',
  'confidence_limitations',
] as const;

const SECTION_TITLES: Record<string, string> = {
  incident_summary: '1. Incident Summary',
  spill_detection: '2. Spill Detection',
  estimated_origin: '3. Estimated Origin',
  environmental_conditions: '4. Environmental Conditions',
  ais_correlation: '5. AIS Correlation',
  candidate_vessels: '6. Candidate Vessels',
  attribution_analysis: '7. Attribution Analysis',
  counterfactual_simulation: '8. Counterfactual Simulation',
  evidence: '9. Evidence',
  confidence_limitations: '10. Confidence & Limitations',
};

export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const investigationId = searchParams.get('investigation');
  const [generating, setGenerating] = useState(false);

  const { data: investigations } = useQuery({
    queryKey: ['investigations'],
    queryFn: () => api.investigations.list(),
  });

  const selectedInvId = investigationId ?? investigations?.items?.[0]?.id;

  const { data: report, error } = useQuery({
    queryKey: ['report', selectedInvId],
    queryFn: () => api.investigations.report(selectedInvId!),
    enabled: !!selectedInvId,
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: (id: string) => api.reports.generate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', selectedInvId] });
      setGenerating(false);
    },
    onError: () => setGenerating(false),
  });

  if (!investigations) return <LoadingState message="Loading reports..." />;

  const generate = () => {
    if (!selectedInvId) return;
    setGenerating(true);
    setTimeout(() => generateMutation.mutate(selectedInvId), 2000);
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
          onClick={generate}
          disabled={generating || !selectedInvId}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent/10 border border-accent/30 rounded text-accent hover:bg-accent/20 disabled:opacity-50"
        >
          {generating ? (
            <>
              <FileText className="w-3.5 h-3.5 animate-pulse-subtle" />
              Compiling report...
            </>
          ) : (
            <>
              <FileDown className="w-3.5 h-3.5" />
              Generate Investigation Report
            </>
          )}
        </button>
      </div>

      {report ? (
        <Panel
          title={report.title}
          action={
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant(report.status)}>{report.status}</Badge>
              <Badge variant="default">{report.report_type}</Badge>
            </div>
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat label="Overall confidence" value={`${report.overall_confidence.toFixed(1)}%`} />
            <Stat label="Data completeness" value={`${report.data_completeness.toFixed(1)}%`} />
            <Stat
              label="Primary attribution"
              value={report.primary_attribution_score != null ? `${report.primary_attribution_score.toFixed(1)}%` : '—'}
            />
            <Stat label="Generated" value={new Date(report.generated_at).toUTCString().slice(5, 22)} small />
          </div>

          <ScoreBar label="Overall confidence" value={report.overall_confidence} />

          <div className="mt-6 space-y-5">
            {SECTION_ORDER.map((key) => {
              const content = report.sections?.[key];
              if (!content) return null;
              return (
                <section key={key} className="border-t border-panel-border pt-4">
                  <h4 className="text-sm font-semibold text-accent mb-2">{SECTION_TITLES[key]}</h4>
                  <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">{content}</p>
                </section>
              );
            })}
          </div>

          <p className="text-xs text-text-muted italic border border-panel-border rounded-sm p-3 bg-navy-800/30 mt-6">
            {report.disclaimer}
          </p>
        </Panel>
      ) : (
        <Panel title="SpillTrace AI Investigation Report">
          {error ? (
            <div className="text-center py-10 space-y-3">
              <FileText className="w-8 h-8 text-text-muted mx-auto" />
              <p className="text-sm text-text-muted">
                No report has been generated for this investigation yet.
              </p>
              <p className="text-xs text-text-muted">
                Click "Generate Investigation Report" to compile detection, drift, AIS correlation
                and attribution findings into a structured forensic report.
              </p>
            </div>
          ) : (
            <LoadingState message="Loading report..." />
          )}
        </Panel>
      )}
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="p-2.5 bg-navy-800/50 border border-panel-border rounded-sm">
      <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
      <p className={small ? 'font-mono text-xs text-white mt-0.5' : 'font-mono text-sm text-white mt-0.5'}>
        {value}
      </p>
    </div>
  );
}
