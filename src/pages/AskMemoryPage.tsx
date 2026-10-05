import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Loader2,
  Search,
  Shield,
} from 'lucide-react';
import { AgentTracePanel } from '../components/AgentTracePanel';
import { useRecallFlow } from '../context/RecallFlowContext';
import {
   ActionStatus,
} from '../types/recallflow';

const SAMPLE_ASK_QUERIES = [
  'What did we decide about Qdrant costs?',
  'What do I need to do by Friday?',
  'What changed since the previous API review?',
  'Show unresolved API review tasks.',
  'What is my personal spending reminder?',
  'What was the temporary access code?',
];

export const AskMemoryPage: React.FC = () => {
  const {
    workspaceContext,
    activeQueryText,
    setActiveQueryText,
    queryFilters,
    setQueryFilters,
    isQuerying,
    queryResult,
    runQuery,
    settings,
    updateActionStatus,
    setInspectedMemoryId,
  } = useRecallFlow();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runQuery();
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400">
            <Shield className="h-3.5 w-3.5" />
            <span>POST /api/query · Evidence-Grounded Multi-Agent Retrieval</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Ask Memory
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Query persistent Qdrant vector memories with server-side privacy filtering and Lyzr citation verification
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Context: <strong className="text-slate-200">{workspaceContext}</strong>
        </div>
      </div>

      {/* Search Form & Filter Controls */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-5">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={activeQueryText}
              onChange={(e) => setActiveQueryText(e.target.value)}
              placeholder="Ask about decisions, tasks, deadlines, or changes across sessions..."
              aria-label="Ask Memory search query"
              className="w-full rounded-lg border border-slate-700 bg-[#0B0F19] py-3 pr-4 pl-11 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isQuerying}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60 whitespace-nowrap"
          >
            {isQuerying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </form>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 gap-3 border-t border-slate-800 pt-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label
              htmlFor="filter-date-range"
              className="block text-[11px] font-medium text-slate-400"
            >
              Date Range
            </label>
            <select
              id="filter-date-range"
              value={queryFilters.dateRange || 'all'}
              onChange={(e) =>
                setQueryFilters((prev) => ({
                  ...prev,
                  dateRange: e.target.value as any,
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">All dates</option>
              <option value="today">Today (Oct 5, 2026)</option>
              <option value="this_week">This week (Oct 1 – Oct 5)</option>
              <option value="october">October 2026</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-session"
              className="block text-[11px] font-medium text-slate-400"
            >
              Session
            </label>
            <select
              id="filter-session"
              value={queryFilters.sessionId || 'all'}
              onChange={(e) =>
                setQueryFilters((prev) => ({
                  ...prev,
                  sessionId: e.target.value,
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">All sessions</option>
              <option value="sess_api_review_oct05">API Review — October 5</option>
              <option value="sess_api_review_oct01">API Review — October 1</option>
              <option value="sess_personal_oct05">Personal planning</option>
              <option value="sess_omi_sync_oct04">Omi Ingestion Architecture Sync</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-tags"
              className="block text-[11px] font-medium text-slate-400"
            >
              Tags
            </label>
            <select
              id="filter-tags"
              value={queryFilters.tag || 'all'}
              onChange={(e) =>
                setQueryFilters((prev) => ({
                  ...prev,
                  tag: e.target.value,
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">All tags</option>
              <option value="API review">API review</option>
              <option value="Qdrant">Qdrant</option>
              <option value="costs">costs</option>
              <option value="caching">caching</option>
              <option value="deadline change">deadline change</option>
              <option value="Personal">Personal</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-privacy-scope"
              className="block text-[11px] font-medium text-slate-400"
            >
              Privacy Scope
            </label>
            <select
              id="filter-privacy-scope"
              value={queryFilters.privacyScope || 'Workspace'}
              onChange={(e) =>
                setQueryFilters((prev) => ({
                  ...prev,
                  privacyScope: e.target.value as any,
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-slate-200"
            >
              <option value="Workspace">Workspace only</option>
              <option value="Private">Private only</option>
              <option value="All Permitted">All context-permitted</option>
            </select>
          </div>

          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={Boolean(queryFilters.unresolvedOnly)}
                onChange={(e) =>
                  setQueryFilters((prev) => ({
                    ...prev,
                    unresolvedOnly: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-700 bg-[#0B0F19] text-indigo-600 focus:ring-indigo-500"
              />
              <span>Unresolved tasks only</span>
            </label>
          </div>
        </div>

        {/* Sample Questions Strip */}
        <div className="border-t border-slate-800 pt-3">
          <div className="text-[11px] font-medium text-slate-400">
            Deterministic test queries (click to run):
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {SAMPLE_ASK_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => runQuery(q)}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors whitespace-nowrap ${
                  activeQueryText === q
                    ? 'border-indigo-500 bg-indigo-600/20 text-indigo-200'
                    : 'border-slate-800 bg-[#0B0F19] text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Query Results Area */}
      {queryResult && (
        <div className="space-y-6">
          {/* Direct Answer Card */}
          <section className="rounded-xl border border-slate-800 bg-[#111827] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {queryResult.classification === 'Confirmed from memory' ? (
                  <span className="flex items-center gap-1.5 font-semibold text-teal-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirmed from memory</span>
                  </span>
                ) : queryResult.classification === 'Inferred from context' ? (
                  <span className="flex items-center gap-1.5 font-semibold text-indigo-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Inferred from context</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>No supporting memory found</span>
                  </span>
                )}
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="text-slate-400">
                  Query: “{queryResult.query}”
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">
                  Confidence score:{' '}
                  <strong className="font-mono tabular-nums text-teal-300">
                    {(queryResult.confidence * 100).toFixed(0)}% ({queryResult.confidence.toFixed(2)})
                  </strong>
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="text-slate-400">
                  Evidence records:{' '}
                  <strong className="font-mono tabular-nums text-slate-200">
                    {queryResult.evidence.length}
                  </strong>
                </span>
              </div>
            </div>

            {queryResult.classification === 'No supporting memory found' ? (
              <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-950/15 p-5">
                <h3 className="text-sm font-semibold text-amber-200">
                  Not enough evidence — No supporting memory found
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
                  {queryResult.answer}
                </p>
                <div className="mt-3 text-xs text-slate-400">
                  Privacy Policy Agent filtered {queryResult.privacyFilteredCount || 0} restricted or transient record(s) outside the current {workspaceContext} scope.
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-base leading-relaxed font-medium text-white">
                  {queryResult.answer}
                </p>
              </div>
            )}

            {/* Change Comparison Block (for "What changed since the previous API review?" & Friday query) */}
            {queryResult.changeComparison && (
              <div className="mt-5 rounded-lg border border-indigo-500/30 bg-[#0B0F19] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-indigo-300">
                    Temporal Context Comparison · {queryResult.changeComparison.itemTitle}
                  </span>
                  <span className="font-medium text-amber-300">
                    {queryResult.changeComparison.note}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs">
                    <div className="text-slate-400">
                      Previous Record ({queryResult.changeComparison.previousSession})
                    </div>
                    <div className="mt-1 font-medium text-slate-200">
                      {queryResult.changeComparison.previousValue}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-slate-500">
                      ID: {queryResult.changeComparison.previousMemoryId} ·{' '}
                      {queryResult.changeComparison.previousTimestamp.slice(0, 10)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-teal-500/30 bg-teal-950/15 p-3 text-xs">
                    <div className="text-teal-300">
                      Updated Record ({queryResult.changeComparison.updatedSession})
                    </div>
                    <div className="mt-1 font-medium text-white">
                      {queryResult.changeComparison.updatedValue}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-teal-400/80">
                      ID: {queryResult.changeComparison.updatedMemoryId} ·{' '}
                      {queryResult.changeComparison.updatedTimestamp.slice(0, 10)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Evidence Used Section */}
          {settings.showEvidenceWithAnswers && queryResult.evidence.length > 0 && (
            <section className="rounded-xl border border-slate-800 bg-[#111827] p-6">
              <h2 className="text-sm font-semibold text-white">Evidence used</h2>
              <p className="text-xs text-slate-400">
                Verified quotes, timestamps, and session identifiers grounding the Briefing Agent’s answer
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {queryResult.evidence.map((ev) => (
                  <div
                    key={ev.memoryId}
                    className="flex flex-col justify-between rounded-lg border border-slate-800 bg-[#0B0F19] p-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-slate-200">
                          {ev.sessionName}
                        </span>
                        <span className="font-mono tabular-nums">
                          {ev.timestamp.replace('T', ' ').slice(0, 16)}
                        </span>
                      </div>
                      <blockquote className="mt-2.5 border-l-2 border-indigo-500 pl-3 text-xs leading-relaxed text-slate-200">
                        “{ev.quote}”
                      </blockquote>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[11px] text-slate-400">
                      <span>
                        Memory ID: <strong className="font-mono text-slate-300">{ev.memoryId}</strong> · Scope: {ev.privacyScope}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInspectedMemoryId(ev.memoryId)}
                        className="inline-flex items-center gap-1 font-medium text-indigo-400 hover:underline"
                      >
                        <span>Inspect payload</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Retrieved Memory Cards & Related Action Items */}
          {queryResult.retrievedMemories.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Retrieved Memory Cards */}
              <section className="rounded-xl border border-slate-800 bg-[#111827] p-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Retrieved Qdrant Memory Cards ({queryResult.retrievedMemories.length})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Matched from collection recallflow_memories
                    </p>
                  </div>
                  <Database className="h-4 w-4 text-teal-400" />
                </div>

                <div className="mt-4 space-y-3">
                  {queryResult.retrievedMemories.map((mem) => (
                    <div
                      key={mem.memoryId}
                      className="rounded-lg border border-slate-800 bg-[#0B0F19] p-4 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-white">
                          {mem.sessionName}
                        </span>
                        <span className="font-mono tabular-nums text-teal-400">
                          Similarity: {(mem.relevanceScore ?? 0.95).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-300">
                        “{mem.text}”
                      </p>
                      <div className="grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-2.5 text-[11px] text-slate-400 sm:grid-cols-3">
                        <div>
                          Memory ID: <span className="font-mono text-slate-200">{mem.memoryId}</span>
                        </div>
                        <div>
                          Session ID: <span className="font-mono text-slate-200">{mem.sessionId}</span>
                        </div>
                        <div>
                          Source: <span className="text-indigo-300">{mem.source}</span>
                        </div>
                        <div>
                          Privacy: <span className="text-slate-200">{mem.privacyScope}</span>
                        </div>
                        <div>
                          Retention: <span className="text-slate-200">{mem.retentionPolicy}</span>
                        </div>
                        <div>
                          State: <span className="text-teal-400">{mem.storageState}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Tags: <span className="text-slate-300">{mem.tags.join(' · ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Related Action Items */}
              <section className="rounded-xl border border-slate-800 bg-[#111827] p-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Related Action Items ({queryResult.relatedActionItems.length})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Linked tasks in Qdrant collection recallflow_action_items
                    </p>
                  </div>
                </div>

                {queryResult.relatedActionItems.length === 0 ? (
                  <div className="mt-4 rounded-lg border border-slate-800 bg-[#0B0F19] p-5 text-xs text-slate-400">
                    No open or linked action items associated with this query.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {queryResult.relatedActionItems.map((item) => (
                      <div
                        key={item.actionItemId}
                        className="rounded-lg border border-slate-800 bg-[#0B0F19] p-4 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-semibold text-white">
                              {item.task}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              Owner: <strong className="text-slate-200">{item.owner}</strong> · Due:{' '}
                              <strong className="font-mono text-teal-300">
                                {item.dueDateDisplay} ({item.dueDate})
                              </strong>{' '}
                              · Priority: {item.priority}
                            </div>
                          </div>

                          <select
                            aria-label={`Update status for ${item.task}`}
                            value={item.status}
                            onChange={(e) =>
                              updateActionStatus(
                                item.actionItemId,
                                e.target.value as ActionStatus
                              )
                            }
                            className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200"
                          >
                            <option value="Open">Open</option>
                            <option value="In progress">In progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Blocked">Blocked</option>
                          </select>
                        </div>

                        {item.changeHistory.length > 0 && (
                          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">
                            {item.changeHistory[0].activityNote} ({item.changeHistory[0].summary})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Lyzr Agent Trace */}
          {settings.enableAgentTraces && (
            <AgentTracePanel
              traces={queryResult.agentTrace}
              title="Lyzr Query Execution Trace"
              subtitle="Step-by-step agent collaboration for query routing, privacy enforcement, Qdrant retrieval, and evidence verification"
            />
          )}
        </div>
      )}
    </div>
  );
};
