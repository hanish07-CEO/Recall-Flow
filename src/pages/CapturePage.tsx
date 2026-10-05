import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  Loader2,
  Mic,
  Radio,
  Shield,
} from 'lucide-react';
import { AgentTracePanel } from '../components/AgentTracePanel';
import { useRecallFlow } from '../context/RecallFlowContext';
import {
  PRIMARY_USER_STORY_TRANSCRIPT,
  SEED_PRESET_SESSIONS,
} from '../data/seedData';
import { PrivacyScope, RetentionPolicy } from '../types/recallflow';

const TIMELINE_STAGES = [
  { id: 'received', short: 'Received', detail: 'Received from Omi' },
  { id: 'privacy_checked', short: 'Privacy checked', detail: 'Privacy checked' },
  { id: 'chunked', short: 'Chunked', detail: 'Chunked' },
  { id: 'embedded', short: 'Embedded', detail: 'Embedded' },
  { id: 'qdrant_stored', short: 'Qdrant stored', detail: 'Stored in Qdrant' },
  {
    id: 'lyzr_analyzed',
    short: 'Lyzr analyzed',
    detail: 'Action items extracted by Lyzr',
  },
  { id: 'complete', short: 'Complete', detail: 'Context analyzed' },
];

export const CapturePage: React.FC = () => {
  const {
    isIngesting,
    activeStageIndex,
    liveAgentTraces,
    lastIngestionResult,
    triggerIngestion,
    setInspectedMemoryId,
  } = useRecallFlow();

  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    SEED_PRESET_SESSIONS[0].id
  );
  const [transcript, setTranscript] = useState<string>(PRIMARY_USER_STORY_TRANSCRIPT);
  const [sessionName, setSessionName] = useState<string>('API Review — October 5');
  const [sessionId, setSessionId] = useState<string>('sess_api_review_oct05');
  const [privacyScope, setPrivacyScope] = useState<PrivacyScope>('Workspace');
  const [retentionPolicy, setRetentionPolicy] = useState<RetentionPolicy>('Indefinite');

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = SEED_PRESET_SESSIONS.find((p) => p.id === presetId);
    if (preset) {
      setTranscript(preset.transcript);
      setSessionName(preset.sessionName);
      setSessionId(preset.sessionId);
      setPrivacyScope(preset.privacyScope);
      setRetentionPolicy(
        preset.privacyScope === 'Do Not Retain'
          ? 'Indefinite'
          : (preset.retentionPolicy as RetentionPolicy)
      );
    }
  };

  const handleProcessEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) return;
    triggerIngestion({
      transcript,
      sessionName,
      sessionId,
      privacyScope,
      retentionPolicy: privacyScope === 'Do Not Retain' ? 'None' : retentionPolicy,
    });
  };

  const isDoNotRetainResult =
    lastIngestionResult?.event.privacyScope === 'Do Not Retain';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400">
            <Radio className="h-3.5 w-3.5" />
            <span>POST /api/omi/webhook · Demo Mode Simulator</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Voice capture and ingestion
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Ingest Omi-compatible voice transcripts, enforce privacy & retention rules, embed in Qdrant, and extract tasks with Lyzr
          </p>
        </div>
      </div>

      {/* Live-Style Transcript Input & Controls */}
      <form
        onSubmit={handleProcessEvent}
        className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-5"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Preset Selector */}
          <div className="lg:col-span-2">
            <label
              htmlFor="preset-session-select"
              className="block text-xs font-medium text-slate-300"
            >
              Seeded Omi Voice Session Preset
            </label>
            <select
              id="preset-session-select"
              value={selectedPresetId}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-3.5 py-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              {SEED_PRESET_SESSIONS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Session Title */}
          <div>
            <label
              htmlFor="capture-session-name"
              className="block text-xs font-medium text-slate-300"
            >
              Session Name
            </label>
            <input
              id="capture-session-name"
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-3.5 py-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Live-Style Transcript Panel */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="omi-transcript-textarea"
              className="flex items-center gap-2 text-xs font-medium text-slate-300"
            >
              <Mic className="h-3.5 w-3.5 text-indigo-400" />
              <span>Live Omi Voice Transcript Stream</span>
            </label>
            <span className="font-mono text-[11px] text-slate-400">
              Source: Omi · Session ID: {sessionId}
            </span>
          </div>
          <textarea
            id="omi-transcript-textarea"
            rows={4}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Speak or paste an Omi transcript segment..."
            className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0B0F19] p-4 text-sm leading-relaxed text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Privacy Scope & Retention Selectors + Action Button */}
        <div className="grid grid-cols-1 gap-4 border-t border-slate-800 pt-5 md:grid-cols-3 md:items-end">
          {/* Privacy Scope Selector */}
          <div>
            <span className="block text-xs font-medium text-slate-300">
              Privacy Scope
            </span>
            <div className="mt-1.5 flex rounded-lg border border-slate-800 bg-[#0B0F19] p-1">
              {(['Private', 'Workspace', 'Do Not Retain'] as PrivacyScope[]).map(
                (scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => setPrivacyScope(scope)}
                    className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      privacyScope === scope
                        ? scope === 'Do Not Retain'
                          ? 'bg-amber-600 text-white'
                          : 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {scope}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Retention Selector */}
          <div>
            <span className="block text-xs font-medium text-slate-300">
              Retention Policy
            </span>
            <div className="mt-1.5 flex rounded-lg border border-slate-800 bg-[#0B0F19] p-1">
              {(['7 days', '30 days', 'Indefinite'] as const).map((ret) => (
                <button
                  key={ret}
                  type="button"
                  disabled={privacyScope === 'Do Not Retain'}
                  onClick={() => setRetentionPolicy(ret)}
                  className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap disabled:opacity-40 ${
                    retentionPolicy === ret && privacyScope !== 'Do Not Retain'
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ret}
                </button>
              ))}
            </div>
          </div>

          {/* Process Voice Event Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isIngesting || !transcript.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60 md:w-auto whitespace-nowrap"
            >
              {isIngesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing Voice Event...</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>Process voice event</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Horizontal Processing Timeline */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Ingestion & Vector Memory Pipeline
            </h2>
            <p className="text-xs text-slate-400">
              Received → Privacy checked → Chunked → Embedded → Qdrant stored → Lyzr analyzed → Complete
            </p>
          </div>
          <span className="font-mono text-xs text-slate-400">
            {isIngesting
              ? 'Pipeline running...'
              : lastIngestionResult
                ? 'Pipeline execution complete'
                : 'Ready to process Omi event'}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-7">
          {TIMELINE_STAGES.map((stage, idx) => {
            const isSkippedByDnr =
              isDoNotRetainResult &&
              (stage.id === 'chunked' ||
                stage.id === 'embedded' ||
                stage.id === 'qdrant_stored');

            const isCompleted =
              !isSkippedByDnr &&
              ((!isIngesting && lastIngestionResult !== null) ||
                (isIngesting && activeStageIndex > idx));
            const isCurrent = isIngesting && activeStageIndex === idx;

            return (
              <div
                key={stage.id}
                className={`rounded-lg border p-3 transition-colors ${
                  isSkippedByDnr
                    ? 'border-amber-500/30 bg-amber-950/15 text-amber-300'
                    : isCurrent
                      ? 'border-indigo-500 bg-indigo-950/30 text-white'
                      : isCompleted
                        ? 'border-teal-500/40 bg-teal-950/20 text-teal-300'
                        : 'border-slate-800 bg-[#0B0F19] text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span>0{idx + 1}</span>
                  {isSkippedByDnr ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  ) : isCurrent ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-slate-600" />
                  )}
                </div>
                <div className="mt-1.5 text-xs font-semibold text-slate-100">
                  {stage.short}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {isSkippedByDnr ? 'Bypassed (Do Not Retain)' : stage.detail}
                </div>
              </div>
            );
          })}
        </div>

        {/* Do Not Retain Banner */}
        {isDoNotRetainResult && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <div className="font-semibold text-amber-100">
                Transient analysis complete. This content was not embedded or written to long-term memory.
              </div>
              <p className="mt-1 text-xs text-amber-200/80">
                Privacy Policy Agent enforced “Do Not Retain”. Zero vectors were written to Qdrant collection recallflow_memories, and this note will never appear in Memory Explorer or Ask Memory queries.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Results Breakdown: Qdrant Memory Record, Extracted Action Items & Context Analysis */}
      {lastIngestionResult && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Qdrant Memory Record Created Section */}
          <section className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-semibold text-white">
                  {lastIngestionResult.memoryRecord
                    ? 'Qdrant memory record created'
                    : 'Transient Event Metadata (Not Stored in Qdrant)'}
                </h3>
              </div>
              <span
                className={`text-xs font-medium ${
                  lastIngestionResult.memoryRecord
                    ? 'text-teal-400'
                    : 'text-amber-400'
                }`}
              >
                {lastIngestionResult.memoryRecord
                  ? 'Stored in Qdrant'
                  : 'Not stored'}
              </span>
            </div>

            {(() => {
              const rec =
                lastIngestionResult.memoryRecord ||
                lastIngestionResult.transientRecord;
              if (!rec) return null;
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-3">
                      <div className="text-slate-400">Memory ID</div>
                      <div className="mt-1 font-mono text-slate-200">
                        {rec.memoryId}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-3">
                      <div className="text-slate-400">Session ID</div>
                      <div className="mt-1 font-mono text-slate-200">
                        {rec.sessionId}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-3">
                      <div className="text-slate-400">Source</div>
                      <div className="mt-1 font-medium text-indigo-300">
                        {rec.source}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-3">
                      <div className="text-slate-400">Privacy Scope</div>
                      <div className="mt-1 font-medium text-slate-200">
                        {rec.privacyScope}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-3">
                      <div className="text-slate-400">Retention Policy</div>
                      <div className="mt-1 font-medium text-slate-200">
                        {rec.retentionPolicy}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-3">
                      <div className="text-slate-400">Storage State</div>
                      <div
                        className={`mt-1 font-medium ${
                          rec.storageState === 'Stored in Qdrant'
                            ? 'text-teal-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {rec.storageState}
                      </div>
                    </div>
                  </div>

                  {/* Extracted Tags */}
                  <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-3.5 text-xs">
                    <div className="font-medium text-slate-400">Extracted Tags</div>
                    <div className="mt-1.5 text-slate-200">
                      {lastIngestionResult.extractedTags.join(' · ')}
                    </div>
                  </div>

                  {/* Payload JSON Preview */}
                  <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-3.5">
                    <div className="text-xs font-medium text-slate-400">
                      Qdrant Vector Payload Metadata
                    </div>
                    <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-300">
                      {JSON.stringify(
                        {
                          collection:
                            rec.qdrantCollection || 'NONE_TRANSIENT_ONLY',
                          point_id: rec.memoryId,
                          vector_dim: rec.vectorDimension || 0,
                          payload: {
                            userId: rec.userId,
                            workspaceId: rec.workspaceId,
                            sessionId: rec.sessionId,
                            timestamp: rec.timestamp,
                            privacyScope: rec.privacyScope,
                            retentionPolicy: rec.retentionPolicy,
                            storageState: rec.storageState,
                            tags: rec.tags,
                          },
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              );
            })()}
          </section>

          {/* Extracted Action Items & Historical Context Analysis */}
          <section className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Action Items & Historical Context Reasoning
                </h3>
                <p className="text-xs text-slate-400">
                  Extracted by Lyzr Action Agent & cross-checked against Qdrant memory
                </p>
              </div>
            </div>

            {lastIngestionResult.extractedActionItems.length > 0 ? (
              <div className="space-y-3">
                {lastIngestionResult.extractedActionItems.map((item) => (
                  <div
                    key={item.actionItemId}
                    className="rounded-lg border border-slate-800 bg-[#0B0F19] p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-teal-400">
                        Extracted Action Item
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        Status: {item.status}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white">
                      Task: {item.task}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                      <span>Owner: {item.owner}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">
                        Due date: {item.dueDateDisplay} ({item.dueDate})
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Priority: {item.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-4 text-xs text-slate-400">
                No persistent action items written for this transcript event.
              </div>
            )}

            {/* Deadline Change Detection */}
            {lastIngestionResult.changeDetected && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/15 p-4 space-y-2">
                <div className="text-xs font-semibold text-amber-300">
                  Context Reasoning Agent: Historical Change Detected
                </div>
                <div className="text-sm font-semibold text-white">
                  {lastIngestionResult.changeDetected.note}
                </div>
                <p className="text-xs text-slate-300">
                  Deadline changed from{' '}
                  <strong className="text-slate-100">
                    {lastIngestionResult.changeDetected.previousValue}
                  </strong>{' '}
                  ({lastIngestionResult.changeDetected.previousSession}) to{' '}
                  <strong className="text-teal-300">
                    {lastIngestionResult.changeDetected.updatedValue}
                  </strong>{' '}
                  ({lastIngestionResult.changeDetected.updatedSession}).
                </p>
              </div>
            )}

            {/* Retrieved Earlier Relevant Memory about Qdrant Costs */}
            {lastIngestionResult.retrievedContextMemories.length > 0 && (
              <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-4 space-y-2">
                <div className="text-xs font-semibold text-indigo-300">
                  Retrieved Earlier Relevant Memory (Qdrant Cost Context)
                </div>
                {lastIngestionResult.retrievedContextMemories.map((mem) => (
                  <div key={mem.memoryId} className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-medium text-slate-200">
                        {mem.sessionName}
                      </span>
                      <span className="font-mono">
                        {mem.timestamp.replace('T', ' ').slice(0, 16)}
                      </span>
                    </div>
                    <p className="text-slate-300">“{mem.text}”</p>
                    <button
                      type="button"
                      onClick={() => setInspectedMemoryId(mem.memoryId)}
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-400 hover:underline"
                    >
                      <span>View linked record {mem.memoryId}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Real-time Lyzr Multi-Agent Workflow Panel */}
      <AgentTracePanel
        traces={liveAgentTraces}
        title="Real-Time Lyzr Multi-Agent Ingestion Workflow"
        subtitle="Router → Privacy Policy → Memory Retrieval → Action Extraction → Context Reasoning → Briefing"
      />
    </div>
  );
};
