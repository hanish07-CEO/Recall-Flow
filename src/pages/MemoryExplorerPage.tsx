import React, { useState } from 'react';
import {
  Database,
  Search,
  Shield,
  Trash2,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { useRecallFlow } from '../context/RecallFlowContext';
import { computeSemanticRelevance } from '../services/recallflowEngine';
import { MemoryRecord } from '../types/recallflow';

type ExplorerFilter =
  | 'all'
  | 'private'
  | 'workspace'
  | 'omi'
  | 'api_review'
  | 'this_week';

export const MemoryExplorerPage: React.FC = () => {
  const {
    memories,
    transientAuditLog,
    deleteMemoryRecord,
    setInspectedMemoryId,
  } = useRecallFlow();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ExplorerFilter>('all');
  const [memoryToDelete, setMemoryToDelete] = useState<MemoryRecord | null>(null);
  const [showTransientAudit, setShowTransientAudit] = useState(true);

  const FILTER_TABS: { id: ExplorerFilter; label: string }[] = [
    { id: 'all', label: 'All memories' },
    { id: 'private', label: 'Private' },
    { id: 'workspace', label: 'Workspace' },
    { id: 'omi', label: 'Omi source' },
    { id: 'api_review', label: 'API review tag' },
    { id: 'this_week', label: 'This week' },
  ];

  // Filter persistent memories (Do Not Retain is never in persistent memories)
  const filteredMemories = memories
    .filter((mem) => {
      if (mem.privacyScope === 'Do Not Retain' || mem.storageState !== 'Stored in Qdrant') {
        return false;
      }
      if (activeFilter === 'private' && mem.privacyScope !== 'Private') return false;
      if (activeFilter === 'workspace' && mem.privacyScope !== 'Workspace') return false;
      if (activeFilter === 'omi' && mem.source !== 'Omi') return false;
      if (
        activeFilter === 'api_review' &&
        !mem.tags.some((t) => t.toLowerCase() === 'api review')
      ) {
        return false;
      }
      if (activeFilter === 'this_week' && mem.timestamp < '2026-10-01') return false;
      return true;
    })
    .map((mem) => ({
      memory: mem,
      relevance: computeSemanticRelevance(mem, searchQuery),
    }))
    .filter((item) => (searchQuery.trim() ? item.relevance > 0 : true))
    .sort((a, b) => (searchQuery.trim() ? b.relevance - a.relevance : 0));

  const handleConfirmDelete = async () => {
    if (!memoryToDelete) return;
    await deleteMemoryRecord(memoryToDelete.memoryId);
    setMemoryToDelete(null);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs text-teal-400">
            <Database className="h-3.5 w-3.5" />
            <span>Qdrant Collection: recallflow_memories · 1536-d Vector Index</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Memory explorer
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Inspect semantic vector memories, retention durations, and Qdrant payload metadata
          </p>
        </div>
      </div>

      {/* Server-Side Privacy Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-500/30 bg-indigo-950/15 p-4 text-xs text-slate-200">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
        <div>
          <strong className="text-white">
            Server-side privacy filtering controls memory retrieval:
          </strong>{' '}
          RecallFlow enforces user, workspace, privacy scope, and retention policy filters at the Qdrant payload query layer before returning vector embeddings to Lyzr agents. “Do Not Retain” notes are never embedded or persisted.
        </div>
      </div>

      {/* Semantic Search Bar & Filter Tabs */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Semantic vector search across Qdrant memories (e.g., 'Qdrant costs', 'Priya caching Thursday', 'personal spending')..."
            aria-label="Semantic search bar"
            className="w-full rounded-lg border border-slate-700 bg-[#0B0F19] py-2.5 pr-4 pl-11 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-[#0B0F19] p-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeFilter === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-mono tabular-nums">
            Showing {filteredMemories.length} stored vector record(s)
          </div>
        </div>
      </section>

      {/* Memory Cards Grid */}
      {filteredMemories.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-8 text-center">
          <p className="text-sm font-medium text-slate-300">
            No stored vector memories match your current semantic search or filter criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('all');
            }}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Clear Search & Filters
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredMemories.map(({ memory, relevance }) => (
            <article
              key={memory.memoryId}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4"
            >
              <div className="space-y-3">
                {/* Top Header: Session & Vector Storage State */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono text-indigo-300">{memory.memoryId}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{memory.sessionId}</span>
                    </div>
                    <h2 className="mt-1 text-base font-semibold text-white">
                      {memory.sessionName}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {searchQuery.trim() && (
                      <span className="font-mono tabular-nums font-semibold text-indigo-300">
                        Relevance: {(relevance * 100).toFixed(0)}% ({relevance.toFixed(2)})
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-medium text-teal-400">
                      <Database className="h-3.5 w-3.5" />
                      <span>Qdrant vector-stored</span>
                    </span>
                  </div>
                </div>

                {/* Transcript Snippet */}
                <p className="rounded-lg border border-slate-800/90 bg-[#0B0F19] p-3.5 text-sm leading-relaxed text-slate-200">
                  “{memory.text}”
                </p>

                {/* Mandatory Metadata Fields */}
                <div className="grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-800/80 bg-[#0B0F19] p-2.5">
                    <div className="text-slate-400">Source</div>
                    <div className="mt-0.5 font-medium text-indigo-300">
                      {memory.source}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-800/80 bg-[#0B0F19] p-2.5">
                    <div className="text-slate-400">Timestamp</div>
                    <div className="mt-0.5 font-mono tabular-nums text-slate-200">
                      {memory.timestamp.replace('T', ' ').slice(0, 16)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-800/80 bg-[#0B0F19] p-2.5">
                    <div className="text-slate-400">Privacy Scope</div>
                    <div
                      className={`mt-0.5 font-medium ${
                        memory.privacyScope === 'Private'
                          ? 'text-amber-300'
                          : 'text-teal-300'
                      }`}
                    >
                      {memory.privacyScope}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-800/80 bg-[#0B0F19] p-2.5">
                    <div className="text-slate-400">Retention Policy</div>
                    <div className="mt-0.5 font-medium text-slate-200">
                      {memory.retentionPolicy}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-800/80 bg-[#0B0F19] p-2.5 sm:col-span-2">
                    <div className="text-slate-400">Storage State</div>
                    <div className="mt-0.5 font-medium text-teal-400">
                      {memory.storageState} ({memory.qdrantCollection || 'recallflow_memories'})
                    </div>
                  </div>
                </div>

                {/* Unboxed Tags */}
                <div className="text-xs text-slate-400">
                  <span className="font-medium text-slate-300">Tags: </span>
                  <span>{memory.tags.join(' · ')}</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-3.5 text-xs">
                <button
                  type="button"
                  onClick={() => setInspectedMemoryId(memory.memoryId)}
                  className="font-medium text-indigo-400 hover:underline"
                >
                  Inspect Qdrant Vector Payload →
                </button>
                <button
                  type="button"
                  onClick={() => setMemoryToDelete(memory)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-medium text-red-300 transition-colors hover:bg-red-500/20 whitespace-nowrap"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Non-Persistent / Do Not Retain Audit Log Section (Shows Seeded Memory 4 Proof) */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-amber-300">
              Do Not Retain Policy Audit Log (Never Persisted to Qdrant)
            </h2>
            <p className="text-xs text-slate-400">
              Verification log demonstrating that voice notes with Privacy = “Do Not Retain” have Storage state = “Not stored” and are excluded from vector memory and search
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTransientAudit(!showTransientAudit)}
            className="text-xs font-medium text-indigo-400 hover:underline"
          >
            {showTransientAudit ? 'Hide audit log' : 'Show audit log'}
          </button>
        </div>

        {showTransientAudit && (
          <div className="mt-4 space-y-3">
            {transientAuditLog.map((rec) => (
              <div
                key={rec.memoryId}
                className="rounded-lg border border-amber-500/30 bg-[#0B0F19] p-4 text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-white">
                    {rec.sessionName} ({rec.memoryId})
                  </span>
                  <span className="font-semibold text-amber-400">
                    Storage state: {rec.storageState}
                  </span>
                </div>
                <p className="text-slate-300">“{rec.text}”</p>
                <div className="flex flex-wrap items-center gap-2 text-slate-400">
                  <span>Session ID: {rec.sessionId}</span>
                  <span aria-hidden="true">·</span>
                  <span>Source: {rec.source}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{rec.timestamp}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-300">Privacy: {rec.privacyScope}</span>
                  <span aria-hidden="true">·</span>
                  <span>Retention: {rec.retentionPolicy}</span>
                  <span aria-hidden="true">·</span>
                  <span>Tags: {rec.tags.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(memoryToDelete)}
        title="Delete Qdrant Memory Record?"
        description={
          memoryToDelete
            ? `Are you sure you want to permanently delete memory "${memoryToDelete.memoryId}" from session "${memoryToDelete.sessionName}"?`
            : ''
        }
        warningDetail="Deleting this memory removes its vector point from Qdrant recallflow_memories, updates the dashboard memory counter, and excludes it from all future Ask Memory queries."
        confirmLabel="Delete Memory Record"
        onConfirm={handleConfirmDelete}
        onCancel={() => setMemoryToDelete(null)}
      />
    </div>
  );
};
