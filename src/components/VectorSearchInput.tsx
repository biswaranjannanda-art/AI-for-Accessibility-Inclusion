import React from 'react';
import { Search, Sparkles, SlidersHorizontal, ArrowRight } from 'lucide-react';

interface VectorSearchInputProps {
  query: string;
  setQuery: (q: string) => void;
  topK: number;
  setTopK: (k: number) => void;
  onSearch: (e: React.FormEvent) => void;
  isLoading: boolean;
  sampleQueries?: string[];
}

export const VectorSearchInput: React.FC<VectorSearchInputProps> = ({
  query,
  setQuery,
  topK,
  setTopK,
  onSearch,
  isLoading,
  sampleQueries = [
    'What are the primary clinical trial outcomes in the pancreatic cancer detection study?',
    'How does hybrid vector retrieval eliminate hallucinations in enterprise RAG systems?',
    'Comparative cardiovascular efficacy of GLP-1 vs dual GIP/GLP-1 receptor agonists',
    'Self-reflective Tree-of-Thought reasoning resolution rates on SWE-bench',
  ],
}) => {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 shadow-xl space-y-4">
      {/* Search form */}
      <form onSubmit={onSearch} className="space-y-4">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-indigo-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask an analytical question or enter semantic search terms across papers..."
            className="w-full pl-12 pr-32 py-3.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
            required
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching...
              </span>
            ) : (
              <>
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 pt-1">
          {/* TopK slider */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              Retrieval Depth (Top-K):
            </span>
            <input
              type="range"
              min={1}
              max={15}
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value, 10))}
              className="w-24 accent-indigo-500 cursor-pointer"
            />
            <span className="font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-semibold">
              {topK} chunks
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Method:</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Cosine Similarity + Lexical BM25
            </span>
          </div>
        </div>
      </form>

      {/* Suggested prompts */}
      {sampleQueries.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80">
          <p className="text-[11px] font-medium text-slate-500 mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Recommended Academic Queries:
          </p>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuery(sq)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-200 border border-slate-700/60 transition-colors text-left truncate max-w-md"
              >
                "{sq}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
