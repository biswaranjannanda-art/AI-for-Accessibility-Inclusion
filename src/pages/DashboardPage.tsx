import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useWorkspace } from '../context/WorkspaceContext.tsx';
import { api } from '../services/api.ts';
import { AnalyticsWidget } from '../components/AnalyticsWidget.tsx';
import { FileUploadModal } from '../components/FileUploadModal.tsx';
import {
  UploadCloud,
  Search,
  Sparkles,
  TableProperties,
  ArrowRight,
  FileText,
  Calendar,
  Layers,
  Database,
  CheckCircle2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWorkspace, refreshWorkspaces } = useWorkspace();

  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const data = await api.analytics.getDashboard();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Enterprise Literature Synthesis & Vector Discovery</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, {user?.fullName?.split(',')[0] || 'Researcher'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Active Workspace: <strong className="text-white">{activeWorkspace?.name || 'General Science'}</strong>. 
            All document chunks are indexed with 768-dimensional Gemini embeddings and ready for grounded literature synthesis.
          </p>
        </div>

        {/* Quick Launch Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
          <button
            onClick={() => navigate('/discovery')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Search className="w-4 h-4 text-indigo-400" />
            <span>Vector Search</span>
          </button>
        </div>

        {/* Ambient gradient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Quick Access Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/discovery')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 transition-all text-left group shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Hybrid Vector Discovery</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Find exact passages with dense cosine similarity & lexical ranking.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-indigo-400 font-medium">
            <span>Explore literature</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => navigate('/synthesis')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/40 transition-all text-left group shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Multi-Doc Synthesis</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stream answers grounded in papers with inline citation back-linking.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-cyan-400 font-medium">
            <span>Open studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => navigate('/extractions')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40 transition-all text-left group shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <TableProperties className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Structured Extraction Lab</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated extraction of methods, sample sizes, and empirical findings.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <span>View tables</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => navigate('/workspaces')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/40 transition-all text-left group shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Workspace Manager</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Organize multi-format literature by clinical or scientific domain.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-amber-400 font-medium">
            <span>Manage projects</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Analytics Visualizer Widget */}
      {isLoading ? (
        <div className="p-16 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
          Loading research intelligence metrics...
        </div>
      ) : analytics ? (
        <AnalyticsWidget analytics={analytics} />
      ) : null}

      {/* Recent Ingested Documents List */}
      {analytics?.recentDocuments && analytics.recentDocuments.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Recently Ingested Literature</h4>
              <p className="text-xs text-slate-400">Indexed papers across your research workspaces</p>
            </div>
            <button
              onClick={() => navigate('/workspaces')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {analytics.recentDocuments.map((doc: any) => (
              <div
                key={doc.id}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-800/20 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-800 text-indigo-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-white line-clamp-1">{doc.title}</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {doc.authors} • {doc.publication_date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Indexed
                  </span>
                  <button
                    onClick={() => navigate('/discovery')}
                    className="text-xs text-slate-400 hover:text-indigo-300 transition-colors"
                  >
                    Search In Paper
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchAnalytics}
      />
    </div>
  );
};
