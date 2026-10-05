import React from 'react';
import { ArrowRight, Brain, CheckCircle2, Database, Mic, Shield, Workflow } from 'lucide-react';

interface ArchitectureStep {
  index: string;
  label: string;
  layer: 'Omi' | 'Ingestion' | 'Privacy' | 'Qdrant' | 'Lyzr' | 'Output';
  detail: string;
}

const ARCHITECTURE_FLOW: ArchitectureStep[] = [
  {
    index: '01',
    label: 'Omi Voice Input',
    layer: 'Omi',
    detail: 'Wearable or simulated spoken stream arrives with speaker turns & session metadata.',
  },
  {
    index: '02',
    label: 'Transcript Ingestion API',
    layer: 'Ingestion',
    detail: 'POST /api/omi/webhook validates payload signatures and normalizes event schema.',
  },
  {
    index: '03',
    label: 'Privacy and Retention Check',
    layer: 'Privacy',
    detail: 'Evaluates Private, Workspace, or Do Not Retain rules before any vector processing.',
  },
  {
    index: '04',
    label: 'Chunking and Embedding',
    layer: 'Ingestion',
    detail: 'Segments approved transcripts into semantic windows and computes 1536-d embeddings.',
  },
  {
    index: '05',
    label: 'Qdrant Vector Memory',
    layer: 'Qdrant',
    detail: 'Persists vectors & payload ACL filters in recallflow_memories and recallflow_action_items.',
  },
  {
    index: '06',
    label: 'Lyzr Router Agent',
    layer: 'Lyzr',
    detail: 'Classifies user intent or transcript event and orchestrates downstream specialists.',
  },
  {
    index: '07',
    label: 'Privacy Policy Agent',
    layer: 'Lyzr',
    detail: 'Enforces server-side workspace isolation and blocks unauthorized private lookups.',
  },
  {
    index: '08',
    label: 'Memory Retrieval Agent',
    layer: 'Lyzr',
    detail: 'Executes pre-filtered HNSW cosine similarity queries against Qdrant collections.',
  },
  {
    index: '09',
    label: 'Action Extraction Agent',
    layer: 'Lyzr',
    detail: 'Identifies tasks, owners, priorities, and deadlines from voice segments.',
  },
  {
    index: '10',
    label: 'Context Reasoning Agent',
    layer: 'Lyzr',
    detail: 'Compares new statements with historical memories to detect deadline or scope shifts.',
  },
  {
    index: '11',
    label: 'Briefing Agent',
    layer: 'Lyzr',
    detail: 'Synthesizes findings and attaches verified memory IDs and timestamped quotes.',
  },
  {
    index: '12',
    label: 'Evidence-backed User Response',
    layer: 'Output',
    detail: 'Delivers Confirmed from memory / Inferred from context answers with full provenance.',
  },
];

export const ArchitectureDiagram: React.FC = () => {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#111827] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100">
            RecallFlow End-to-End Agentic Memory Architecture
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            12-stage deterministic pipeline connecting Omi voice capture, Qdrant vector storage, and Lyzr multi-agent orchestration
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-indigo-300">
            <Mic className="h-3.5 w-3.5" /> Omi Layer
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1.5 text-teal-300">
            <Database className="h-3.5 w-3.5" /> Qdrant Vector Memory
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1.5 text-violet-300">
            <Workflow className="h-3.5 w-3.5" /> Lyzr 6-Agent Mesh
          </span>
        </div>
      </div>

      {/* 12-Step Visual Flow Grid */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ARCHITECTURE_FLOW.map((step, idx) => {
          const isQdrant = step.layer === 'Qdrant';
          const isPrivacy = step.layer === 'Privacy' || step.label.includes('Privacy');
          const isLyzr = step.layer === 'Lyzr';

          return (
            <div
              key={step.index}
              className={`relative flex flex-col justify-between rounded-lg border p-3.5 transition-colors ${
                isQdrant
                  ? 'border-teal-500/40 bg-teal-950/20'
                  : isPrivacy
                    ? 'border-amber-500/30 bg-amber-950/15'
                    : isLyzr
                      ? 'border-indigo-500/30 bg-indigo-950/15'
                      : 'border-slate-800 bg-[#0B0F19]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-400">{step.index}</span>
                  <span
                    className={`font-medium ${
                      isQdrant
                        ? 'text-teal-300'
                        : isPrivacy
                          ? 'text-amber-300'
                          : isLyzr
                            ? 'text-indigo-300'
                            : 'text-slate-400'
                    }`}
                  >
                    {step.layer}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {step.layer === 'Omi' && <Mic className="h-4 w-4 shrink-0 text-indigo-400" />}
                  {isQdrant && <Database className="h-4 w-4 shrink-0 text-teal-400" />}
                  {isPrivacy && <Shield className="h-4 w-4 shrink-0 text-amber-400" />}
                  {isLyzr && !isPrivacy && (
                    <Brain className="h-4 w-4 shrink-0 text-indigo-400" />
                  )}
                  {step.layer === 'Output' && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
                  )}
                  <h4 className="text-sm font-semibold text-slate-100">{step.label}</h4>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{step.detail}</p>
              </div>

              {idx < ARCHITECTURE_FLOW.length - 1 && (
                <div className="mt-3 flex items-center justify-end text-xs text-slate-500">
                  <span className="font-mono text-[11px]">Next stage</span>
                  <ArrowRight className="ml-1 h-3 w-3 text-slate-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Linear Canonical Chain */}
      <div className="mt-5 rounded-lg border border-slate-800/80 bg-[#0B0F19] p-4">
        <div className="text-xs font-medium text-slate-400">Canonical Execution Path</div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-xs text-slate-200">
          <span>Omi Voice Input</span>
          <span className="text-indigo-400">→</span>
          <span>Transcript Ingestion API</span>
          <span className="text-indigo-400">→</span>
          <span className="text-amber-300">Privacy and Retention Check</span>
          <span className="text-indigo-400">→</span>
          <span>Chunking and Embedding</span>
          <span className="text-indigo-400">→</span>
          <span className="text-teal-300">Qdrant Vector Memory</span>
          <span className="text-indigo-400">→</span>
          <span className="text-indigo-300">Lyzr Router Agent</span>
          <span className="text-indigo-400">→</span>
          <span className="text-amber-300">Privacy Policy Agent</span>
          <span className="text-indigo-400">→</span>
          <span className="text-indigo-300">Memory Retrieval Agent</span>
          <span className="text-indigo-400">→</span>
          <span className="text-indigo-300">Action Extraction Agent</span>
          <span className="text-indigo-400">→</span>
          <span className="text-indigo-300">Context Reasoning Agent</span>
          <span className="text-indigo-400">→</span>
          <span className="text-indigo-300">Briefing Agent</span>
          <span className="text-indigo-400">→</span>
          <span className="text-teal-300">Evidence-backed User Response</span>
        </div>
        <p className="mt-3 border-t border-slate-800/80 pt-3 text-xs leading-relaxed text-slate-300">
          Omi provides voice-originated transcript events. Qdrant stores approved long-term semantic memory and searchable action items. Lyzr coordinates specialized agents that retrieve context, enforce policy, extract tasks, compare historical information, and create evidence-grounded briefings.
        </p>
      </div>
    </div>
  );
};
