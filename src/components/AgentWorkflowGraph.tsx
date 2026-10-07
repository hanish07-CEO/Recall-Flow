'use client';

import React, { useState } from 'react';
import { Shield, Database, ListChecks, GitCompare, Sparkles, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { AgentStepTrace, AgentWorkflowTrace } from '@/lib/models/agent';

interface AgentWorkflowGraphProps {
  workflowTrace: AgentWorkflowTrace | null;
}

export const AgentWorkflowGraph: React.FC<AgentWorkflowGraphProps> = ({ workflowTrace }) => {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  if (!workflowTrace) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-16 shadow-2xl text-center text-slate-500 backdrop-blur-xl">
        <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-pulse" />
        <h3 className="text-base font-bold text-slate-300">Lyzr Multi-Agent Workflow Idle</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mt-2 leading-relaxed">
          Ingest a voice transcript from the Voice Stream tab or ask a question in Evidence Copilot to trigger the 5 autonomous agents in real time.
        </p>
      </div>
    );
  }

  const getAgentIcon = (name: string) => {
    switch (name) {
      case 'PrivacyEnforcementAgent':
        return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'ContextRetrievalAgent':
        return <Database className="w-5 h-5 text-sky-400" />;
      case 'ActionExtractionAgent':
        return <ListChecks className="w-5 h-5 text-indigo-400" />;
      case 'ChangeDetectionAgent':
        return <GitCompare className="w-5 h-5 text-amber-400" />;
      case 'EvidenceSynthesizerAgent':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-sky-400" />;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedStepId(expandedStepId === id ? null : id);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-purple-950/80 border border-purple-800 text-purple-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Lyzr Multi-Agent Execution Pipeline
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                Trace: {workflowTrace.traceId.slice(0, 16)}...
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              5 autonomous agents synchronized in sequence to enforce privacy, retrieve Qdrant memory, extract tasks, and detect changes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Total Latency:</span>
            <strong className="text-white font-mono">{workflowTrace.totalDurationMs}ms</strong>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-semibold text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> 5 Agents Completed
          </span>
        </div>
      </div>

      {/* Agents Stepper Pipeline */}
      <div className="space-y-4">
        {workflowTrace.steps.map((step, idx) => {
          const isExpanded = expandedStepId === step.id;
          const isWarning = step.status === 'warning';

          return (
            <div
              key={step.id}
              className={`rounded-2xl border transition-all ${
                isWarning
                  ? 'bg-amber-950/20 border-amber-800/80'
                  : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700'
              }`}
            >
              {/* Row Header */}
              <div
                onClick={() => toggleExpand(step.id)}
                className="p-5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                    {idx + 1}
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    {getAgentIcon(step.agentName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100 font-mono">{step.agentName}</span>
                      <span className="text-xs text-slate-500 hidden sm:inline">• {step.title}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xl">
                      {step.outputSummary}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {step.durationMs !== undefined && (
                    <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      {step.durationMs}ms
                    </span>
                  )}
                  {isWarning ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-950 px-2.5 py-1 rounded-lg border border-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" /> Zero Retention
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Thought Details */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-800/80 text-xs space-y-4 bg-slate-950/60 rounded-b-2xl">
                  <div>
                    <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider block mb-1">
                      Role & Responsibility:
                    </span>
                    <p className="text-slate-300 text-sm leading-relaxed">{step.role}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider block mb-1.5">
                      Internal Agent Reasoning Log:
                    </span>
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-sky-200/90 leading-relaxed whitespace-pre-wrap">
                      {step.thoughtProcess}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <strong className="text-slate-400 block mb-1 uppercase tracking-wider text-[11px]">
                        Input Parameters:
                      </strong>
                      <span className="text-slate-200 leading-relaxed font-sans">{step.inputSummary}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <strong className="text-slate-400 block mb-1 uppercase tracking-wider text-[11px]">
                        Output Delivered:
                      </strong>
                      <span className="text-slate-200 leading-relaxed font-sans">{step.outputSummary}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
