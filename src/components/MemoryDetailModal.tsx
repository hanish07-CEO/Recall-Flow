import React from 'react';
import { Database, Shield, X } from 'lucide-react';
import { MemoryRecord } from '../types/recallflow';

interface MemoryDetailModalProps {
  memory: MemoryRecord | null;
  onClose: () => void;
}

export const MemoryDetailModal: React.FC<MemoryDetailModalProps> = ({ memory, onClose }) => {
  if (!memory) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="memory-modal-title"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-teal-400">
              <Database className="h-3.5 w-3.5" />
              <span>Qdrant Vector Memory Payload</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{memory.memoryId}</span>
            </div>
            <h3 id="memory-modal-title" className="mt-1 text-lg font-semibold text-slate-100">
              {memory.sessionName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close memory details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-4">
            <div className="text-xs font-medium text-slate-400">Voice Transcript Content</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-100">“{memory.text}”</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
              <div className="text-slate-400">Memory ID</div>
              <div className="mt-1 font-mono font-medium text-slate-200">{memory.memoryId}</div>
            </div>
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
              <div className="text-slate-400">Session ID</div>
              <div className="mt-1 font-mono font-medium text-slate-200">{memory.sessionId}</div>
            </div>
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
              <div className="text-slate-400">Source</div>
              <div className="mt-1 font-medium text-indigo-300">{memory.source}</div>
            </div>
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
              <div className="text-slate-400">Storage State</div>
              <div
                className={`mt-1 font-medium ${
                  memory.storageState === 'Stored in Qdrant'
                    ? 'text-teal-400'
                    : 'text-amber-400'
                }`}
              >
                {memory.storageState}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
              <div className="text-slate-400">Privacy Scope</div>
              <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-200">
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span>{memory.privacyScope}</span>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
              <div className="text-slate-400">Retention Policy</div>
              <div className="mt-1 font-medium text-slate-200">{memory.retentionPolicy}</div>
            </div>
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
              <div className="text-slate-400">Timestamp</div>
              <div className="mt-1 font-mono text-slate-200">
                {memory.timestamp.replace('T', ' ').slice(0, 16)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
              <div className="text-slate-400">Qdrant Collection</div>
              <div className="mt-1 font-mono text-teal-300">
                {memory.qdrantCollection || 'None (Transient)'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-slate-300">Tags:</span>
            <span>{memory.tags.join(' · ')}</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
