'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Mic, Send, Radio, Shield, Clock, CheckCircle2, AlertTriangle, Code2, Sparkles, Volume2, ArrowRight } from 'lucide-react';
import { SIMULATOR_PRESETS, SimulatorPreset } from '@/lib/adapters/omi/simulator';
import { PrivacyScope, RetentionPolicy } from '@/lib/models/memory';
import { apiFetch } from '@/lib/client/api';
import type { IngestionClientResponse } from '@/lib/services/ingestionService';

interface OmiSimulatorProps {
  onIngestionSuccess: (data: IngestionClientResponse) => void;
  currentUserId: string;
  onNavigateTab?: (tab: 'actions' | 'agents') => void;
}

interface SubmitOutcome {
  ok: boolean;
  httpStatus?: number;
  data?: IngestionClientResponse;
  error?: string;
}

const INPUT_CLASS =
  'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500';

export const OmiSimulator: React.FC<OmiSimulatorProps> = ({
  onIngestionSuccess,
  currentUserId,
  onNavigateTab,
}) => {
  const ids = useId();
  const transcriptId = `${ids}-transcript`;
  const scopeId = `${ids}-scope`;
  const retentionId = `${ids}-retention`;
  const sessionFieldId = `${ids}-session`;
  const timeFieldId = `${ids}-time`;

  const first = SIMULATOR_PRESETS[0];
  const [selectedPresetId, setSelectedPresetId] = useState<string>(first.id);
  const [transcript, setTranscript] = useState<string>(first.payload.transcript);
  const [privacyScope, setPrivacyScope] = useState<PrivacyScope>(first.payload.privacyScope ?? 'team');
  const [retentionPolicy, setRetentionPolicy] = useState<RetentionPolicy>(first.payload.retentionPolicy ?? '30d');
  const [sessionId, setSessionId] = useState<string>(first.payload.sessionId);
  // Relative deadlines ("by Friday") resolve from the meeting time, so it is explicit and editable.
  const [meetingTime, setMeetingTime] = useState<string>(first.payload.timestamp);
  const [isSimulatingAudio, setIsSimulatingAudio] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);
  const [showJsonPayload, setShowJsonPayload] = useState<boolean>(false);

  const audioTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (audioTimer.current) clearTimeout(audioTimer.current);
  }, []);

  const isDoNotRetain = privacyScope === 'do_not_retain';
  const timeIsValid = !Number.isNaN(new Date(meetingTime).getTime());

  const handleSelectPreset = (preset: SimulatorPreset) => {
    setSelectedPresetId(preset.id);
    setTranscript(preset.payload.transcript);
    setPrivacyScope(preset.payload.privacyScope ?? 'team');
    setRetentionPolicy(preset.payload.retentionPolicy ?? '30d');
    setSessionId(preset.payload.sessionId);
    setMeetingTime(preset.payload.timestamp);
    setOutcome(null);
  };

  const handleScopeChange = (scope: PrivacyScope) => {
    setPrivacyScope(scope);
    // Zero-retention events can only ever be ephemeral.
    if (scope === 'do_not_retain') setRetentionPolicy('ephemeral_session');
  };

  const handleSimulateVoice = () => {
    if (audioTimer.current) clearTimeout(audioTimer.current);
    setIsSimulatingAudio(true);
    audioTimer.current = setTimeout(() => setIsSimulatingAudio(false), 2200);
  };

  const buildPayload = () => ({
    eventId: `evt-sim-${Date.now()}`,
    sessionId: sessionId.trim() || `session-${Date.now()}`,
    timestamp: new Date(meetingTime).toISOString(),
    transcript: transcript.trim(),
    privacyScope,
    retentionPolicy: isDoNotRetain ? 'ephemeral_session' : retentionPolicy,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !transcript.trim() || !timeIsValid) return;

    setIsSubmitting(true);
    setOutcome(null);

    try {
      // The simulator uses the same shared IngestionService as the real webhook, via the demo-only route.
      const res = await apiFetch(currentUserId, '/api/omi/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.result?.success) {
        setOutcome({
          ok: false,
          httpStatus: res.status,
          error: body?.error ?? `Unexpected response from the server (HTTP ${res.status})`,
        });
        return;
      }

      const data = body as IngestionClientResponse;
      setOutcome({ ok: true, httpStatus: res.status, data });
      onIngestionSuccess(data);
    } catch (err) {
      setOutcome({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to reach the server',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column (7 cols): Voice Console & Recording Form */}
      <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative backdrop-blur-xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-sky-950/80 border border-sky-800 text-sky-400 shrink-0">
              <Mic aria-hidden="true" className={`w-6 h-6 ${isSimulatingAudio ? 'animate-bounce text-red-400' : ''}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex flex-wrap items-center gap-2">
                Voice Stream Ingestion Console
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700 font-mono">
                  Demo Mode · POST /api/omi/simulate
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated Omi events run through the same ingestion service as the real webhook (POST /api/omi/webhook).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSimulateVoice}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition shrink-0 ${
              isSimulatingAudio
                ? 'bg-rose-950/90 text-rose-300 border-rose-700 animate-pulse'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Volume2 aria-hidden="true" className="w-4 h-4" />
            <span>{isSimulatingAudio ? 'Streaming Voice...' : 'Simulate Voice Stream'}</span>
          </button>
        </div>

        {/* Audio Waveform Visualizer (decorative) */}
        <div aria-hidden="true" className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isSimulatingAudio ? 'bg-red-400 animate-ping' : 'bg-emerald-400'}`} />
            <span className="text-xs font-medium text-slate-300">
              {isSimulatingAudio ? 'Live Audio Waveform Ingesting (16kHz / Opus)...' : 'Omi Voice Stream Ready (Idle Buffer)'}
            </span>
          </div>

          <div className="flex items-center gap-1 h-5">
            {[40, 75, 55, 90, 60, 80, 45, 95, 70, 85, 50, 65].map((height, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-300 ${
                  isSimulatingAudio ? 'bg-sky-400 animate-pulse' : 'bg-slate-700'
                }`}
                style={{
                  height: isSimulatingAudio ? `${height}%` : '25%',
                  animationDelay: `${i * 70}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isSubmitting}>
          {/* Transcript Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor={transcriptId} className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Spoken Transcript Buffer
              </label>
              <button
                type="button"
                onClick={() => setShowJsonPayload((v) => !v)}
                aria-expanded={showJsonPayload}
                className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1 transition"
              >
                <Code2 aria-hidden="true" className="w-3.5 h-3.5" />
                <span>{showJsonPayload ? 'Hide JSON Schema' : 'Inspect Payload Schema'}</span>
              </button>
            </div>
            <textarea
              id={transcriptId}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={4}
              maxLength={20000}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition font-sans leading-relaxed shadow-inner"
              placeholder="Speak or enter meeting transcript..."
              required
            />
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Privacy Scope */}
            <div className="space-y-1.5">
              <label htmlFor={scopeId} className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Shield aria-hidden="true" className="w-3.5 h-3.5 text-sky-400" /> Privacy Scope
              </label>
              <select
                id={scopeId}
                value={privacyScope}
                onChange={(e) => handleScopeChange(e.target.value as PrivacyScope)}
                className={`${INPUT_CLASS} cursor-pointer`}
              >
                <option value="team">Team (Standard Shared)</option>
                <option value="public">Public (Workspace Open)</option>
                <option value="confidential">Confidential (Executive Only)</option>
                <option value="do_not_retain">Do Not Retain (Zero Storage)</option>
              </select>
            </div>

            {/* Retention Policy */}
            <div className="space-y-1.5">
              <label htmlFor={retentionId} className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Clock aria-hidden="true" className="w-3.5 h-3.5 text-indigo-400" /> Retention Policy
              </label>
              <select
                id={retentionId}
                value={isDoNotRetain ? 'ephemeral_session' : retentionPolicy}
                onChange={(e) => setRetentionPolicy(e.target.value as RetentionPolicy)}
                disabled={isDoNotRetain}
                aria-describedby={isDoNotRetain ? `${retentionId}-hint` : undefined}
                className={`${INPUT_CLASS} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="30d">30 Days</option>
                <option value="7d">7 Days</option>
                <option value="forever">Forever (Indefinite)</option>
                <option value="ephemeral_session">Ephemeral (Session Only)</option>
              </select>
              {isDoNotRetain && (
                <p id={`${retentionId}-hint`} className="text-[11px] text-amber-300/90">
                  Locked to ephemeral: nothing is stored under Do Not Retain.
                </p>
              )}
            </div>

            {/* Session Tag */}
            <div className="space-y-1.5">
              <label htmlFor={sessionFieldId} className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Radio aria-hidden="true" className="w-3.5 h-3.5 text-purple-400" /> Session Tag
              </label>
              <input
                id={sessionFieldId}
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                maxLength={128}
                className={`${INPUT_CLASS} font-mono`}
                placeholder="session-api-review"
              />
            </div>

            {/* Meeting time */}
            <div className="space-y-1.5">
              <label htmlFor={timeFieldId} className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Clock aria-hidden="true" className="w-3.5 h-3.5 text-emerald-400" /> Meeting Time (ISO, UTC)
              </label>
              <input
                id={timeFieldId}
                type="text"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                aria-invalid={!timeIsValid}
                aria-describedby={`${timeFieldId}-hint`}
                className={`${INPUT_CLASS} font-mono ${timeIsValid ? '' : 'border-rose-600'}`}
              />
              <p id={`${timeFieldId}-hint`} className={`text-[11px] ${timeIsValid ? 'text-slate-500' : 'text-rose-300'}`}>
                {timeIsValid
                  ? 'Deadlines like “by Friday” resolve from this date.'
                  : 'Enter a valid ISO date, e.g. 2026-10-06T15:00:00.000Z'}
              </p>
            </div>
          </div>

          {/* JSON Payload Drawer */}
          {showJsonPayload && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto shadow-inner">
              <div className="text-slate-500 mb-2">
                {'// Outgoing simulator payload (userId and workspaceId are attached by the server):'}
              </div>
              <pre>
                {JSON.stringify(
                  {
                    eventId: 'evt-sim-<generated on send>',
                    source: 'omi_simulator',
                    sessionId,
                    timestamp: timeIsValid ? new Date(meetingTime).toISOString() : meetingTime,
                    transcript,
                    privacyScope,
                    retentionPolicy: isDoNotRetain ? 'ephemeral_session' : retentionPolicy,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span aria-hidden="true" className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Direct invocation of the shared IngestionService pipeline</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !transcript.trim() || !timeIsValid}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold shadow-xl shadow-sky-500/25 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <Send aria-hidden="true" className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Ingesting via Omi...' : 'Ingest Voice Event into Copilot'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Right Column (5 cols): Scenario Presets & Live Ingestion Inspector */}
      <div className="lg:col-span-5 space-y-6">
        {/* Scenario Presets Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles aria-hidden="true" className="w-4 h-4 text-sky-400" />
              Quick-Test Scenarios
            </h3>
            <span className="text-[11px] text-slate-500">1-Click Load</span>
          </div>

          <div className="space-y-3">
            {SIMULATOR_PRESETS.map((p) => {
              const isSelected = selectedPresetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  aria-pressed={isSelected}
                  className={`w-full text-left p-4 rounded-2xl border transition text-xs relative ${
                    isSelected
                      ? 'bg-sky-950/60 border-sky-500/80 ring-1 ring-sky-500/40'
                      : 'bg-slate-950/50 hover:bg-slate-950 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200 mb-1 flex items-center justify-between">
                    <span>{p.name}</span>
                    {isSelected && (
                      <span className="text-[10px] font-mono text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {p.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Ingestion Result Card */}
        <div aria-live="polite">
          {outcome && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {outcome.ok ? (
                    <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle aria-hidden="true" className="w-4 h-4 text-rose-400" />
                  )}
                  Live Ingestion Result
                </h3>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                    outcome.ok
                      ? 'text-emerald-400 bg-emerald-950 border-emerald-800'
                      : 'text-rose-300 bg-rose-950 border-rose-800'
                  }`}
                >
                  {outcome.httpStatus ? `HTTP ${outcome.httpStatus}` : 'No response'}
                </span>
              </div>

              {outcome.ok && outcome.data ? (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-300 leading-relaxed">{outcome.data.result.message}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">Extracted Tasks:</span>
                      <strong className="text-sky-300 text-sm">
                        {outcome.data.result.actionItemsExtracted} Task(s)
                      </strong>
                      {outcome.data.result.actionItemsPersisted === 0 && outcome.data.result.actionItemsExtracted > 0 && (
                        <span className="block text-amber-300/90 mt-0.5">Not saved (Do Not Retain)</span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">Timeline Delta:</span>
                      <strong
                        className={
                          outcome.data.result.changeDetected ? 'text-amber-400 text-sm font-bold' : 'text-slate-300 text-sm'
                        }
                      >
                        {outcome.data.result.changeDetected ? '⚡ Change Flagged' : 'Consistent'}
                      </strong>
                    </div>
                  </div>

                  {onNavigateTab && (
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigateTab('actions')}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <span>View in Action Items & Deltas</span>
                        <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 text-sky-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigateTab('agents')}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <span>Inspect in Lyzr Agent Pipeline</span>
                        <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 text-purple-400" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center gap-2"
                >
                  <AlertTriangle aria-hidden="true" className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{outcome.error || 'Failed to process payload'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
