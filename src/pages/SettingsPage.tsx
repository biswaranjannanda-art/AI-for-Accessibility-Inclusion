import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  Settings,
  Database,
  Cpu,
  ShieldCheck,
  User,
  Sliders,
  CheckCircle2,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settingsData, setSettingsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api.analytics.getSettings();
        setSettingsData(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          <span>System & Engine Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Vector database architecture, Gemini model endpoints, and authentication profile parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vector Engine & AI Configuration */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">AI Models & Retrieval Engine</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Dense Embedding Model</span>
              <span className="font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {settingsData?.system?.activeEmbeddingModel || 'text-embedding-004'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Embedding Dimensions</span>
              <span className="font-mono text-cyan-300">
                {settingsData?.system?.vectorDimensions || 768} Float32 Dimensions
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Fast Synthesis Model</span>
              <span className="font-mono text-emerald-300">
                {settingsData?.system?.activeSynthesisModel || 'gemini-2.5-flash'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Literature Review Model</span>
              <span className="font-mono text-amber-300">gemini-2.5-pro</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Database & Vector Layer</span>
              <span className="font-medium text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {settingsData?.system?.databaseType || 'PostgreSQL (pgvector enabled)'}
              </span>
            </div>
          </div>
        </div>

        {/* Ingestion & Constraints */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Ingestion Pipeline & Quotas</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Max Document Upload Limit</span>
              <span className="font-mono text-slate-200">
                {settingsData?.system?.maxUploadSizeMB || 25} MB
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Supported File MIME Types</span>
              <span className="font-mono text-slate-200">PDF, DOCX, TXT, Markdown</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Semantic Chunk Target Size</span>
              <span className="font-mono text-slate-200">800 chars (~150-200 tokens)</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Chunk Overlap Window</span>
              <span className="font-mono text-slate-200">150 chars (boundary preservation)</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400">Grounding Strictness</span>
              <span className="font-mono text-emerald-400">Zero-Extrapolation Academic Guard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Researcher Profile Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <User className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Authenticated Researcher Profile</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[11px] mb-1">Full Name & Title</span>
            <span className="font-semibold text-white">{user?.fullName}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[11px] mb-1">Institutional Email</span>
            <span className="font-mono text-slate-300 truncate block">{user?.email}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[11px] mb-1">Role / Permission Tier</span>
            <span className="font-mono text-indigo-400 font-semibold">{user?.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
