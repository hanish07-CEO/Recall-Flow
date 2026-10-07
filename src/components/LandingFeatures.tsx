'use client';

import React from 'react';
import { Mic, Database, Cpu, GitCompare, Shield, Sparkles, CheckCircle2, Lock, Zap } from 'lucide-react';

export const LandingFeatures: React.FC = () => {
  const features = [
    {
      icon: <Mic className="w-5 h-5 text-rose-400" />,
      title: 'Omi Voice Ingestion Layer',
      description:
        'Seamlessly captures audio transcript events via POST /api/omi/webhook with optional cryptographic secret authentication and live audio simulation.',
      tag: 'Hardware Ingestion',
    },
    {
      icon: <Database className="w-5 h-5 text-sky-400" />,
      title: 'Qdrant Semantic Vector Memory',
      description:
        'Maintains long-term vector embeddings in recallflow_memories and recallflow_action_items, supporting instant cosine similarity retrieval.',
      tag: 'Vector Storage',
    },
    {
      icon: <Cpu className="w-5 h-5 text-purple-400" />,
      title: 'Lyzr Multi-Agent Pipeline',
      description:
        'Coordinates 5 specialized agents to scrub secrets, retrieve context, extract commitments, detect timeline deltas, and synthesize answers.',
      tag: 'Multi-Agent',
    },
    {
      icon: <GitCompare className="w-5 h-5 text-amber-400" />,
      title: 'Historical Timeline Delta Detection',
      description:
        'Cross-references commitments against past sprints. When Priya’s caching deadline shifts from Thursday to Friday, it flags the change automatically.',
      tag: 'Change Intelligence',
    },
    {
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      title: 'Role-Based Privacy Shield',
      description:
        'Strict separation between team, public, and confidential records. Executive compensation or NDA discussions are shielded from unauthorized eyes.',
      tag: 'Enterprise Security',
    },
    {
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      title: 'Deterministic Demo & Cloud Modes',
      description:
        'Works seamlessly out of the box with in-memory deterministic simulation without external API keys, while fully prepped for live production cloud clusters.',
      tag: 'Hackathon Ready',
    },
  ];

  return (
    <section id="features" className="py-24 border-t border-slate-800/80 bg-slate-950/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/80 mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Core Capabilities
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Built for modern agentic workflows.
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Every layer of RecallFlow is designed to convert fleeting voice meetings into verifiable, actionable, and privacy-shielded organizational intelligence.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900/90 hover:border-slate-700 transition duration-300 relative group overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                  {f.icon}
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                  {f.tag}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
