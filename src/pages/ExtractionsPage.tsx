import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext.tsx';
import { api } from '../services/api.ts';
import { ExtractionTable, ExtractionRecord } from '../components/ExtractionTable.tsx';
import {
  TableProperties,
  Sparkles,
  FileSpreadsheet,
  Layers,
  BookOpen,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const ExtractionsPage: React.FC = () => {
  const { activeWorkspace } = useWorkspace();

  const [extractions, setExtractions] = useState<ExtractionRecord[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    try {
      const extRes = await api.extractions.list(activeWorkspace.id);
      setExtractions(extRes.extractions || []);

      const docsRes = await api.workspaces.getDocuments(activeWorkspace.id);
      const docs = docsRes.documents || [];
      setDocuments(docs);
      if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0].id);
      }
    } catch (err) {
      console.error('Failed to load extraction data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeWorkspace]);

  const handleRunExtraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !selectedDocId) return;

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const res = await api.extractions.process({
        workspaceId: activeWorkspace.id,
        documentId: selectedDocId,
      });

      setStatusMessage({
        type: 'success',
        text: `Successfully extracted structured schema findings from "${res.extraction.paper_title || 'Document'}".`,
      });

      await loadData();
    } catch (err: any) {
      console.error('Extraction error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Structured extraction failed.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <TableProperties className="w-6 h-6 text-indigo-400" />
            <span>Structured Knowledge Extraction Laboratory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Extract research methodology, sample sizes, empirical findings, and limitations into schema-validated comparison matrices.
          </p>
        </div>
      </div>

      {/* Extraction Runner Bar */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <form onSubmit={handleRunExtraction} className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Select Ingested Literature Document to Extract
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {documents.length === 0 ? (
                <option value="">No documents available in this workspace</option>
              ) : (
                documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.authors})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="pt-4 md:pt-4 w-full md:w-auto">
            <button
              type="submit"
              disabled={isProcessing || !selectedDocId}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting Schema (Zod)...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Structured Extraction</span>
                </>
              )}
            </button>
          </div>
        </form>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Structured Comparison Grid Table */}
      <ExtractionTable
        extractions={extractions}
        workspaceId={activeWorkspace?.id}
        onRefresh={loadData}
      />
    </div>
  );
};
