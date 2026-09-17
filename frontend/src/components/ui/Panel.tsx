import clsx from 'clsx';

export function Panel({ children, className, title, action }: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={clsx(
      'bg-[var(--color-panel)] border border-[var(--color-panel-border)] rounded-sm',
      className,
    )}>
      {title && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-panel-border)]">
          <h3 className="text-sm font-semibold text-text tracking-wide uppercase">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function KPICard({ label, value, trend, status }: {
  label: string;
  value: string;
  trend?: string;
  status?: string;
}) {
  const indicator = status === 'warning' ? 'bg-amber-400'
    : status === 'negative' ? 'bg-red-400'
    : status === 'positive' ? 'bg-emerald-400'
    : 'bg-cyan-400';

  return (
    <div className="bg-[var(--color-panel)] border border-[var(--color-panel-border)] rounded-sm p-4 relative overflow-hidden">
      <div className={clsx('absolute top-0 left-0 w-1 h-full', indicator)} />
      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-semibold font-mono text-white">{value}</p>
      {trend && <p className="text-xs text-text-muted mt-1">{trend}</p>}
    </div>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-muted">{label}</span>
        <span className="font-mono text-accent">{value.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-dim to-accent rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <p className="text-red-400 text-sm font-medium">Error</p>
      <p className="text-text-muted text-sm max-w-md text-center">{message}</p>
    </div>
  );
}


