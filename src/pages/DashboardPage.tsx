import React, { useState } from 'react';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Database,
  Mic,
  Search,
  Shield,
  Workflow,
} from 'lucide-react';
import { AgentTracePanel } from '../components/AgentTracePanel';
import { useRecallFlow } from '../context/RecallFlowContext';
import { QUICK_DEMO_QUESTIONS } from '../data/seedData';
import { getActionUrgency } from '../services/recallflowEngine';
import { ActionStatus } from '../types/recallflow';

export const DashboardPage: React.FC = () => {
  const {
    workspaceContext,
    setWorkspaceContext,
    settings,
    metrics,
    memories,
    actionItems,
    recentAgentTraces,
    navigate,
    runQuery,
    simulateQuickOmiEvent,
    isIngesting,
    updateActionStatus,
    setInspectedMemoryId,
  } = useRecallFlow();

  const [dashboardQuestion, setDashboardQuestion] = useState('');
  const [isMicListening, setIsMicListening] = useState(false);

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = dashboardQuestion.trim() || 'What did we decide about Qdrant costs?';
    runQuery(q, true);
  };

  const handleMicToggle = () => {
    if (isMicListening) {
      setIsMicListening(false);
      return;
    }
    setIsMicListening(true);
    setTimeout(() => {
      setDashboardQuestion('What changed since the prior API review?');
      setIsMicListening(false);
    }, 900);
  };

  // Filter recent memories by active workspace context
  const visibleMemories = memories
    .filter((m) => {
      if (m.privacyScope === 'Do Not Retain') return false;
      if (workspaceContext === 'Engineering Workspace' && m.privacyScope === 'Private') {
        return false;
      }
      return true;
    })
    .slice(0, 4);

  const visibleActions = actionItems.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header Welcome & Context Section */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-indigo-400">RecallFlow</span>
              <span aria-hidden="true">·</span>
              <span>Demo Mode</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-teal-400">
                <Shield className="h-3.5 w-3.5" />
                Privacy Policy: {settings.defaultPrivacy} ({settings.defaultRetention})
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Good evening, Alex. Your voice memory is up to date.
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Turn spoken work into lasting context and accountable action.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label htmlFor="dash-workspace-select" className="sr-only">
                Select Workspace
              </label>
              <select
                id="dash-workspace-select"
                value={workspaceContext}
                onChange={(e) =>
                  setWorkspaceContext(
                    e.target.value as
                      | 'Engineering Workspace'
                      | 'Personal Vault (Private)'
                  )
                }
                className="rounded-lg border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-xs font-medium text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="Engineering Workspace">Engineering Workspace</option>
                <option value="Personal Vault (Private)">Personal Vault (Private)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={simulateQuickOmiEvent}
              disabled={isIngesting}
              className="flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-4 py-2 text-xs font-semibold text-indigo-200 transition-colors hover:bg-indigo-600/30 whitespace-nowrap"
            >
              <Mic className="h-3.5 w-3.5 text-indigo-400" />
              <span>Simulate Omi Voice Event</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => navigate('/memories')}
            className="flex flex-col justify-between rounded-lg border border-slate-800 bg-[#0B0F19] p-4 text-left transition-colors hover:border-slate-700"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Memories stored</span>
              <Database className="h-4 w-4 text-teal-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-white">
                {metrics.memoriesStored}
              </span>
              <span className="text-xs text-teal-400">Memories stored</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Indexed in Qdrant recallflow_memories
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/actions')}
            className="flex flex-col justify-between rounded-lg border border-slate-800 bg-[#0B0F19] p-4 text-left transition-colors hover:border-slate-700"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Open action items</span>
              <CheckCircle2 className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-white">
                {metrics.openActionItems}
              </span>
              <span className="text-xs text-indigo-300">Open action items</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Extracted by Lyzr Action Agent
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/actions')}
            className="flex flex-col justify-between rounded-lg border border-slate-800 bg-[#0B0F19] p-4 text-left transition-colors hover:border-slate-700"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Items due soon</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-amber-300">
                {metrics.itemsDueSoon}
              </span>
              <span className="text-xs text-amber-300">Items due soon</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Includes Friday caching benchmark
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/capture')}
            className="flex flex-col justify-between rounded-lg border border-slate-800 bg-[#0B0F19] p-4 text-left transition-colors hover:border-slate-700"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Voice sessions this week</span>
              <Mic className="h-4 w-4 text-teal-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-white">
                {metrics.voiceSessionsThisWeek}
              </span>
              <span className="text-xs text-slate-300">Voice sessions this week</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Captured via Omi webhook stream
            </div>
          </button>
        </div>
      </section>

      {/* Ask RecallFlow + Quick Demo Panel */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-white">Ask RecallFlow</h2>
            <p className="text-xs text-slate-400">
              Query Qdrant long-term vector memory through the 6-agent Lyzr reasoning workflow
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Active scope: <strong className="text-slate-200">{workspaceContext}</strong>
          </span>
        </div>

        <form onSubmit={handleAskSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={dashboardQuestion}
              onChange={(e) => setDashboardQuestion(e.target.value)}
              placeholder="Ask about decisions, deadlines, Qdrant costs, or API review changes..."
              aria-label="Ask RecallFlow a question"
              className="w-full rounded-lg border border-slate-700 bg-[#0B0F19] py-2.5 pr-11 pl-10 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleMicToggle}
              title="Dictate query by voice"
              aria-label="Dictate query by voice"
              className={`absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 transition-colors ${
                isMicListening
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 whitespace-nowrap"
            >
              Ask memory
            </button>
            <button
              type="button"
              onClick={simulateQuickOmiEvent}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 whitespace-nowrap"
            >
              Simulate Omi Voice Event
            </button>
          </div>
        </form>

        {/* Quick Demo One-Click Sample Questions */}
        <div className="mt-5 border-t border-slate-800/80 pt-4">
          <div className="text-xs font-medium text-slate-400">
            Quick demo — One-click evidence queries:
          </div>
          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_DEMO_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => runQuery(q, true)}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#0B0F19] px-3.5 py-2.5 text-left text-xs text-slate-200 transition-colors hover:border-indigo-500/50 hover:text-white"
              >
                <span className="truncate">{q}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Two-Column Grid: Recent Voice Sessions & Recent Action Items */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Voice Sessions List */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Recent Voice Sessions
              </h2>
              <p className="text-xs text-slate-400">
                Omi transcripts verified and stored in Qdrant vector memory
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/memories')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 whitespace-nowrap"
            >
              Explore all ({metrics.memoriesStored}) →
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {visibleMemories.map((mem) => (
              <div
                key={mem.memoryId}
                className="rounded-lg border border-slate-800/90 bg-[#0B0F19] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">{mem.sessionName}</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
                    <span>{mem.timestamp.replace('T', ' ').slice(0, 16)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-teal-400">{mem.privacyScope}</span>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-300">
                  “{mem.text}”
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>{mem.tags.join(' · ')}</span>
                  <button
                    type="button"
                    onClick={() => setInspectedMemoryId(mem.memoryId)}
                    className="font-mono text-indigo-400 hover:underline"
                  >
                    Inspect {mem.memoryId}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Action Items List */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Accountable Action Items
              </h2>
              <p className="text-xs text-slate-400">
                Tasks and deadline shifts extracted by Lyzr Action Agent
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/actions')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 whitespace-nowrap"
            >
              Manage all ({actionItems.length}) →
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {visibleActions.map((item) => {
              const urgency = getActionUrgency(item.dueDate, item.status);
              return (
                <div
                  key={item.actionItemId}
                  className="rounded-lg border border-slate-800/90 bg-[#0B0F19] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {item.task}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                        <span>Owner: {item.owner}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Due: {item.dueDate}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            urgency === 'Overdue'
                              ? 'text-red-400 font-medium'
                              : urgency === 'Due soon'
                                ? 'text-amber-300 font-medium'
                                : 'text-slate-400'
                          }
                        >
                          {urgency}
                        </span>
                      </div>
                    </div>

                    <select
                      aria-label={`Status for ${item.task}`}
                      value={item.status}
                      onChange={(e) =>
                        updateActionStatus(
                          item.actionItemId,
                          e.target.value as ActionStatus
                        )
                      }
                      className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="Open">Open</option>
                      <option value="In progress">In progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>

                  {item.changeHistory.length > 0 && (
                    <div className="mt-2.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">
                      {item.changeHistory[0].activityNote}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Agent Activity Widget */}
      <section>
        <AgentTracePanel
          traces={recentAgentTraces}
          title="Recent Lyzr Multi-Agent Activity"
          subtitle="Most recent collaborative execution across Router, Privacy Policy, Retrieval, Extraction, Context Reasoning, and Briefing agents"
        />
      </section>
    </div>
  );
};
