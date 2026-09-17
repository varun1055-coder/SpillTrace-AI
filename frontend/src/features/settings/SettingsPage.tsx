import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { ShieldCheck, Bell, Database, Cpu } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <Panel title="User Profile">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-navy-600 flex items-center justify-center text-accent font-semibold">
            DA
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Analyst</p>
            <p className="text-xs text-text-muted">Forensic Intelligence · analyst@spilltrace.ai</p>
          </div>
          <Badge variant="medium" className="ml-auto">Operational</Badge>
        </div>
        <p className="text-xs text-text-muted mt-4 border-t border-panel-border pt-3">
          Authentication is stubbed for the prototype. The shell is structured to accept a JWT/OAuth
          provider later via <code className="font-mono text-accent">app/providers</code> and
          <code className="font-mono text-accent"> core/security.py</code>.
        </p>
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Model Configuration">
          <div className="space-y-3 text-sm">
            <ConfigRow icon={Cpu} label="Spill detector" value="Production model" />
            <ConfigRow icon={Cpu} label="Drift model" value="Operational model" />
            <ConfigRow icon={Cpu} label="Attribution engine" value="Production scoring" />
            <ConfigRow icon={Cpu} label="Counterfactual sim" value="Live scenario engine" />
          </div>
          <p className="text-[10px] font-mono text-text-muted mt-3">
            Runtime configuration is managed in the backend environment settings.
          </p>
        </Panel>

        <Panel title="API & Database">
          <div className="space-y-3 text-sm">
            <ConfigRow icon={Database} label="API base" value="/api/v1" mono />
            <ConfigRow icon={Database} label="Database" value="SQLite (dev fallback)" />
            <ConfigRow icon={Database} label="Target" value="PostgreSQL + PostGIS" />
            <ConfigRow icon={ShieldCheck} label="Auth mode" value="Protected access" />
          </div>
        </Panel>
      </div>

      <Panel title="Notifications">
        <div className="space-y-2.5 text-sm">
          <ToggleRow icon={Bell} label="New spill detection alerts" enabled />
          <ToggleRow icon={Bell} label="Attribution analysis completed" enabled />
          <ToggleRow icon={Bell} label="Data source offline warnings" enabled />
          <ToggleRow icon={Bell} label="Weekly intelligence digest" enabled={false} />
        </div>
        <p className="text-[10px] font-mono text-text-muted mt-3">
          Notification preferences are UI placeholders — no dispatcher is wired yet.
        </p>
      </Panel>

      <Panel title="About">
        <p className="text-sm text-text-muted leading-relaxed">
          <span className="text-white font-semibold">SpillTrace AI</span> — From Oil Spill Detection
          to Intelligent Vessel Attribution. Probabilistic maritime forensic intelligence platform.
          All outputs are analytical assessments, not definitive proof of responsibility.
        </p>
        <p className="font-mono text-[10px] text-text-muted mt-3">v0.1.0 · foundation build</p>
      </Panel>
    </div>
  );
}

function ConfigRow({ icon: Icon, label, value, mono }: {
  icon: typeof Cpu;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-text-muted">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <span className={mono ? 'font-mono text-xs text-text' : 'text-text text-xs'}>{value}</span>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, enabled }: {
  icon: typeof Bell;
  label: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-text-muted">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <span
        className={
          enabled
            ? 'w-8 h-4 rounded-full bg-accent/30 relative after:absolute after:right-0.5 after:top-0.5 after:w-3 after:h-3 after:rounded-full after:bg-accent'
            : 'w-8 h-4 rounded-full bg-navy-600 relative after:absolute after:left-0.5 after:top-0.5 after:w-3 after:h-3 after:rounded-full after:bg-text-muted'
        }
      />
    </div>
  );
}
