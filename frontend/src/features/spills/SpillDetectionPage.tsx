import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { LoadingState, ErrorState, Panel, ScoreBar } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { SarPreview } from '../../components/investigation/SarPreview';
import type { SpillEvent } from '../../types';
import clsx from 'clsx';
import { Radar, Play } from 'lucide-react';

const TABS = ['Detection', 'Segmentation', 'Satellite Metadata', 'Look-alikes', 'Raw Data'] as const;

export function SpillDetectionPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Detection');
  const [analysing, setAnalysing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['spills'],
    queryFn: () => api.spills.list(),
  });
  const { data: investigations } = useQuery({
    queryKey: ['investigations'],
    queryFn: () => api.investigations.list(),
  });

  const detectMutation = useMutation({
    mutationFn: (investigationId: string) => api.spills.detect(investigationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spills'] });
      setAnalysing(false);
    },
    onError: () => setAnalysing(false),
  });

  if (isLoading) return <LoadingState message="Analysing SAR imagery..." />;
  if (error) return <ErrorState message="Failed to load spill detections. Satellite data may be unavailable." />;

  const spills = data?.items ?? [];
  const selected: SpillEvent | undefined =
    spills.find((s) => s.id === selectedId) ?? spills[0];
  const detection = selected?.detections?.[0];

  const runDetection = () => {
    const inv = investigations?.items?.[0];
    if (!inv) return;
    setAnalysing(true);
    // Simulated inference latency for UX parity with a real model.
    setTimeout(() => detectMutation.mutate(inv.id), 1600);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Left: SAR preview */}
        <Panel
          title="SAR Scene — Sentinel-1 IW (Simulated)"
          className="xl:col-span-3"
          action={
            <button
              type="button"
              onClick={runDetection}
              disabled={analysing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent/10 border border-accent/30 rounded text-accent hover:bg-accent/20 disabled:opacity-50"
            >
              {analysing ? (
                <>
                  <Radar className="w-3.5 h-3.5 animate-pulse-subtle" />
                  Analysing SAR imagery...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Run Detection
                </>
              )}
            </button>
          }
        >
          <div className="aspect-[640/460] bg-navy-950 border border-panel-border rounded-sm overflow-hidden relative">
            {analysing && (
              <div className="absolute inset-0 z-10 bg-navy-950/70 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-accent font-mono">Analysing SAR imagery...</p>
                <p className="text-xs text-text-muted">Running segmentation model (mock)</p>
              </div>
            )}
            <SarPreview showMask={tab !== 'Detection' || true} showBoundingBox />
          </div>
          <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-text-muted">
            <span>Sensor: SAR-C · Polarization: VV · Mode: IW</span>
            <span>Mock detector — replaceable via SpillDetector interface</span>
          </div>
        </Panel>

        {/* Right: results */}
        <div className="xl:col-span-2 space-y-4">
          <Panel title="Detection Results">
            {selected && detection ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">Oil Spill Detected</p>
                    <p className="text-xs text-text-muted">{selected.name}</p>
                  </div>
                  <Badge variant="high">{(detection.confidence * (detection.confidence <= 1 ? 100 : 1)).toFixed(1)}%</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Metric label="Estimated Area" value={`${selected.area_km2} km²`} />
                  <Metric
                    label="Estimated Age"
                    value={`${selected.estimated_age_min_hours}–${selected.estimated_age_max_hours} h`}
                  />
                  <Metric
                    label="Coordinates"
                    value={`${selected.center_lat.toFixed(2)}° N, ${selected.center_lon.toFixed(2)}° E`}
                  />
                  <Metric label="Oil Type" value={selected.oil_type} small />
                </div>

                <ScoreBar label="Detection confidence" value={detection.confidence <= 1 ? detection.confidence * 100 : detection.confidence} />
              </div>
            ) : (
              <p className="text-sm text-text-muted">No detection selected.</p>
            )}
          </Panel>

          <Panel title="Detected Spill Events">
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {spills.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={clsx(
                    'w-full text-left px-3 py-2 rounded-sm border text-sm transition-colors',
                    selected?.id === s.id
                      ? 'border-accent/40 bg-accent/5 text-accent'
                      : 'border-panel-border bg-navy-800/40 text-text hover:border-accent/20',
                  )}
                >
                  <div className="flex justify-between gap-2">
                    <span className="truncate">{s.name}</span>
                    <span className="font-mono text-xs text-text-muted">{s.area_km2} km²</span>
                  </div>
                  <p className="font-mono text-[10px] text-text-muted mt-0.5">
                    {new Date(s.detected_at).toUTCString()}
                  </p>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Tabs */}
      <Panel>
        <div className="flex gap-1 border-b border-panel-border -mx-4 px-4 -mt-0 mb-4">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={clsx(
                'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
                tab === t
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Detection' && detection && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="Mean backscatter" value={`${detection.mean_backscatter_db} dB`} />
            <Metric label="Ambient backscatter" value={`${detection.ambient_backscatter_db} dB`} />
            <Metric label="Contrast" value={`${detection.contrast_db} dB`} />
            <Metric label="Incidence angle" value={`${detection.incidence_angle_deg}°`} />
          </div>
        )}

        {tab === 'Segmentation' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-panel-border rounded-sm overflow-hidden aspect-[640/460]">
              <SarPreview showMask={false} showBoundingBox={false} seed={11} />
            </div>
            <div className="border border-panel-border rounded-sm overflow-hidden aspect-[640/460]">
              <SarPreview showMask showBoundingBox={false} seed={11} />
            </div>
            <p className="text-xs text-text-muted md:col-span-2">
              Left: input backscatter scene. Right: predicted slick mask overlay (mock U-Net output).
              A real segmentation model (U-Net / DeepLabV3+) can replace the mock via the
              <code className="font-mono text-accent"> SpillDetector </code> interface.
            </p>
          </div>
        )}

        {tab === 'Satellite Metadata' && detection && (
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <Metric label="Satellite" value={detection.satellite_name} />
            <Metric label="Sensor" value={detection.sensor_type} />
            <Metric label="Polarization" value={detection.polarization} />
            <Metric label="Acquisition" value={new Date(detection.acquisition_time).toUTCString()} small />
            <Metric label="Product" value="S1A_IW_GRDH_1SDV (simulated)" small />
            <Metric label="Resolution" value="10 m / px" />
          </dl>
        )}

        {tab === 'Look-alikes' && detection && (
          <div className="space-y-3 max-w-xl">
            <p className="text-xs text-text-muted">
              Look-alike rejection scores — probability that each confounding phenomenon was correctly ruled out.
            </p>
            <ScoreBar label="Biogenic slick" value={detection.biogenic_slick_rejection} />
            <ScoreBar label="Low-wind calm area" value={detection.low_wind_calm_rejection} />
            <ScoreBar label="Internal wave signature" value={detection.internal_wave_rejection} />
            <ScoreBar label="Rain cell" value={detection.rain_cell_rejection} />
          </div>
        )}

        {tab === 'Raw Data' && (
          <pre className="text-xs font-mono text-text-muted bg-navy-950 border border-panel-border rounded-sm p-4 overflow-x-auto max-h-72">
            {JSON.stringify(selected ?? {}, null, 2)}
          </pre>
        )}
      </Panel>
    </div>
  );
}

function Metric({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="p-2.5 bg-navy-800/50 border border-panel-border rounded-sm">
      <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
      <p className={clsx('font-mono text-white mt-0.5', small ? 'text-xs' : 'text-sm')}>{value}</p>
    </div>
  );
}
