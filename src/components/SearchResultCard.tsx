import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, ExternalLink, Calendar, User, Hash } from 'lucide-react';

export interface SearchResultItem {
  rank: number;
  chunkId: string;
  chunkIndex: number;
  documentId: string;
  documentTitle: string;
  documentAuthors: string;
  publicationDate: string;
  content: string;
  snippet: string;
  similarityScore: number;
  keywordScore: number;
  combinedScore: number;
  tokenCount: number;
}

interface SearchResultCardProps {
  result: SearchResultItem;
  query: string;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ result, query }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Convert similarity to percentage display
  const similarityPct = Math.round(result.similarityScore * 100);

  // Score color scale
  const getScoreColor = (pct: number) => {
    if (pct >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (pct >= 70) return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  // Highlight search terms inside text
  const renderHighlighted = (text: string) => {
    if (!query) return text;
    const words = query
      .split(/\W+/)
      .filter((w) => w.length > 2)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (words.length === 0) return text;
    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-indigo-500/30 text-indigo-200 font-medium px-0.5 rounded border border-indigo-500/40"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-md space-y-3">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-mono font-bold text-indigo-400">
            #{result.rank}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white tracking-tight line-clamp-1">
              {result.documentTitle}
            </h4>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-slate-500" />
                {result.documentAuthors}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3 text-slate-500" />
                {result.publicationDate || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Cosine Similarity Pill */}
        <div className="flex flex-col items-end shrink-0">
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold border flex items-center gap-1.5 ${getScoreColor(
              similarityPct
            )}`}
          >
            <span>{similarityPct}%</span>
            <span className="text-[10px] font-normal uppercase text-slate-400">Similarity</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 mt-0.5">
            Chunk #{result.chunkIndex} (~{result.tokenCount} tokens)
          </span>
        </div>
      </div>

      {/* Snippet passage */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans select-text">
        {isExpanded ? (
          <p className="whitespace-pre-wrap">{renderHighlighted(result.content)}</p>
        ) : (
          <p>{renderHighlighted(result.snippet)}</p>
        )}
      </div>

      {/* Expand / Collapse toggle & citation link */}
      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-[11px] text-slate-500 font-mono">
          Cosine Distance: {(1 - result.similarityScore).toFixed(4)}
        </span>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors"
        >
          <span>{isExpanded ? 'Collapse Passage' : 'View Full Context Chunk'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
