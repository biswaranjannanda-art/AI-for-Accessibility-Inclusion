import React, { useState, useRef } from 'react';
import { useWorkspace } from '../context/WorkspaceContext.tsx';
import { api } from '../services/api.ts';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCode,
} from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const { activeWorkspace, refreshWorkspaces } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [publicationDate, setPublicationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ chunksCount: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    // Validate size (25MB)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 25MB enterprise ingestion threshold.');
      return;
    }
    setSelectedFile(file);
    setErrorMessage('');
    // Auto-populate title from filename
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !activeWorkspace) return;

    setIsUploading(true);
    setUploadProgress(20);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (title) formData.append('title', title);
      if (authors) formData.append('authors', authors);
      if (publicationDate) formData.append('publicationDate', publicationDate);

      setUploadProgress(50);
      const res = await api.workspaces.uploadDocument(activeWorkspace.id, formData);
      setUploadProgress(100);

      setSuccessInfo({ chunksCount: res.chunksIndexed || 1 });
      await refreshWorkspaces();
      if (onUploadSuccess) onUploadSuccess();

      // Reset after a brief moment
      setTimeout(() => {
        setIsUploading(false);
        onClose();
        setSelectedFile(null);
        setTitle('');
        setAuthors('');
        setSuccessInfo(null);
      }, 1500);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'Ingestion failed during text extraction or vector computation.');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <UploadCloud className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Ingest Research Document</h3>
              <p className="text-[11px] text-slate-400">
                Workspace: <span className="text-indigo-300 font-medium">{activeWorkspace?.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-2 text-emerald-400">
                <FileText className="w-8 h-8 text-emerald-400" />
                <p className="text-xs font-semibold text-white">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Document'}
                </p>
                <span className="text-[10px] text-emerald-400/80">Click or drag another file to replace</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <UploadCloud className="w-9 h-9 text-indigo-400/80 mb-1" />
                <p className="text-xs font-medium text-slate-200">
                  Drag and drop research document here, or <span className="text-indigo-400">browse</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Supported formats: PDF, DOCX, TXT, Markdown (Max 25MB)
                </p>
              </div>
            )}
          </div>

          {/* Metadata Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Document / Paper Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep Attention Networks for Clinical CT Imaging"
                className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Authors / Working Group
                </label>
                <input
                  type="text"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="e.g. Vance, E., Zhang, K., et al."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Publication Date
                </label>
                <input
                  type="date"
                  value={publicationDate}
                  onChange={(e) => setPublicationDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Progress / Status Alerts */}
          {isUploading && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-2">
              <div className="flex items-center justify-between text-indigo-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating 768-dim vector embeddings & indexing...
                </span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {successInfo && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Document successfully ingested! Generated and indexed {successInfo.chunksCount} semantic vector passages.
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processing Vectors...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  Ingest & Index
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
