import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Download,
  BookOpen,
  Sliders,
  ExternalLink,
  ChevronDown,
  Info,
} from 'lucide-react';
import { getStoredToken } from '../services/api.ts';

export interface Citation {
  index: number;
  documentId: string;
  documentTitle: string;
  authors?: string;
  publicationDate?: string;
  chunkIndex: number;
  snippet: string;
  similarity?: number;
}

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  created_at?: string;
}

interface ChatStreamBoxProps {
  workspaceId: string;
  selectedDocumentIds: string[];
  initialMessages?: ChatMessageItem[];
  sessionId?: string;
  onNewSession?: (id: string) => void;
}

export const ChatStreamBox: React.FC<ChatStreamBoxProps> = ({
  workspaceId,
  selectedDocumentIds,
  initialMessages = [],
  sessionId,
  onNewSession,
}) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [temperature, setTemperature] = useState(0.2);
  const [citationFormat, setCitationFormat] = useState<'superscript' | 'apa' | 'ieee'>('superscript');
  const [synthesisDepth, setSynthesisDepth] = useState<'executive' | 'critical' | 'exhaustive'>('critical');
  const [activeCitationPopover, setActiveCitationPopover] = useState<Citation | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isStreaming) return;

    const userText = inputPrompt.trim();
    setInputPrompt('');

    // Append user message immediately
    const userMsg: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: userText,
      citations: [],
    };

    // Prepare placeholder assistant message
    const assistantMsgId = `asst-${Date.now()}`;
    const placeholderAssistant: ChatMessageItem = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      citations: [],
    };

    setMessages((prev) => [...prev, userMsg, placeholderAssistant]);
    setIsStreaming(true);

    try {
      const token = getStoredToken();
      const response = await fetch('/api/v1/synthesis/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          workspaceId,
          documentIds: selectedDocumentIds,
          prompt: userText,
          temperature,
          sessionId,
          citationFormat,
          synthesisDepth,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to establish SSE stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));

              if (eventData.type === 'metadata') {
                if (eventData.sessionId && onNewSession) {
                  onNewSession(eventData.sessionId);
                }
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, citations: eventData.citations }
                      : m
                  )
                );
              } else if (eventData.type === 'token') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content + eventData.text }
                      : m
                  )
                );
              } else if (eventData.type === 'done') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, id: eventData.messageId || m.id, content: eventData.fullText || m.content }
                      : m
                  )
                );
              }
            } catch (pErr) {
              // ignore parse errors on partial chunks
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Streaming failed:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: m.content + `\n\n*[Synthesis error: ${err.message}]*` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const copyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportChatMarkdown = () => {
    const md = messages
      .map((m) => `### ${m.sender === 'user' ? 'Researcher Query' : 'ResearchPulse Synthesis'}\n\n${m.content}\n\n${m.citations?.length ? `**Sources Cited:**\n` + m.citations.map((c, i) => `${i + 1}. ${c.documentTitle} (Chunk #${c.chunkIndex})`).join('\n') : ''}`)
      .join('\n\n---\n\n');

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research_synthesis_${Date.now()}.md`;
    a.click();
  };

  return (
    <div className="flex flex-col h-[78vh] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
      {/* Controls Bar */}
      <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-white">Multi-Doc Synthesis Studio</span>
          </div>

          <span className="text-slate-500">|</span>

          {/* Citation Format Picker */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Citations:</span>
            <select
              value={citationFormat}
              onChange={(e) => setCitationFormat(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-md px-2 py-0.5 text-slate-200 text-xs focus:outline-none"
            >
              <option value="superscript">Inline [1]</option>
              <option value="apa">APA 7th</option>
              <option value="ieee">IEEE Numeric</option>
            </select>
          </div>

          {/* Depth Picker */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Depth:</span>
            <select
              value={synthesisDepth}
              onChange={(e) => setSynthesisDepth(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-md px-2 py-0.5 text-slate-200 text-xs focus:outline-none"
            >
              <option value="executive">Executive</option>
              <option value="critical">Critical</option>
              <option value="exhaustive">Exhaustive</option>
            </select>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Temp:</span>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-16 accent-indigo-500 cursor-pointer"
            />
            <span className="font-mono text-indigo-300">{temperature.toFixed(1)}</span>
          </div>

          <button
            onClick={exportChatMarkdown}
            disabled={messages.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Export Synthesis Session as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export MD</span>
          </button>
        </div>
      </div>

      {/* Messages Stream Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white">Evidence-Based Research Synthesis</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask deep comparative questions across your indexed research papers. Answers are strictly grounded in semantic vector passages with direct source citations.
            </p>
            <div className="pt-2 text-left w-full space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Try asking:
              </p>
              <button
                onClick={() => {
                  setInputPrompt('What are the primary clinical trial outcomes and diagnostic thresholds in the oncology study?');
                }}
                className="w-full text-left text-xs p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
              >
                "What are the primary clinical trial outcomes and diagnostic thresholds in the oncology study?"
              </button>
              <button
                onClick={() => {
                  setInputPrompt('Synthesize the comparative advantages of hybrid vector retrieval vs pure dense embeddings.');
                }}
                className="w-full text-left text-xs p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
              >
                "Synthesize the comparative advantages of hybrid vector retrieval vs pure dense embeddings."
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/30">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-2xl p-5 space-y-3 select-text ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 shadow-xl'
                }`}
              >
                {/* Content */}
                <div className="prose prose-invert prose-xs text-xs leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.content || (
                    <span className="flex items-center gap-2 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                      Retrieving dense vector chunks and reasoning...
                    </span>
                  )}
                </div>

                {/* Citations section */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-indigo-400" />
                      Grounded Source References ({msg.citations.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveCitationPopover(c)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-indigo-500/50 text-[11px] text-slate-300 hover:text-indigo-200 flex items-center gap-1.5 transition-all text-left"
                        >
                          <span className="font-mono text-indigo-400 font-semibold">[{c.index || i + 1}]</span>
                          <span className="truncate max-w-[180px]">{c.documentTitle}</span>
                          <span className="text-slate-500 font-mono text-[10px]">#{c.chunkIndex}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copy actions for assistant */}
                {msg.sender === 'assistant' && msg.content && (
                  <div className="pt-1 flex items-center justify-end gap-2 text-[11px] text-slate-500">
                    <button
                      onClick={() => copyMessage(msg.content, msg.id)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Answer</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Citation Popover Modal */}
      {activeCitationPopover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-3">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Source Reference [{activeCitationPopover.index}]
                </span>
                <h4 className="text-sm font-semibold text-white mt-1.5 leading-snug">
                  {activeCitationPopover.documentTitle}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chunk #{activeCitationPopover.chunkIndex}
                  {activeCitationPopover.similarity && ` • Similarity: ${(activeCitationPopover.similarity * 100).toFixed(1)}%`}
                </p>
              </div>
              <button
                onClick={() => setActiveCitationPopover(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans select-text">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Extracted Grounding Context:
              </p>
              {activeCitationPopover.snippet}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveCitationPopover(null)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/90">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isStreaming}
            placeholder={
              selectedDocumentIds.length > 0
                ? `Ask questions across ${selectedDocumentIds.length} selected papers...`
                : 'Ask questions across all papers in workspace...'
            }
            className="w-full pl-4 pr-24 py-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
          />
          <button
            type="submit"
            disabled={isStreaming || !inputPrompt.trim()}
            className="absolute right-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            {isStreaming ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Synthesize</span>
                <Send className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
          Powered by Gemini 2.5 Flash streaming RAG. Strict academic attribution enforced.
        </p>
      </form>
    </div>
  );
};
