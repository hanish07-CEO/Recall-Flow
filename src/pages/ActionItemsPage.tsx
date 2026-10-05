import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  Search,
} from 'lucide-react';
import { useRecallFlow } from '../context/RecallFlowContext';
import { getActionUrgency } from '../services/recallflowEngine';
import { ActionStatus } from '../types/recallflow';

export const ActionItemsPage: React.FC = () => {
  const {
    actionItems,
    updateActionStatus,
    setInspectedMemoryId,
    workspaceContext,
  } = useRecallFlow();

  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState('all');
  const [privacyFilter, setPrivacyFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'both' | 'table' | 'cards'>('both');

  const filteredItems = actionItems.filter((item) => {
    if (
      workspaceContext === 'Engineering Workspace' &&
      item.privacyScope === 'Private'
    ) {
      return false;
    }

    if (
      searchTerm.trim() &&
      !`${item.task} ${item.owner} ${item.relatedSession}`
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase())
    ) {
      return false;
    }

    if (ownerFilter !== 'all' && item.owner !== ownerFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
    if (privacyFilter !== 'all' && item.privacyScope !== privacyFilter) return false;

    const urgency = getActionUrgency(item.dueDate, item.status);
    if (dueDateFilter === 'due_soon' && urgency !== 'Due soon') return false;
    if (dueDateFilter === 'upcoming' && urgency !== 'Upcoming') return false;
    if (dueDateFilter === 'friday_oct09' && item.dueDate !== '2026-10-09') {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs text-teal-400">
            <Database className="h-3.5 w-3.5" />
            <span>Qdrant Collection: recallflow_action_items · Lyzr Action Extraction</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Action items
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Searchable tasks, owners, deadlines, and historical deadline changes linked to voice-memory evidence
          </p>
        </div>

        {/* View Mode Segmented Control */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-[#111827] p-1">
          {(['both', 'table', 'cards'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                viewMode === mode
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode === 'both' ? 'Table + Detail Cards' : `${mode} View`}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Multi-Facet Filter Bar */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action items by task, owner (Priya, Alex), or session..."
            aria-label="Search action items"
            className="w-full rounded-lg border border-slate-700 bg-[#0B0F19] py-2.5 pr-4 pl-10 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label
              htmlFor="action-filter-owner"
              className="block text-[11px] font-medium text-slate-400"
            >
              Owner
            </label>
            <select
              id="action-filter-owner"
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">All owners</option>
              <option value="Priya">Priya</option>
              <option value="Alex">Alex</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="action-filter-status"
              className="block text-[11px] font-medium text-slate-400"
            >
              Status
            </label>
            <select
              id="action-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">All statuses</option>
              <option value="Open">Open</option>
              <option value="In progress">In progress</option>
              <option value="Completed">Completed</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="action-filter-priority"
              className="block text-[11px] font-medium text-slate-400"
            >
              Priority
            </label>
            <select
              id="action-filter-priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">All priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="action-filter-duedate"
              className="block text-[11px] font-medium text-slate-400"
            >
              Due Date / Urgency
            </label>
            <select
              id="action-filter-duedate"
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">All due dates</option>
              <option value="due_soon">Due soon</option>
              <option value="friday_oct09">Friday, Oct 9, 2026</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="action-filter-privacy"
              className="block text-[11px] font-medium text-slate-400"
            >
              Privacy Scope
            </label>
            <select
              id="action-filter-privacy"
              value={privacyFilter}
              onChange={(e) => setPrivacyFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">All scopes</option>
              <option value="Workspace">Workspace</option>
              <option value="Private">Private</option>
            </select>
          </div>
        </div>
      </section>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-8 text-center">
          <p className="text-sm font-medium text-slate-300">
            No action items match the selected filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setOwnerFilter('all');
              setStatusFilter('all');
              setPriorityFilter('all');
              setDueDateFilter('all');
              setPrivacyFilter('all');
            }}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* High-Density Data Table */}
          {(viewMode === 'both' || viewMode === 'table') && (
            <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#111827]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0B0F19] text-slate-400">
                      <th className="px-4 py-3 font-medium">Task</th>
                      <th className="px-4 py-3 font-medium">Owner</th>
                      <th className="px-4 py-3 font-medium">Due Date</th>
                      <th className="px-4 py-3 font-medium">Urgency</th>
                      <th className="px-4 py-3 font-medium">Priority</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Related Session</th>
                      <th className="px-4 py-3 font-medium">Evidence Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredItems.map((item) => {
                      const urgency = getActionUrgency(item.dueDate, item.status);
                      return (
                        <tr
                          key={item.actionItemId}
                          className="transition-colors hover:bg-slate-800/30"
                        >
                          <td className="px-4 py-3.5 font-medium text-white">
                            <div>{item.task}</div>
                            {item.changeHistory.length > 0 && (
                              <div className="mt-1 text-[11px] text-amber-300">
                                {item.changeHistory[0].activityNote}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-slate-200">{item.owner}</td>
                          <td className="px-4 py-3.5 font-mono tabular-nums text-slate-200">
                            <div>{item.dueDate}</div>
                            <div className="text-[11px] text-slate-400">
                              {item.dueDateDisplay}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 font-medium ${
                                urgency === 'Overdue'
                                  ? 'text-red-400'
                                  : urgency === 'Due soon'
                                    ? 'text-amber-300'
                                    : 'text-teal-400'
                              }`}
                            >
                              {urgency === 'Overdue' ? (
                                <AlertTriangle className="h-3.5 w-3.5" />
                              ) : urgency === 'Due soon' ? (
                                <Clock className="h-3.5 w-3.5" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              <span>{urgency}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-300">{item.priority}</td>
                          <td className="px-4 py-3.5">
                            <select
                              aria-label={`Change status for ${item.task}`}
                              value={item.status}
                              onChange={(e) =>
                                updateActionStatus(
                                  item.actionItemId,
                                  e.target.value as ActionStatus
                                )
                              }
                              className="rounded-md border border-slate-700 bg-[#0B0F19] px-2.5 py-1 text-xs font-medium text-slate-100 focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="Open">Open</option>
                              <option value="In progress">In progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Blocked">Blocked</option>
                            </select>
                          </td>
                          <td className="px-4 py-3.5 text-slate-300">
                            {item.relatedSession}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-2">
                              {item.relatedMemoryIds.map((memId) => (
                                <button
                                  key={memId}
                                  type="button"
                                  onClick={() => setInspectedMemoryId(memId)}
                                  className="font-mono text-[11px] text-indigo-400 hover:underline"
                                >
                                  {memId}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Detailed Action Cards with Change History & Linked Memory Records */}
          {(viewMode === 'both' || viewMode === 'cards') && (
            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {filteredItems.map((item) => {
                const urgency = getActionUrgency(item.dueDate, item.status);
                return (
                  <div
                    key={item.actionItemId}
                    className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-xs text-slate-400">
                            Session: <strong className="text-slate-200">{item.relatedSession}</strong> · Scope: {item.privacyScope}
                          </div>
                          <h3 className="mt-1 text-base font-semibold text-white">
                            {item.task}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            aria-label={`Card status selector for ${item.task}`}
                            value={item.status}
                            onChange={(e) =>
                              updateActionStatus(
                                item.actionItemId,
                                e.target.value as ActionStatus
                              )
                            }
                            className="rounded-lg border border-slate-700 bg-[#0B0F19] px-3 py-1.5 text-xs font-medium text-white"
                          >
                            <option value="Open">Open</option>
                            <option value="In progress">In progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Blocked">Blocked</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                        <span>
                          Owner: <strong className="text-white">{item.owner}</strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Due date:{' '}
                          <strong className="font-mono tabular-nums text-teal-300">
                            {item.dueDate} ({item.dueDateDisplay})
                          </strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Priority: {item.priority}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            urgency === 'Overdue'
                              ? 'text-red-400 font-semibold'
                              : urgency === 'Due soon'
                                ? 'text-amber-300 font-semibold'
                                : 'text-teal-400'
                          }
                        >
                          {urgency}
                        </span>
                      </div>

                      {/* Deadline Change Activity Note */}
                      {item.changeHistory.map((chg) => (
                        <div
                          key={chg.changeId}
                          className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-3.5 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-amber-300">
                              {chg.activityNote}
                            </span>
                            <span className="text-amber-200/80">{chg.summary}</span>
                          </div>
                          <div className="text-xs text-slate-300">
                            Memory 1 due date:{' '}
                            <span className="font-mono text-slate-200">2026-10-01</span> →
                            Memory 2 due date:{' '}
                            <span className="font-mono text-teal-300">2026-10-09</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                            <span className="text-slate-400">
                              Linked supporting voice memories:
                            </span>
                            {chg.supportingMemoryIds.map((memId) => (
                              <button
                                key={memId}
                                type="button"
                                onClick={() => setInspectedMemoryId(memId)}
                                className="inline-flex items-center gap-1 font-mono text-indigo-400 hover:underline"
                              >
                                <span>{memId}</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Supporting Evidence Snippets */}
                      <div className="space-y-2 border-t border-slate-800 pt-3">
                        <div className="text-xs font-medium text-slate-400">
                          Supporting Voice-Memory Evidence:
                        </div>
                        {item.evidence.map((ev) => (
                          <div
                            key={`${item.actionItemId}_${ev.memoryId}`}
                            className="rounded-lg border border-slate-800 bg-[#0B0F19] p-3 text-xs"
                          >
                            <div className="flex items-center justify-between text-slate-400">
                              <span className="font-medium text-slate-200">
                                {ev.sessionName}
                              </span>
                              <button
                                type="button"
                                onClick={() => setInspectedMemoryId(ev.memoryId)}
                                className="font-mono text-[11px] text-indigo-400 hover:underline"
                              >
                                {ev.memoryId}
                              </button>
                            </div>
                            <p className="mt-1 text-slate-300">“{ev.quote}”</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </>
      )}
    </div>
  );
};
