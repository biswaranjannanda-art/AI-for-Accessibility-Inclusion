import React, { useState } from 'react';
import {
  Table,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { api } from '../services/api.ts';

export interface ExtractionRecord {
  id: string;
  document_id: string;
  workspace_id: string;
  paper_title?: string;
  methodology: string;
  sample_size: string;
  key_findings: string[];
  limitations: string[];
  extracted_data?: Record<string, any>;
  created_at: string;
}

interface ExtractionTableProps {
  extractions: ExtractionRecord[];
  workspaceId?: string;
  onRefresh?: () => void;
}

export const ExtractionTable: React.FC<ExtractionTableProps> = ({
  extractions,
  workspaceId,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState('all');

  const filtered = extractions.filter((item) => {
    const matchesSearch =
      (item.paper_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.methodology.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.key_findings.some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMethod =
      selectedMethodFilter === 'all' ||
      item.methodology.toLowerCase().includes(selectedMethodFilter.toLowerCase());

    return matchesSearch && matchesMethod;
  });

  const exportCsv = () => {
    const url = api.extractions.exportCsvUrl(workspaceId);
    window.open(url, '_blank');
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter findings, sample size, or title..."
              className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>

          <span className="text-slate-500 text-xs">|</span>

          <span className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-white">{filtered.length}</strong> of{' '}
            {extractions.length} papers
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            disabled={extractions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Structured Grid Table */}
      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs space-y-2">
            <Table className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="font-medium text-slate-300">No structured extractions match your filter.</p>
            <p className="text-slate-500">
              Run automated extraction on documents to populate this comparison matrix.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-1/4">Research Paper & Title</th>
                <th className="py-3 px-4 w-1/6">Methodology & Design</th>
                <th className="py-3 px-4 w-1/8">Sample Size</th>
                <th className="py-3 px-4 w-1/3">Key Empirical Findings</th>
                <th className="py-3 px-4 w-1/4">Limitations & Gaps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-800/30 transition-colors align-top"
                >
                  {/* Paper Title */}
                  <td className="py-4 px-4 font-medium text-white">
                    <p className="line-clamp-2 leading-snug">{item.paper_title || 'Untitled Paper'}</p>
                    <span className="inline-block mt-1 font-mono text-[10px] text-indigo-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </td>

                  {/* Methodology */}
                  <td className="py-4 px-4 text-slate-300">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-medium leading-relaxed">
                      {item.methodology}
                    </span>
                  </td>

                  {/* Sample Size */}
                  <td className="py-4 px-4 font-mono text-slate-300 text-[11px]">
                    {item.sample_size || 'N/A'}
                  </td>

                  {/* Key Findings */}
                  <td className="py-4 px-4 space-y-1.5 text-slate-200">
                    <ul className="space-y-1">
                      {item.key_findings.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-relaxed text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {item.extracted_data?.practicalImplications && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[10px] text-amber-300 flex items-start gap-1.5">
                        <Lightbulb className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Implication:</strong> {item.extracted_data.practicalImplications}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Limitations */}
                  <td className="py-4 px-4 space-y-1 text-slate-400">
                    <ul className="space-y-1">
                      {item.limitations.map((l, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-relaxed text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500/80 shrink-0 mt-0.5" />
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
