import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext.tsx';
import { api } from '../services/api.ts';
import { VectorSearchInput } from '../components/VectorSearchInput.tsx';
import { SearchResultCard, SearchResultItem } from '../components/SearchResultCard.tsx';
import {
  Search,
  Sparkles,
  Database,
  SlidersHorizontal,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const DiscoveryPage: React.FC = () => {
  const { activeWorkspace } = useWorkspace();

  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMeta, setSearchMeta] = useState<{
    totalMatches: number;
    latencyMs: number;
    query: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !activeWorkspace) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await api.discovery.search({
        workspaceId: activeWorkspace.id,
        query: query.trim(),
        topK,
      });

      setResults(res.results || []);
      setSearchMeta({
        totalMatches: res.totalMatches || 0,
        latencyMs: res.latencyMs || 42,
        query: res.query || query,
      });
    } catch (err: any) {
      console.error('Search failed:', err);
      setErrorMessage(err.message || 'Vector search retrieval failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Hybrid Research Discovery</h2>
            <p className="text-xs text-slate-400">
              Dense 768-dim semantic vector retrieval combined with lexical inverted index scoring.
            </p>
          </div>
        </div>
      </div>

      {/* Vector Search Input Component */}
      <VectorSearchInput
        query={query}
        setQuery={setQuery}
        topK={topK}
        setTopK={setTopK}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {/* Results Header / Stats */}
      {searchMeta && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Found <strong className="text-white">{searchMeta.totalMatches}</strong> relevant context passage{searchMeta.totalMatches !== 1 ? 's' : ''} in{' '}
              <strong className="text-indigo-300">{activeWorkspace?.name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              Latency: {searchMeta.latencyMs} ms
            </span>
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-cyan-400" />
              IVFFlat Cosine Similarity
            </span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search Results List */}
      <div className="space-y-4">
        {results.length > 0 ? (
          results.map((item) => (
            <SearchResultCard
              key={item.chunkId || item.rank}
              result={item}
              query={searchMeta?.query || query}
            />
          ))
        ) : searchMeta && !isLoading ? (
          <div className="p-16 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
            No semantic chunk matches found above the similarity threshold.
          </div>
        ) : null}
      </div>
    </div>
  );
};
