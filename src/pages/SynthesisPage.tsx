import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.tsx';
import { api } from '../services/api.ts';
import { ChatStreamBox, ChatMessageItem } from '../components/ChatStreamBox.tsx';
import {
  Sparkles,
  BookOpen,
  FileText,
  Download,
  CheckCircle2,
  ListFilter,
  MessageSquare,
  Plus,
  Loader2,
  FileCheck,
} from 'lucide-react';

export const SynthesisPage: React.FC = () => {
  const location = useLocation();
  const { activeWorkspace } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'chat' | 'lit_review'>('chat');
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(
    location.state?.selectedDocIds || []
  );
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);
  const [initialMessages, setInitialMessages] = useState<ChatMessageItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Lit Review State
  const [reviewTopic, setReviewTopic] = useState('');
  const [reviewDepth, setReviewDepth] = useState<'executive' | 'critical' | 'exhaustive'>('critical');
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [generatedReview, setGeneratedReview] = useState<string | null>(null);

  // Load documents and sessions
  const loadWorkspaceData = async () => {
    if (!activeWorkspace) return;
    setIsLoadingDocs(true);
    try {
      const docsRes = await api.workspaces.getDocuments(activeWorkspace.id);
      setDocuments(docsRes.documents || []);

      const sessRes = await api.synthesis.listSessions(activeWorkspace.id);
      setSessions(sessRes.sessions || []);

      // If no docs selected, select all indexed docs by default
      if (selectedDocIds.length === 0 && docsRes.documents?.length > 0) {
        setSelectedDocIds(docsRes.documents.map((d: any) => d.id));
      }
    } catch (err) {
      console.error('Failed to load workspace documents or sessions:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [activeWorkspace]);

  // Load messages when session changes
  const selectSession = async (sessId: string) => {
    setActiveSessionId(sessId);
    try {
      const res = await api.synthesis.getSessionMessages(sessId);
      setInitialMessages(res.messages || []);
    } catch (err) {
      console.error('Failed to load session messages:', err);
    }
  };

  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGenerateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !reviewTopic.trim() || selectedDocIds.length === 0) return;

    setIsGeneratingReview(true);
    try {
      const res = await api.synthesis.generateReview({
        workspaceId: activeWorkspace.id,
        documentIds: selectedDocIds,
        researchQuestion: reviewTopic.trim(),
        depth: reviewDepth,
      });

      setGeneratedReview(res.reviewMarkdown);
    } catch (err: any) {
      console.error('Review generation failed:', err);
      alert(`Literature review generation failed: ${err.message}`);
    } finally {
      setIsGeneratingReview(false);
    }
  };

  const downloadReviewMarkdown = () => {
    if (!generatedReview) return;
    const blob = new Blob([generatedReview], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `literature_review_${Date.now()}.md`;
    a.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Bar with Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span>Multi-Document Synthesis Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-document grounded question answering, reasoning, and systematic literature review generation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Interactive Chat & RAG</span>
          </button>
          <button
            onClick={() => setActiveTab('lit_review')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'lit_review'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Literature Review Generator</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Document Corpus Selector & History */}
        <div className="lg:col-span-1 space-y-6">
          {/* Document Selector */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <ListFilter className="w-3.5 h-3.5 text-indigo-400" />
                <span>Target Corpus ({selectedDocIds.length}/{documents.length})</span>
              </span>
              <button
                onClick={() =>
                  setSelectedDocIds(
                    selectedDocIds.length === documents.length ? [] : documents.map((d) => d.id)
                  )
                }
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {selectedDocIds.length === documents.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {documents.length === 0 ? (
                <p className="text-[11px] text-slate-500 py-4 text-center">
                  No documents in this workspace yet.
                </p>
              ) : (
                documents.map((doc) => (
                  <label
                    key={doc.id}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedDocIds.includes(doc.id)
                        ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocIds.includes(doc.id)}
                      onChange={() => toggleSelectDoc(doc.id)}
                      className="mt-0.5 accent-indigo-500 rounded"
                    />
                    <div className="truncate">
                      <p className="font-medium truncate text-white leading-tight">{doc.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{doc.authors}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Session History */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Synthesis Sessions</span>
              </span>
              <button
                onClick={() => {
                  setActiveSessionId(undefined);
                  setInitialMessages([]);
                }}
                className="p-1 rounded-md bg-slate-800 text-indigo-300 hover:bg-slate-700 text-[11px] flex items-center gap-1"
                title="Start clean session"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {sessions.length === 0 ? (
                <p className="text-[11px] text-slate-500 py-3 text-center">
                  No prior sessions in this workspace.
                </p>
              ) : (
                sessions.map((sess) => (
                  <button
                    key={sess.id}
                    onClick={() => selectSession(sess.id)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                      activeSessionId === sess.id
                        ? 'bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span className="truncate pr-2">{sess.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {new Date(sess.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tab View */}
        <div className="lg:col-span-3">
          {activeTab === 'chat' ? (
            <ChatStreamBox
              workspaceId={activeWorkspace?.id || ''}
              selectedDocumentIds={selectedDocIds}
              initialMessages={initialMessages}
              sessionId={activeSessionId}
              onNewSession={(id) => {
                setActiveSessionId(id);
                loadWorkspaceData();
              }}
            />
          ) : (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-6">
              {/* Review Generator Form */}
              <form onSubmit={handleGenerateReview} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Synthesize Systematic Literature Review
                    </h3>
                    <p className="text-xs text-slate-400">
                      Generates a formal, publication-ready literature review structured across all selected papers.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Gemini 2.5 Pro Model
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Systematic Review Topic / Research Question
                  </label>
                  <input
                    type="text"
                    value={reviewTopic}
                    onChange={(e) => setReviewTopic(e.target.value)}
                    placeholder="e.g. Critical comparative analysis of early-detection deep learning algorithms vs standard radiologist triaging in pancreatic neoplasms"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                    required
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400">Review Depth:</span>
                    <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                      {(['executive', 'critical', 'exhaustive'] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setReviewDepth(d)}
                          className={`px-3 py-1 rounded-md capitalize text-xs font-medium transition-colors ${
                            reviewDepth === d
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isGeneratingReview || !reviewTopic.trim() || selectedDocIds.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                  >
                    {isGeneratingReview ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Synthesizing Literature Review...</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4" />
                        <span>Generate Systematic Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Generated Review Output Area */}
              {generatedReview ? (
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4" />
                      Publication Review Generated
                    </span>
                    <button
                      onClick={downloadReviewMarkdown}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Markdown (.md)</span>
                    </button>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 prose prose-invert prose-xs max-w-none font-sans leading-relaxed whitespace-pre-wrap select-text max-h-[60vh] overflow-y-auto">
                    {generatedReview}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
