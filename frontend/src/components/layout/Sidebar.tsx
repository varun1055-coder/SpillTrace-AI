import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Search, Droplets, Map, Ship, Wind,
  FileText, Database, Settings, Activity, Radio,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/investigations', icon: Search, label: 'Investigations' },
  { to: '/spill-detection', icon: Droplets, label: 'Spill Detection' },
  { to: '/maritime-map', icon: Map, label: 'Maritime Map' },
  { to: '/vessels', icon: Ship, label: 'Vessels' },
  { to: '/drift-analysis', icon: Wind, label: 'Drift Analysis' },
  { to: '/evidence', icon: FileText, label: 'Evidence' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/data-sources', icon: Database, label: 'Data Sources' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="w-56 flex-shrink-0 bg-navy-900 border-r border-panel-border flex flex-col h-full">
      <div className="px-4 py-5 border-b border-panel-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-accent-dim to-accent flex items-center justify-center">
            <Droplets className="w-4 h-4 text-navy-950" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">SpillTrace AI</p>
            <p className="text-[10px] text-text-muted leading-tight">Maritime Intelligence</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-2',
              isActive
                ? 'border-accent text-accent bg-accent/5'
                : 'border-transparent text-text-muted hover:text-text hover:bg-navy-800',
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-panel-border space-y-3">
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <Activity className="w-3 h-3" />
            <span>System: Operational</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <Radio className="w-3 h-3" />
            <span>API: Online</span>
          </div>
          <p className="font-mono text-text-muted text-[10px]">
            Data: {new Date().toISOString().slice(0, 19)} UTC
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-panel-border">
          <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-xs font-medium text-accent">
            SA
          </div>
          <div>
            <p className="text-xs font-medium text-text">Analyst</p>
            <p className="text-[10px] text-text-muted">Forensic Intelligence</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
