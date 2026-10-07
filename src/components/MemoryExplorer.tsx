'use client';

import React, { useState } from 'react';
import { Database, Shield, Clock, Tag, Trash2, Lock, Eye, Calendar, Sparkles } from 'lucide-react';
import { MemoryRecord, PrivacyScope } from '@/lib/models/memory';

interface MemoryExplorerProps {
  memories: MemoryRecord[];
  onDeleteMemory: (memoryId: string) => void;
  currentUserId: string;
}

export const MemoryExplorer: React.FC<MemoryExplorerProps> = ({
  memories,
  onDeleteMemory,
  currentUserId,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | PrivacyScope>('all');
  const isAdmin = currentUserId === 'user-admin';

  const filteredMemories = memories.filter((m) => {
    if (activeTab === 'all') return true;
    return m.privacyScope === activeTab;
  });

  const getScopeBadge = (scope: PrivacyScope) => {
    switch (scope) {
      case 'confidential':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
            <Lock className="w-2.5 h-2.5" /> Confidential
          </span>
        );
      case 'team':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950 text-sky-300 border border-sky-800">
            <Shield className="w-2.5 h-2.5" /> Team
          </span>
        );
      case 'public':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            <Eye className="w-2.5 h-2.5" /> Public
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
            Zero-Retention
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-950/80 border border-sky-800/80 text-sky-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              Qdrant Semantic Memory Repository
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Collection: recallflow_memories ({filteredMemories.length})
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Long-term vector payloads with strict privacy scopes and retention policies.
            </p>
          </div>
        </div>

        {/* Privacy Scope Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {(['all', 'team', 'public', 'confidential'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded-lg font-medium transition capitalize ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Unauthorized Notice when non-admin views confidential tab */}
      {activeTab === 'confidential' && !isAdmin && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/30 border border-rose-800 text-rose-200 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>Privacy Enforcement Active:</strong> You are currently signed in as a standard team member. Switch to Executive role in the header to view confidential records.
          </span>
        </div>
      )}

      {/* Memory Cards Grid */}
      {filteredMemories.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          No memories found matching the current filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMemories.map((mem) => {
            const isConfidential = mem.privacyScope === 'confidential';
            const hideDetails = isConfidential && !isAdmin;

            return (
              <div
                key={mem.memoryId}
                className={`p-4 rounded-xl border transition ${
                  isConfidential
                    ? 'bg-rose-950/10 border-rose-900/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Card Top: Session & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {mem.sessionId}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {mem.meetingDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getScopeBadge(mem.privacyScope)}
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      <Clock className="w-2.5 h-2.5" /> {mem.retentionPolicy}
                    </span>
                    <button
                      onClick={() => onDeleteMemory(mem.memoryId)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete point from Qdrant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Body: Transcript */}
                <div className="text-xs text-slate-300 leading-relaxed mb-3">
                  {hideDetails ? (
                    <span className="italic text-slate-500">
                      [Redacted by PrivacyEnforcementAgent — Executive authorization required]
                    </span>
                  ) : (
                    mem.transcriptText
                  )}
                </div>

                {/* Card Footer: Tags & Source */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {mem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono text-[10px]"
                      >
                        <Tag className="w-2.5 h-2.5" /> #{tag}
                      </span>
                    ))}
                  </div>

                  <span className="text-slate-500 font-mono text-[10px]">
                    ID: {mem.memoryId.slice(0, 16)}...
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
