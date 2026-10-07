'use client';

import React, { useState } from 'react';
import { Search, Sparkles, Shield, Calendar, Radio, CheckCircle, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { EvidenceQAResponse } from '@/lib/models/agent';

interface EvidenceQASearchProps {
  currentUserId: string;
  onSearchComplete?: (qaResponse: EvidenceQAResponse) => void;
}

export const EvidenceQASearch: React.FC<EvidenceQASearchProps> = ({
  currentUserId,
  onSearchComplete,
}) => {
  const [query, setQuery] = useState<string>('What was discussed about the Qdrant cost issue last Tuesday?');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<EvidenceQAResponse | null>(null);
  const [showSteps, setShowSteps] = useState<boolean>(false);

  const sampleQueries = [
    'What was discussed about the Qdrant cost issue last Tuesday?',
    'When is Priya’s caching benchmark due and did it change?',
    'What were the executive compensation and bonus numbers?',
  ];

  const handleSearch = async (queryText?: string) => {
    const q = (queryText || query).trim();
    if (!q) return;

    setIsLoading(true);
    setResult(null);

    const isAdmin = currentUserId === 'user-admin';
    const allowedScopes = isAdmin ? ['team', 'public', 'confidential'] : ['team', 'public'];

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          userId: currentUserId,
          workspaceId: 'workspace-default',
          allowedScopes,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
        if (onSearchComplete) {
          onSearchComplete(json.data);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
        <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/80 text-purple-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            Evidence-Backed Knowledge Retrieval
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-slate-700">
              Lyzr Synthesizer
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Natural language answers anchored directly to verified meeting transcripts and timestamps.
          </p>
        </div>
      </div>

      {/* Suggested Queries */}
      <div className="mb-3">
        <label className="text-[11px] font-medium text-slate-400 mb-1.5 block flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-slate-500" /> Suggested Inquiries:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {sampleQueries.map((sq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQuery(sq);
                handleSearch(sq);
              }}
              className="text-left px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-850 hover:border-slate-700 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex items-center gap-2 mb-4"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about past meetings, technical decisions, or action items..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Retrieving...' : 'Ask RecallFlow'}</span>
        </button>
      </form>

      {/* Result Card */}
      {result && (
        <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-fadeIn">
          {/* Privacy Alert banner if confidential records blocked */}
          {result.privacyFilteredCount > 0 && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800 text-amber-200 text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Privacy Shield Active:</strong> {result.privacyFilteredCount} confidential record(s) were excluded from this response based on your role permissions.
              </span>
            </div>
          )}

          {/* Synthesized Answer */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Evidence-Backed Answer:
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                Confidence: {(result.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {result.answer}
            </p>
          </div>

          {/* Citations List */}
          {result.citations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Verified Citations & Meeting Timestamps ({result.citations.length}):
              </h4>
              <div className="space-y-2">
                {result.citations.map((cite, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <div className="flex items-center gap-2 font-mono">
                        <Radio className="w-3 h-3 text-sky-400" />
                        <span className="text-slate-300 font-semibold">{cite.sessionId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-500" /> {cite.meetingDate}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-sky-300 border border-slate-700">
                          Relevance: {(cite.relevanceScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 italic border-l-2 border-sky-500/60 pl-2.5 my-1">
                      &ldquo;{cite.contextSnippet}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Agent Steps Toggle */}
          <div className="pt-2">
            <button
              onClick={() => setShowSteps(!showSteps)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              {showSteps ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>{showSteps ? 'Hide QA Agent Reasoning Steps' : 'View QA Agent Reasoning Steps (3 Steps)'}</span>
            </button>

            {showSteps && (
              <div className="mt-2 space-y-2 text-xs">
                {result.agentSteps.map((step) => (
                  <div key={step.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>{step.title}</span>
                      <span className="text-[10px] font-mono text-slate-500">{step.durationMs}ms</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2 rounded border border-slate-850">
                      {step.thoughtProcess}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
