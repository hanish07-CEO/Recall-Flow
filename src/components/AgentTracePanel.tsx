import React from 'react';
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Clock,
  Loader2,
  Shield,
  Workflow,
} from 'lucide-react';
import { AgentTrace } from '../types/recallflow';

interface AgentTracePanelProps {
  traces: AgentTrace[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export const AgentTracePanel: React.FC<AgentTracePanelProps> = ({
  traces,
  title = 'Lyzr Multi-Agent Orchestration Trace',
  subtitle = 'Collaborative 6-agent handoff with deterministic policy & evidence checks',
  compact = false,
}) => {
  const totalDuration = traces.reduce((acc, t) => acc + (t.durationMs || 0), 0);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <Workflow className="h-4 w-4 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
            {!compact && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>6 Specialized Agents</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-teal-400">{totalDuration} ms total</span>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {traces.map((trace, idx) => {
          const isPrivacyAgent = trace.agentName === 'Privacy Policy Agent';
          const isCompleted = trace.status === 'completed';
          const isRunning = trace.status === 'running';
          const isBlocked = trace.status === 'blocked';
          const isFailed = trace.status === 'failed';

          return (
            <div key={trace.agentName}>
              <div
                className={`rounded-lg border p-3.5 transition-colors ${
                  isRunning
                    ? 'border-indigo-500/60 bg-indigo-950/25'
                    : isBlocked
                      ? 'border-amber-500/40 bg-amber-950/15'
                      : isFailed
                        ? 'border-red-500/40 bg-red-950/15'
                        : 'border-slate-800/90 bg-[#0B0F19]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">
                      0{idx + 1}
                    </span>
                    {isPrivacyAgent ? (
                      <Shield className="h-4 w-4 text-amber-400" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-teal-400" />
                    ) : isRunning ? (
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    ) : isBlocked ? (
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Clock className="h-4 w-4 text-slate-500" />
                    )}
                    <span className="text-xs font-semibold text-slate-100">
                      {trace.agentName}
                    </span>
                    {isPrivacyAgent && (
                      <span className="text-xs text-amber-300">· Privacy checked</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`font-medium capitalize ${
                        isCompleted
                          ? 'text-teal-400'
                          : isRunning
                            ? 'text-indigo-400'
                            : isBlocked
                              ? 'text-amber-400'
                              : isFailed
                                ? 'text-red-400'
                                : 'text-slate-500'
                      }`}
                    >
                      {trace.status}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">
                      ·
                    </span>
                    <span className="font-mono tabular-nums text-slate-400">
                      {trace.durationMs > 0 ? `${trace.durationMs} ms` : '—'}
                    </span>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div className="text-slate-400">
                    <span className="font-medium text-slate-300">Input: </span>
                    {trace.inputSummary}
                  </div>
                  <div className="text-slate-300">
                    <span className="font-medium text-teal-300">Output: </span>
                    {trace.outputSummary}
                  </div>
                </div>
              </div>

              {!compact && idx < traces.length - 1 && (
                <div className="flex items-center justify-center py-0.5 text-slate-600">
                  <ArrowDown className="h-3 w-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
