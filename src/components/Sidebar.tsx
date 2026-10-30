import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Search,
  Sparkles,
  TableProperties,
  Settings,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext.tsx';

export const Sidebar: React.FC = () => {
  const { activeWorkspace } = useWorkspace();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Research Overview',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      to: '/workspaces',
      label: 'Workspaces & Papers',
      icon: FolderKanban,
      badge: activeWorkspace?.documentCount !== undefined ? `${activeWorkspace.documentCount}` : undefined,
    },
    {
      to: '/discovery',
      label: 'Hybrid Discovery',
      icon: Search,
      badge: 'Vector',
    },
    {
      to: '/synthesis',
      label: 'Synthesis Studio',
      icon: Sparkles,
      badge: 'RAG',
    },
    {
      to: '/extractions',
      label: 'Data Extraction Lab',
      icon: TableProperties,
      badge: 'Zod',
    },
    {
      to: '/settings',
      label: 'Engine Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between p-4 shrink-0 select-none">
      <div>
        {/* Workspace Quick Card */}
        {activeWorkspace && (
          <div className="mb-6 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 shadow-inner">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Layers className="w-3 h-3 text-indigo-400" /> Current Workspace
              </span>
            </div>
            <p className="text-xs font-semibold text-white truncate">{activeWorkspace.name}</p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{activeWorkspace.documentCount || 0} Documents</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Indexed
              </span>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Intelligence Modules
          </p>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/20 to-indigo-500/10 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* System Status Footnote */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Activity className="w-3.5 h-3.5 text-indigo-400" /> Gemini SDK
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">2.5-flash</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Dense embeddings: 768-dim vector projections with strict citation verification.
        </p>
      </div>
    </aside>
  );
};
