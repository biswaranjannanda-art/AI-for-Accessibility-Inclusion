import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.ts';
import { DocumentCard, DocumentItem } from '../components/DocumentCard.tsx';
import { FileUploadModal } from '../components/FileUploadModal.tsx';
import { useWorkspace } from '../context/WorkspaceContext.tsx';
import {
  UploadCloud,
  Search,
  Sparkles,
  ArrowLeft,
  BookOpen,
  Calendar,
  Layers,
  Database,
  TableProperties,
} from 'lucide-react';

export const WorkspaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setActiveWorkspace } = useWorkspace();

  const [workspace, setWorkspace] = useState<any>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchWorkspaceData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.workspaces.get(id);
      setWorkspace(res.workspace);
      setDocuments(res.workspace.documents || []);
      setActiveWorkspace(res.workspace);
    } catch (err) {
      console.error('Failed to load workspace details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [id]);

  const toggleSelectDoc = (doc: DocumentItem) => {
    setSelectedDocIds((prev) =>
      prev.includes(doc.id) ? prev.filter((i) => i !== doc.id) : [...prev, doc.id]
    );
  };

  const handleLaunchSynthesis = () => {
    navigate('/synthesis', { state: { selectedDocIds, workspaceId: id } });
  };

  const handleLaunchExtraction = () => {
    navigate('/extractions', { state: { selectedDocIds, workspaceId: id } });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <button
          onClick={() => navigate('/workspaces')}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Workspaces</span>
        </button>
        <span>/</span>
        <span className="text-white font-medium truncate max-w-xs">{workspace?.name || 'Workspace'}</span>
      </div>

      {/* Workspace Banner */}
      {workspace && (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {workspace.domain}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Created {new Date(workspace.created_at).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{workspace.name}</h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                {workspace.description || 'Dedicated research knowledge workspace.'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Paper</span>
              </button>
              <button
                onClick={() => navigate('/discovery')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Search Vectors</span>
              </button>
            </div>
          </div>

          {/* Multi-Selection Control Bar */}
          {selectedDocIds.length > 0 && (
            <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-between gap-4 text-xs">
              <span className="text-indigo-200 font-medium">
                {selectedDocIds.length} paper{selectedDocIds.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLaunchSynthesis}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Synthesize Selected</span>
                </button>
                <button
                  onClick={() => setSelectedDocIds([])}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Documents Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Ingested Literature & Preprints ({documents.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {documents.filter((d) => d.status === 'indexed').length} / {documents.length} Vector Indexed
          </span>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-16 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 space-y-3">
            <UploadCloud className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-200">No documents ingested in this workspace yet.</p>
            <p className="text-slate-500">
              Upload PDF, DOCX, TXT, or Markdown research files to extract knowledge and build vector embeddings.
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Upload Research Paper
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDelete={() => fetchWorkspaceData()}
                onSelectForSynthesis={toggleSelectDoc}
                isSelected={selectedDocIds.includes(doc.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchWorkspaceData}
      />
    </div>
  );
};
