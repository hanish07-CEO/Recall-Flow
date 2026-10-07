'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Mic, Database, Cpu, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export const LandingHero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-sky-600/20 via-purple-600/20 to-transparent blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] mb-6">
          The privacy-aware, voice-first{' '}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            meeting memory copilot.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Transform verbal decisions into persistent semantic context. Ingest voice streams via Omi, index memories in Qdrant, and orchestrate Lyzr multi-agent intelligence to detect deadline shifts and shield confidential data.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-purple-500 shadow-xl shadow-sky-500/25 transition group cursor-pointer"
          >
            <span>Launch Copilot Dashboard</span>
            <ArrowRight className="w-4 h-4 transition group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-medium text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition shadow-sm"
          >
            <span>Test Role Personas (Login)</span>
          </Link>
        </div>

        {/* Interactive App Window Preview */}
        <div className="relative max-w-5xl mx-auto">
          {/* Border Glow */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-sky-500/30 via-indigo-500/20 to-purple-500/30 blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 -z-10" />

          <div className="rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl overflow-hidden backdrop-blur-xl text-left">
            {/* Window title bar */}
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400">recallflow-copilot // live-session</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Connected
                </span>
              </div>
            </div>

            {/* Window content preview */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Voice transcript bubble */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sky-950 text-sky-400 border border-sky-800 shrink-0 mt-0.5">
                  <Mic className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300">Omi Voice Transcript Ingested</span>
                    <span className="text-[10px] text-slate-500 font-mono">Today, 15:00 UTC</span>
                  </div>
                  <p className="text-sm text-slate-100 italic">
                    &ldquo;During today’s API review, Priya will benchmark caching by Friday. We also need to revisit the Qdrant cost issue discussed last Tuesday.&rdquo;
                  </p>
                </div>
              </div>

              {/* Real-time Agent Reasoning Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
                    <Cpu className="w-4 h-4" /> Action Extracted
                  </div>
                  <div className="text-xs text-white font-medium">Priya → Benchmark caching</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Milestone: Friday, Oct 9, 2026</div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/60">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
                    <AlertCircle className="w-4 h-4" /> Timeline Delta Flagged
                  </div>
                  <div className="text-xs text-amber-200 font-medium">Thursday, Oct 8 → Friday, Oct 9</div>
                  <div className="text-[11px] text-amber-400/80 mt-0.5">Extended 1 day in API review</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-1">
                    <Database className="w-4 h-4" /> Context Grounded
                  </div>
                  <div className="text-xs text-white font-medium">Qdrant Cost Review (Sept 29)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Quantization cuts memory 60%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack Trust Strip */}
        <div className="mt-20 pt-10 border-t border-slate-800/60">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-6">
            Architected With Industry-Standard Agentic Infrastructure
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-slate-400 text-sm font-semibold">
            <span className="flex items-center gap-2 hover:text-white transition">
              <Mic className="w-4 h-4 text-rose-400" /> Omi Voice Hardware
            </span>
            <span className="flex items-center gap-2 hover:text-white transition">
              <Database className="w-4 h-4 text-sky-400" /> Qdrant Vector Store
            </span>
            <span className="flex items-center gap-2 hover:text-white transition">
              <Cpu className="w-4 h-4 text-purple-400" /> Lyzr Multi-Agent Engine
            </span>
            <span className="flex items-center gap-2 hover:text-white transition">
              <Shield className="w-4 h-4 text-emerald-400" /> Enterprise Privacy Shield
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
