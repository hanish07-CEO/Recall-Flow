'use client';

import React from 'react';
import { CheckSquare, Calendar, User, AlertCircle, ArrowRight, Sparkles, Clock, CheckCircle, Database } from 'lucide-react';
import { ActionItemRecord } from '@/lib/models/actionItem';

interface ActionItemsKanbanProps {
  actionItems: ActionItemRecord[];
  onStatusChange: (id: string, newStatus: ActionItemRecord['status']) => void;
}

export const ActionItemsKanban: React.FC<ActionItemsKanbanProps> = ({
  actionItems,
  onStatusChange,
}) => {
  const changesCount = actionItems.filter((i) => !!i.changeDetected).length;
  const openCount = actionItems.filter((i) => i.status !== 'completed').length;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800">Urgent</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">High Priority</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-950 text-sky-300 border border-sky-800">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">Low</span>;
    }
  };

  return (
    <div className="space-y-6 overflow-y-auto scrollbar-transparent">
      {/* Top Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Commitments</span>
            <CheckSquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{actionItems.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Extracted from spoken voice transcripts</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Open / In Progress</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-300">{openCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Active sprint deliverables</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Timeline Shifts Detected</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">{changesCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Cross-referenced against sprint history</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Vector Memory Store</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 truncate font-mono mt-1">recallflow_action_items</div>
          <p className="text-[11px] text-slate-500 mt-1">Indexed in Qdrant repository</p>
        </div>
      </div>

      {/* Main Action Items List Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-950/80 border border-indigo-800 text-indigo-400">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Action Items & Historical Timeline Delta
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically extracted from voice transcripts by Lyzr Action Agent and compared against Qdrant memory.
              </p>
            </div>
          </div>
        </div>

        {actionItems.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No action items recorded yet. Use the Voice Stream tab to ingest transcripts.
          </div>
        ) : (
          <div className="space-y-4">
            {actionItems.map((item) => {
              const hasChange = !!item.changeDetected;

              return (
                <div
                  key={item.id}
                  className={`p-6 rounded-2xl border transition-all ${
                    hasChange
                      ? 'bg-amber-950/15 border-amber-800/80 shadow-xl shadow-amber-950/20 ring-1 ring-amber-500/30'
                      : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          onStatusChange(
                            item.id,
                            item.status === 'completed' ? 'open' : 'completed'
                          )
                        }
                        className="mt-1 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                        title="Toggle task completion"
                      >
                        {item.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <div className="w-5 h-5 rounded-md border-2 border-slate-600 hover:border-emerald-400" />
                        )}
                      </button>
                      <div>
                        <h4
                          className={`text-base font-bold text-white ${
                            item.status === 'completed' ? 'line-through text-slate-500' : ''
                          }`}
                        >
                          {item.task}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 italic border-l-2 border-slate-700 pl-3">
                          &ldquo;{item.contextSnippet}&rdquo;
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {getPriorityBadge(item.priority)}
                      <select
                        value={item.status}
                        onChange={(e) =>
                          onStatusChange(item.id, e.target.value as ActionItemRecord['status'])
                        }
                        className="bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-sky-400" />
                      <span>Owner:</span>
                      <strong className="text-slate-200 font-semibold">{item.owner}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      <span>Due Date:</span>
                      <strong className="text-slate-200 font-semibold">
                        {/^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)
                          ? new Date(`${item.dueDate}T00:00:00Z`).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              timeZone: 'UTC',
                            })
                          : item.dueDate}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-auto">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Updated: {new Date(item.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Historical Change Delta Banner */}
                  {hasChange && (
                    <div className="mt-4 p-3.5 rounded-xl bg-amber-950/40 border border-amber-700/80 text-xs text-amber-200 flex items-start gap-3 animate-fadeIn">
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                          <span>⚡ Historical Timeline Delta Detected by Lyzr Change Agent</span>
                        </div>
                        <div className="text-xs text-amber-200/90 mt-1 flex flex-wrap items-center gap-2">
                          <span>Previous Deadline:</span>
                          <span className="line-through text-slate-400 font-medium">
                            {item.changeDetected?.oldValue || 'Thursday, Oct 8'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-bold text-amber-300">
                            {item.changeDetected?.newValue || 'Friday, Oct 9, 2026'}
                          </span>
                          <span className="text-amber-400/90">({item.changeDetected?.reason})</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
