'use client';

import React, { useState } from 'react';
import { Shield, Lock, Eye, Trash2, CheckCircle, AlertTriangle, Key } from 'lucide-react';

export const LandingPrivacy: React.FC = () => {
  const [activePersona, setActivePersona] = useState<'standard' | 'admin'>('standard');

  return (
    <section id="privacy" className="py-24 border-t border-slate-800/80 bg-slate-950/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 mb-4">
            <Shield className="w-3.5 h-3.5" /> Privacy & Governance
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Enterprise Privacy Shield
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Privacy isn’t an afterthought. Every memory point in Qdrant is partitioned by role scopes, retention time-to-live policies, and cryptographic zero-retention rules.
          </p>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-xl bg-sky-950 text-sky-400 border border-sky-800 w-fit mb-3">
              <Eye className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-white mb-1">Team & Public Scope</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standard technical decisions, sprint commitments, and architecture reviews shared transparently across the project squad.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-xl bg-rose-950 text-rose-400 border border-rose-800 w-fit mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-white mb-1">Confidential Scope</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Executive compensation, HR notes, and NDA discussions isolated into encrypted segments, invisible to regular team queries.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-xl bg-amber-950 text-amber-400 border border-amber-800 w-fit mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-white mb-1">Zero-Retention Mode</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tag any meeting segment with do_not_retain. The multi-agent workflow processes live requests, then purges the transcript permanently.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-xl bg-purple-950 text-purple-400 border border-purple-800 w-fit mb-3">
              <Key className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-white mb-1">Credential Scrubbing</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatic regex and entity sanitization detects API keys (e.g. sk_live_...), tokens, and passwords, neutralizing them before storage.
            </p>
          </div>
        </div>

        {/* Interactive Persona Privacy Simulator */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl max-w-4xl mx-auto shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Live Role-Based Query Isolation</h3>
              <p className="text-xs text-slate-400">
                Toggle the active persona to see how the Lyzr Privacy Agent alters search responses:
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setActivePersona('standard')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activePersona === 'standard'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Standard Team Role
              </button>
              <button
                type="button"
                onClick={() => setActivePersona('admin')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activePersona === 'admin'
                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Executive Admin Role
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs text-slate-400 font-mono">
              Query: &ldquo;What are the confidential executive bonus numbers?&rdquo;
            </div>

            {activePersona === 'standard' ? (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/80 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Privacy Shield Active (Blocked 1 Confidential Record)</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  &ldquo;[Privacy Shield Active] This inquiry requests information governed by confidential privacy policies. Your current role does not have authorization to view executive or compensation records.&rdquo;
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/80 text-xs space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-semibold">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span>Confidential Authorization Granted (Session: session-20261001-exec-comp)</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  &ldquo;Executive compensation committee meeting: confidential equity refresh allocations and Q3 executive bonus multipliers discussed under strict NDA.&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
