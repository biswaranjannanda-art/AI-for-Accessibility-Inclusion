import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace, WorkspaceItem } from '../context/WorkspaceContext.tsx';
import {
  Layers,
  Plus,
  BookOpen,
  Calendar,
  Trash2,
  ArrowRight,
  FolderKanban,
  Search,
  Filter,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';

export const WorkspacesPage: React.FC = () => {
  const navigate = useNavigate();
  const { workspaces, activeWorkspace, setActiveWorkspace, createWorkspace, deleteWorkspace, isLoading } =
    useWorkspace();

  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [newWsDomain, setNewWsDomain] = useState('General Science');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const domains = [
    'All',
    'Medical & Healthcare',
    'Artificial Intelligence & Computer Science',
    'Climate & Environmental Science',
    'Finance & Macroeconomics',
    'Social Sciences & Humanities',
    'General Science',
  ];

  const filtered = workspaces.filter((ws) => {
    const matchesSearch =
      ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ws.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = domainFilter === 'All' || ws.domain === domainFilter;
    return matchesSearch && matchesDomain;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await createWorkspace({
        name: newWsName.trim(),
        description: newWsDesc.trim(),
        domain: newWsDomain,
      });
      setIsCreateModalOpen(false);
      setNewWsName('');
      setNewWsDesc('');
      navigate(`/workspaces/${created.id}`);
    } catch (err) {
      console.error('Failed to create workspace:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, ws: WorkspaceItem) => {
    e.stopPropagation();
    if (window.confirm(`Delete workspace "${ws.name}" and all contained documents and vector chunks?`)) {
      try {
        await deleteWorkspace(ws.id);
      } catch (err) {
        console.error('Failed to delete workspace:', err);
      }
    }
  };

  const getDomainColor = (domain: string) => {
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Research Workspaces</h2>
          <p className="text-xs text-slate-400 mt-1">
            Isolate literature collections, vector indexes, and structured extractions by project.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Research Workspace</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search workspaces by title or scope..."
            className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-72"
          />
        </div>

        {/* Domain Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {domains.map((d) => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                domainFilter === d
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Workspaces Grid */}
      {filtered.length === 0 ? (
        <div className="p-16 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 space-y-3">
          <FolderKanban className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="font-semibold text-slate-200">No research workspaces match your criteria.</p>
          <p className="text-slate-500">Create a new workspace to start organizing your papers.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((ws) => (
            <div
              key={ws.id}
              onClick={() => {
                setActiveWorkspace(ws);
                navigate(`/workspaces/${ws.id}`);
              }}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/30 transition-all shadow-xl cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Domain & Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getDomainColor(
                      ws.domain
                    )}`}
                  >
                    {ws.domain}
                  </span>
                  {activeWorkspace?.id === ws.id && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {ws.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {ws.description || 'Dedicated knowledge workspace.'}
                </p>
              </div>

              {/* Stats & Actions */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                  <span>{ws.documentCount || 0} Papers</span>
                  <span>•</span>
                  <span>{new Date(ws.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(e, ws)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete workspace"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="p-1 rounded-lg text-indigo-400 group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Workspace Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Create Research Workspace</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Workspace Project Name
                </label>
                <input
                  type="text"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Oncology Diagnostic Neural Models"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Primary Research Domain
                </label>
                <select
                  value={newWsDomain}
                  onChange={(e) => setNewWsDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Medical & Healthcare">Medical & Healthcare</option>
                  <option value="Artificial Intelligence & Computer Science">
                    Artificial Intelligence & Computer Science
                  </option>
                  <option value="Climate & Environmental Science">
                    Climate & Environmental Science
                  </option>
                  <option value="Finance & Macroeconomics">Finance & Macroeconomics</option>
                  <option value="Social Sciences & Humanities">Social Sciences & Humanities</option>
                  <option value="General Science">General Science</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Research Description & Scope
                </label>
                <textarea
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  placeholder="Summarize the core clinical or algorithmic objective of this workspace..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newWsName.trim()}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Create Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
