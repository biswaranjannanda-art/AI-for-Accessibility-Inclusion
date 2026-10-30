import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkspace } from '../context/WorkspaceContext.tsx';
import {
  Layers,
  ChevronDown,
  Plus,
  LogOut,
  Sparkles,
  Database,
  User as UserIcon,
  BookOpen,
  FlaskConical,
} from 'lucide-react';

interface NavbarProps {
  onOpenUpload?: () => void;
  onOpenNewWorkspace?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenUpload, onOpenNewWorkspace }) => {
  const { user, logout } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const [isWsOpen, setIsWsOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);

  const getDomainColor = (domain?: string) => {
    switch (domain) {
      case 'Medical & Healthcare':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'Artificial Intelligence & Computer Science':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'Climate & Environmental Science':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Finance & Macroeconomics':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Active Workspace */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white font-['Plus_Jakarta_Sans']">
                ResearchPulse
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Knowledge Discovery & Synthesis</p>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsWsOpen(!isWsOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-colors shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium max-w-[180px] truncate">
              {activeWorkspace?.name || 'Select Workspace'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isWsOpen && (
            <div
              className="absolute left-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
              onMouseLeave={() => setIsWsOpen(false)}
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 mb-1">
                <span>Active Research Workspaces</span>
                <span className="text-slate-500 font-mono">{workspaces.length}</span>
              </div>
              <div className="max-h-60 overflow-y-auto px-1 space-y-0.5">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspace(ws);
                      setIsWsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      activeWorkspace?.id === ws.id
                        ? 'bg-indigo-600/15 text-indigo-300 font-medium border border-indigo-500/20'
                        : 'text-slate-300 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="truncate">{ws.name}</p>
                      <p className="text-[10px] text-slate-500">{ws.domain}</p>
                    </div>
                    {activeWorkspace?.id === ws.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>

              {onOpenNewWorkspace && (
                <div className="p-2 pt-1 border-t border-slate-800 mt-1">
                  <button
                    onClick={() => {
                      setIsWsOpen(false);
                      onOpenNewWorkspace();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 text-xs font-medium border border-slate-700/60 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Workspace
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Domain Badge */}
        {activeWorkspace && (
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${getDomainColor(
              activeWorkspace.domain
            )}`}
          >
            <BookOpen className="w-3 h-3" />
            <span>{activeWorkspace.domain}</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Vector Engine Health Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Database className="w-3 h-3 text-emerald-400" />
          <span className="font-mono text-[10px]">768-dim Vector Index</span>
        </div>

        {/* Upload Paper Button */}
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:shadow-indigo-600/40 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        )}

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setIsUserOpen(!isUserOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-indigo-500/40 flex items-center justify-center text-xs font-semibold text-indigo-300">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden xl:block text-left text-xs">
              <p className="font-medium text-slate-200 leading-tight truncate max-w-[140px]">
                {user?.fullName || 'Researcher'}
              </p>
              <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                {user?.role || 'Principal Investigator'}
              </p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isUserOpen && (
            <div
              className="absolute right-0 mt-2 w-60 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
              onMouseLeave={() => setIsUserOpen(false)}
            >
              <div className="px-4 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-white">{user?.fullName}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{user?.email}</p>
                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-medium border border-indigo-500/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  {user?.role}
                </div>
              </div>

              <div className="p-1">
                <button
                  onClick={() => {
                    setIsUserOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
