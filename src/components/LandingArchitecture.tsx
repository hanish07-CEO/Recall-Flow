'use client';

import React, { useState } from 'react';
import { Shield, Database, ListChecks, GitCompare, Sparkles, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export const LandingArchitecture: React.FC = () => {
  const [activeAgentIndex, setActiveAgentIndex] = useState<number>(0);

  const agents = [
    {
      id: 'privacy',
      name: 'PrivacyEnforcementAgent',
      title: '01. Privacy & Zero-Retention Shield',
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300',
      description:
        'Inspects every incoming voice transcript from Omi. Automatically classifies sensitivity, redacts credentials/passwords, and enforces immediate purge if tagged with do_not_retain.',
      input: 'Raw voice stream: "During today’s API review, Priya will benchmark caching by Friday..."',
      thought:
        'Evaluated payload privacy scope: "team". Retention: "30d". Secret scan: 0 credentials detected. Memory approved for long-term Qdrant persistence.',
      output: 'Sanitized transcript approved. Long-term storage permitted in collection recallflow_memories.',
    },
    {
      id: 'retrieval',
      name: 'ContextRetrievalAgent',
      title: '02. Semantic Vector Context Retrieval',
      icon: <Database className="w-5 h-5 text-sky-400" />,
      color: 'border-sky-500/50 bg-sky-950/20 text-sky-300',
      description:
        'Queries Qdrant vector collections to pull historical meetings and decisions referenced in conversation, respecting role permissions.',
      input: 'Query keys: ["Qdrant cost issue last Tuesday", "caching benchmark sprint"]',
      thought:
        'Extracted semantic lookup keys. Located historical memory [mem-seed-qdrant-cost] from Sept 29, 2026 meeting regarding uncompressed embeddings. Relevance: 0.92.',
      output: 'Retrieved 1 historical memory session (Sept 29, 2026 API review on Qdrant vector costs).',
    },
    {
      id: 'action',
      name: 'ActionExtractionAgent',
      title: '03. Action Item & Ownership Extraction',
      icon: <ListChecks className="w-5 h-5 text-indigo-400" />,
      color: 'border-indigo-500/50 bg-indigo-950/20 text-indigo-300',
      description:
        'Extracts commitments, assignees, target deadlines, priority ratings, and initial status from spoken conversation.',
      input: '"Priya will benchmark caching by Friday."',
      thought:
        'Identified explicit verbal commitment. Task: "Benchmark caching", Assignee: "Priya", Target Date: "2026-10-09" (Friday), Priority: "High".',
      output: 'Extracted Action Item: Benchmark caching (Owner: Priya, Due: Friday, Oct 9, 2026).',
    },
    {
      id: 'change',
      name: 'ChangeDetectionAgent',
      title: '04. Timeline & Scope Delta Detection',
      icon: <GitCompare className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/50 bg-amber-950/20 text-amber-300',
      description:
        'Cross-references new commitments against past sprint records in Qdrant to detect changes, extensions, or scope shifts.',
      input: 'Comparing new action item against action items in repository recallflow_action_items',
      thought:
        'Delta detected! Priya was previously committed to complete caching benchmark on Thursday, October 8, 2026. In today’s meeting, deadline shifted to Friday, October 9, 2026.',
      output: 'Timeline Delta flagged: Due date extended from Thursday, Oct 8 → Friday, Oct 9.',
    },
    {
      id: 'synthesizer',
      name: 'EvidenceSynthesizerAgent',
      title: '05. Evidence-Backed Synthesis',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/50 bg-purple-950/20 text-purple-300',
      description:
        'Synthesizes verifiable briefing reports and answers user queries with exact source citations, timestamps, and confidence scores.',
      input: 'User Question: "What was discussed about the Qdrant cost issue last Tuesday?"',
      thought:
        'Anchored response to meeting transcript from Sept 29, 2026 (session-20260929-api-review). Attached 4 verified citations. Confidence: 96%.',
      output: 'Factual response generated citing Marcus’s Sept 29 proposal to benchmark scalar quantization.',
    },
  ];

  const current = agents[activeAgentIndex];

  return (
    <section id="architecture" className="py-24 border-t border-slate-800/80 bg-slate-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/80 mb-4">
            <Cpu className="w-3.5 h-3.5" /> Multi-Agent Workflow
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            How the 5 Lyzr Agents Collaborate
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Instead of a single black-box LLM, RecallFlow divides cognitive tasks across 5 specialized autonomous agents connected directly to Qdrant memory.
          </p>
        </div>

        {/* Interactive Agent Stepper & Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 5 Agent Stepper Buttons */}
          <div className="lg:col-span-5 space-y-3">
            {agents.map((ag, idx) => {
              const isSelected = activeAgentIndex === idx;
              return (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => setActiveAgentIndex(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition duration-200 flex items-start gap-3.5 ${
                    isSelected
                      ? `${ag.color} ring-1 ring-white/20 shadow-lg`
                      : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                    {ag.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white mb-0.5 flex items-center justify-between">
                      <span>{ag.title}</span>
                      {isSelected && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-950 text-white border border-slate-700">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2">
                      {ag.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Live Agent Reasoning Inspector */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    {current.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">{current.name}</h3>
                    <p className="text-xs text-slate-400">{current.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-full font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Agent Execution</span>
                </div>
              </div>

              {/* Agent Thought Process Box */}
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Internal Cognitive Reasoning Trace:
                  </label>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-sky-200/90 leading-relaxed">
                    {current.thought}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="font-semibold text-slate-400 block mb-1 text-[11px] uppercase tracking-wider">
                      Input Payload:
                    </span>
                    <p className="text-slate-300 font-sans">{current.input}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="font-semibold text-slate-400 block mb-1 text-[11px] uppercase tracking-wider">
                      Output Result:
                    </span>
                    <p className="text-slate-300 font-sans">{current.output}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
