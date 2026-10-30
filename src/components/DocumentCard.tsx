import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  User,
  Layers,
  Trash2,
  ExternalLink,
  ChevronRight,
  Database,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  X,
} from 'lucide-react';
import { api } from '../services/api.ts';

export interface DocumentItem {
  id: string;
  workspace_id: string;
  title: string;
  authors: string;
  publication_date: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  status: 'pending' | 'processing' | 'indexed' | 'error';
  summary: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface DocumentCardProps {
  document: DocumentItem;
  onDelete?: (id: string) => void;
  onSelectForSynthesis?: (doc: DocumentItem) => void;
  isSelected?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onDelete,
  onSelectForSynthesis,
  isSelected = false,
}) => {
  const [showChunksModal, setShowChunksModal] = useState(false);
  const [chunks, setChunks] = useState<any[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'indexed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Indexed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-3 h-3 animate-spin" /> Chunking...
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Pending
          </span>
        );
    }
  };

  const handleOpenChunks = async () => {
    setShowChunksModal(true);
    setIsLoadingChunks(true);
    try {
      const res = await api.documents.getChunks(document.id);
      setChunks(res.chunks || []);
    } catch (err) {
      console.error('Failed to load chunks:', err);
    } finally {
      setIsLoadingChunks(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${document.title}" and all its vector embeddings?`)) {
      setIsDeleting(true);
      try {
        await api.documents.delete(document.id);
        if (onDelete) onDelete(document.id);
      } catch (err) {
        console.error('Failed to delete doc:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <div
        className={`p-5 rounded-2xl bg-slate-900/80 border transition-all duration-200 flex flex-col justify-between hover:shadow-xl hover:border-slate-700 ${
          isSelected
            ? 'border-indigo-500 ring-1 ring-indigo-500/40 bg-indigo-950/20'
            : 'border-slate-800'
        }`}
      >
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-slate-800 text-indigo-400 border border-slate-700/50">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {formatFileSize(document.file_size_bytes)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(document.status)}
              {onSelectForSynthesis && (
                <button
                  onClick={() => onSelectForSynthesis(document)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h4 className="text-sm font-semibold text-white tracking-tight line-clamp-2 mb-1.5 leading-snug">
            {document.title}
          </h4>

          {/* Metadata Authors / Date */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 mb-3">
            <span className="flex items-center gap-1 max-w-[200px] truncate">
              <User className="w-3 h-3 text-slate-500" />
              <span className="truncate">{document.authors}</span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3 text-slate-500" />
              {document.publication_date || 'N/A'}
            </span>
          </div>

          {/* Executive Summary Snippet */}
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 mb-4">
            {document.summary || 'Semantic processing completed. Ready for vector retrieval.'}
          </p>
        </div>

        {/* Footer info & actions */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Database className="w-3 h-3 text-indigo-400" />
            <span>{document.metadata?.chunkCount || 4} chunks indexed</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenChunks}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-[11px]"
              title="Inspect semantic chunks"
            >
              <Eye className="w-3 h-3" />
              <span>Chunks</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Chunks Modal */}
      {showChunksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Semantic Chunks Inspector</h3>
                <p className="text-xs text-slate-400 truncate max-w-lg">{document.title}</p>
              </div>
              <button
                onClick={() => setShowChunksModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {isLoadingChunks ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Loading indexed vectors...
                </div>
              ) : chunks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No chunks found for this document.
                </div>
              ) : (
                chunks.map((c) => (
                  <div
                    key={c.id || c.chunk_index}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800/80 pb-1.5">
                      <span className="text-indigo-400 font-semibold">Chunk #{c.chunk_index}</span>
                      <span>~{c.token_count || 120} Tokens • 768-dim Embedding</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans select-text whitespace-pre-wrap">
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
              <span>Total chunks: {chunks.length}</span>
              <button
                onClick={() => setShowChunksModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
