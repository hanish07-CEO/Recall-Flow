import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  Mic,
  RefreshCw,
  RotateCcw,
  Shield,
  Workflow,
} from 'lucide-react';
import { ArchitectureDiagram } from '../components/ArchitectureDiagram';
import { ConfirmModal } from '../components/ConfirmModal';
import { useRecallFlow } from '../context/RecallFlowContext';
import { DOCUMENTED_API_CONTRACTS, RecallFlowApiService } from '../services/api';
import {
  DefaultPrivacySetting,
  OmiConnectionStatus,
  ServerEnvHealthResponse,
} from '../types/recallflow';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    integrationConfig,
    resetDemoData,
  } = useRecallFlow();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetSuccessBanner, setResetSuccessBanner] = useState(false);
  const [envHealth, setEnvHealth] = useState<ServerEnvHealthResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchHealthStatus = async () => {
    setIsCheckingHealth(true);
    const data = await RecallFlowApiService.checkHealth();
    setEnvHealth(data);
    setIsCheckingHealth(false);
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmReset = async () => {
    await resetDemoData();
    setIsResetModalOpen(false);
    setResetSuccessBanner(true);
    setTimeout(() => setResetSuccessBanner(false), 3500);
  };

  const webhookUrl =
    envHealth?.webhookUrl || integrationConfig.OMI_WEBHOOK_URL;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400">
            <Shield className="h-3.5 w-3.5" />
            <span>Governance, Retention Policies & Integration Contracts</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Privacy and memory settings
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            RecallFlow filters memory retrieval by user, workspace, privacy scope, and retention policy.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsResetModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 whitespace-nowrap"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Delete demo data</span>
        </button>
      </div>

      {resetSuccessBanner && (
        <div className="flex items-center gap-2 rounded-lg border border-teal-500/40 bg-teal-950/30 p-3.5 text-xs text-teal-200">
          <CheckCircle2 className="h-4 w-4 text-teal-400" />
          <span>
            Demo reset complete. Seeded memories, action items, and privacy settings have been restored to their initial deterministic state.
          </span>
        </div>
      )}

      {/* Privacy Policy & Retention Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-white">
              Default Privacy & Retention Policy
            </h2>
            <p className="text-xs text-slate-400">
              Applied by the Privacy Policy Agent to incoming Omi voice events
            </p>
          </div>

          {/* Default Privacy Setting */}
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Default privacy setting
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['Private', 'Workspace', 'Ask every time'] as DefaultPrivacySetting[]).map(
                (opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateSettings({ defaultPrivacy: opt })}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      settings.defaultPrivacy === opt
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-slate-800 bg-[#0B0F19] text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Default Retention */}
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Default retention
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['7 days', '30 days', 'Indefinite'] as const).map((ret) => (
                <button
                  key={ret}
                  type="button"
                  onClick={() => updateSettings({ defaultRetention: ret })}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    settings.defaultRetention === ret
                      ? 'border-teal-500 bg-teal-600 text-white'
                      : 'border-slate-800 bg-[#0B0F19] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {ret}
                </button>
              ))}
            </div>
          </div>

          {/* Omi Connection Status Simulator */}
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Omi Connection Status Indicator
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(
                ['Omi connected', 'Demo mode', 'Webhook unavailable'] as OmiConnectionStatus[]
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => updateSettings({ omiConnectionStatus: st })}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    settings.omiConnectionStatus === st
                      ? 'border-indigo-500 bg-indigo-600/30 text-indigo-200'
                      : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Toggles Card */}
        <section className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Transparency & Retention Toggles
            </h2>
            <p className="text-xs text-slate-400">
              Configure evidence grounding, agent trace telemetry, and transcript persistence
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-800 bg-[#0B0F19] p-4">
              <div>
                <div className="text-xs font-semibold text-white">
                  Show evidence with answers
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  Attach timestamped quotes and Qdrant memory IDs to every Briefing Agent response
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.showEvidenceWithAnswers}
                onChange={(e) =>
                  updateSettings({ showEvidenceWithAnswers: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-800 bg-[#0B0F19] p-4">
              <div>
                <div className="text-xs font-semibold text-white">
                  Enable agent traces
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  Display Lyzr 6-agent execution traces, input/output summaries, and durations
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.enableAgentTraces}
                onChange={(e) =>
                  updateSettings({ enableAgentTraces: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-800 bg-[#0B0F19] p-4">
              <div>
                <div className="text-xs font-semibold text-white">
                  Enable transcript retention
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  When disabled, all incoming voice notes are forced to “Do Not Retain” transient mode
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.enableTranscriptRetention}
                onChange={(e) =>
                  updateSettings({ enableTranscriptRetention: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600"
              />
            </label>
          </div>
        </section>
      </div>

      {/* Integration Configuration Cards: Omi, Qdrant, and Lyzr */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Integration Configuration (Omi, Qdrant & Lyzr)
            </h2>
            <p className="text-xs text-slate-400">
              Public endpoints and collection names are pre-filled. Private API keys are read from server environment variables and never exposed in the browser.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-indigo-300">
              DEMO_MODE={String(envHealth?.demoMode ?? integrationConfig.DEMO_MODE)}
            </span>
            <button
              type="button"
              onClick={fetchHealthStatus}
              disabled={isCheckingHealth}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0B0F19] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`}
              />
              <span>Refresh Server Env Status</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Omi Voice Input Card */}
          <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-white">
                <Mic className="h-4 w-4 text-indigo-400" />
                <span>Omi Voice Input</span>
              </span>
              <span className="text-xs text-indigo-300">
                {settings.omiConnectionStatus}
              </span>
            </div>
            <div className="space-y-2.5 font-mono text-[11px]">
              <div>
                <div className="text-slate-400">OMI_API_BASE_URL (Pre-filled)</div>
                <div className="text-teal-300">
                  {envHealth?.omiApiBaseUrl || integrationConfig.OMI_API_BASE_URL}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>OMI_WEBHOOK_URL (Pre-filled)</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('OMI_WEBHOOK_URL', webhookUrl)}
                    className="inline-flex items-center gap-1 font-sans text-[11px] text-indigo-400 hover:underline"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedField === 'OMI_WEBHOOK_URL' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="break-all text-slate-200">{webhookUrl}</div>
              </div>
              <div>
                <div className="text-slate-400">OMI_API_KEY</div>
                <div
                  className={
                    envHealth?.envPresence.OMI_API_KEY
                      ? 'text-teal-400'
                      : 'text-amber-300'
                  }
                >
                  {envHealth?.envPresence.OMI_API_KEY
                    ? 'Configured in Server Env (Masked)'
                    : integrationConfig.OMI_API_KEY}
                </div>
              </div>
              <div>
                <div className="text-slate-400">OMI_WEBHOOK_SECRET</div>
                <div
                  className={
                    envHealth?.envPresence.OMI_WEBHOOK_SECRET
                      ? 'text-teal-400'
                      : 'text-amber-300'
                  }
                >
                  {envHealth?.envPresence.OMI_WEBHOOK_SECRET
                    ? 'Configured in Server Env (Masked)'
                    : integrationConfig.OMI_WEBHOOK_SECRET}
                </div>
              </div>
            </div>
          </div>

          {/* Qdrant Persistent Memory Card */}
          <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-white">
                <Database className="h-4 w-4 text-teal-400" />
                <span>Qdrant Vector Memory</span>
              </span>
              <span className="text-xs text-teal-400">2 Collections Ready</span>
            </div>
            <div className="space-y-2.5 font-mono text-[11px]">
              <div>
                <div className="text-slate-400">
                  QDRANT_COLLECTION_MEMORIES (Pre-filled)
                </div>
                <div className="text-teal-300">
                  {integrationConfig.QDRANT_COLLECTION_MEMORIES}
                </div>
              </div>
              <div>
                <div className="text-slate-400">
                  QDRANT_COLLECTION_ACTION_ITEMS (Pre-filled)
                </div>
                <div className="text-teal-300">
                  {integrationConfig.QDRANT_COLLECTION_ACTION_ITEMS}
                </div>
              </div>
              <div>
                <div className="text-slate-400">QDRANT_URL</div>
                <div
                  className={
                    envHealth?.envPresence.QDRANT_URL
                      ? 'text-teal-400'
                      : 'text-amber-300'
                  }
                >
                  {envHealth?.envPresence.QDRANT_URL
                    ? 'Configured in Server Env'
                    : integrationConfig.QDRANT_URL}
                </div>
              </div>
              <div>
                <div className="text-slate-400">QDRANT_API_KEY</div>
                <div
                  className={
                    envHealth?.envPresence.QDRANT_API_KEY
                      ? 'text-teal-400'
                      : 'text-amber-300'
                  }
                >
                  {envHealth?.envPresence.QDRANT_API_KEY
                    ? 'Configured in Server Env (Masked)'
                    : integrationConfig.QDRANT_API_KEY}
                </div>
              </div>
            </div>
          </div>

          {/* Lyzr Multi-Agent Orchestration Card */}
          <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-white">
                <Workflow className="h-4 w-4 text-indigo-400" />
                <span>Lyzr Agent Orchestration</span>
              </span>
              <span className="text-xs text-indigo-300">6 Active Agents</span>
            </div>
            <div className="space-y-2.5 font-mono text-[11px]">
              <div>
                <div className="text-slate-400">LYZR_API_BASE_URL (Pre-filled)</div>
                <div className="break-all text-teal-300">
                  {envHealth?.lyzrApiBaseUrl || integrationConfig.LYZR_API_BASE_URL}
                </div>
              </div>
              <div>
                <div className="text-slate-400">LYZR_API_KEY</div>
                <div
                  className={
                    envHealth?.envPresence.LYZR_API_KEY
                      ? 'text-teal-400'
                      : 'text-amber-300'
                  }
                >
                  {envHealth?.envPresence.LYZR_API_KEY
                    ? 'Configured in Server Env (Masked)'
                    : integrationConfig.LYZR_API_KEY}
                </div>
              </div>
              <div>
                <div className="text-slate-400">LYZR_AGENT_CONFIG_ID</div>
                <div
                  className={
                    envHealth?.envPresence.LYZR_AGENT_CONFIG_ID
                      ? 'text-teal-400'
                      : 'text-amber-300'
                  }
                >
                  {envHealth?.envPresence.LYZR_AGENT_CONFIG_ID
                    ? 'Configured in Server Env'
                    : integrationConfig.LYZR_AGENT_CONFIG_ID}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Orchestrated Roles</div>
                <div className="font-sans text-slate-300">
                  Router · Privacy Policy · Memory Retrieval · Action Extraction · Context Reasoning · Briefing
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-Step Guide to Fetching Private Environment Variables */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-5">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-base font-semibold text-white">
            How to Fetch & Configure Your Personal Environment Variables
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Public URLs and collection names are already configured. Because API keys and cluster URLs require authenticating into your private Omi, Qdrant Cloud, and Lyzr Studio accounts, follow these exact steps from the official documentation to generate them and add them in the AI Studio Secrets panel.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Guide 1: Omi */}
          <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                01. Omi Voice & Developer API
              </span>
              <a
                href="https://docs.omi.me/doc/developer/apps/Introduction"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline"
              >
                <span>Omi Docs</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-slate-300">
              <li>
                Open the <strong>Omi Mobile App</strong> or web app and go to{' '}
                <strong>Settings → Developer Mode</strong>.
              </li>
              <li>
                Under <strong>Developer API Keys</strong> (connects to{' '}
                <code className="font-mono text-indigo-300">https://api.omi.me/v1/dev</code>), click{' '}
                <strong>Create Key</strong> to generate your{' '}
                <code className="font-mono text-teal-300">OMI_API_KEY</code>.
              </li>
              <li>
                To stream live voice memories into RecallFlow, go to{' '}
                <strong>Explore → Create an App → External Integration</strong>.
              </li>
              <li>
                Select trigger <strong>Memory Creation</strong> (or{' '}
                <strong>Real-time Transcript Processor</strong>) and paste your RecallFlow Webhook URL:
                <div className="mt-1 rounded border border-slate-800 bg-slate-900 p-2 font-mono text-[11px] break-all text-indigo-300">
                  {webhookUrl}
                </div>
              </li>
            </ol>
          </div>

          {/* Guide 2: Qdrant */}
          <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                02. Qdrant Cloud Vector Cluster
              </span>
              <a
                href="https://qdrant.tech/documentation/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-teal-400 hover:underline"
              >
                <span>Qdrant Docs</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-slate-300">
              <li>
                Log in to <strong>Qdrant Cloud</strong> at{' '}
                <a
                  href="https://cloud.qdrant.io"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-400 underline"
                >
                  cloud.qdrant.io
                </a>{' '}
                and create a free-tier 1GB cluster.
              </li>
              <li>
                Copy your cluster’s endpoint URL (format:{' '}
                <code className="font-mono text-slate-200">
                  https://&lt;cluster-id&gt;.&lt;region&gt;.cloud.qdrant.io:6333
                </code>
                ) and save it as <code className="font-mono text-teal-300">QDRANT_URL</code>.
              </li>
              <li>
                In the Qdrant Cloud sidebar, open <strong>API Keys → Create API Key</strong>, scope it to your cluster, and save the token as{' '}
                <code className="font-mono text-teal-300">QDRANT_API_KEY</code>.
              </li>
              <li>
                Collection names are already pre-set to{' '}
                <code className="font-mono text-slate-200">recallflow_memories</code> and{' '}
                <code className="font-mono text-slate-200">recallflow_action_items</code>.
              </li>
            </ol>
          </div>

          {/* Guide 3: Lyzr */}
          <div className="rounded-lg border border-slate-800 bg-[#0B0F19] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                03. Lyzr Studio Agent API
              </span>
              <a
                href="https://docs.lyzr.ai/introduction"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline"
              >
                <span>Lyzr Docs</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-slate-300">
              <li>
                Sign in to <strong>Lyzr Agent Studio</strong> at{' '}
                <a
                  href="https://studio.lyzr.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 underline"
                >
                  studio.lyzr.ai
                </a>
                .
              </li>
              <li>
                Create or open your agent workflow in <strong>Agent Builder</strong> and click the{' '}
                <strong>Agent API</strong> button in the top-right corner.
              </li>
              <li>
                From the generated cURL / JSON snippet (which targets{' '}
                <code className="font-mono text-slate-200">
                  https://agent-prod.studio.lyzr.ai/v3/inference/chat/
                </code>
                ), copy the <code className="font-mono text-slate-200">x-api-key</code> header value as{' '}
                <code className="font-mono text-teal-300">LYZR_API_KEY</code>.
              </li>
              <li>
                Copy the <code className="font-mono text-slate-200">agent_id</code> field from the request body as{' '}
                <code className="font-mono text-teal-300">LYZR_AGENT_CONFIG_ID</code>.
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Architecture Visualization */}
      <ArchitectureDiagram />

      {/* Documented Backend-Ready API Contracts */}
      <section className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white">
            Documented Backend-Ready API Contracts
          </h2>
          <p className="text-xs text-slate-400">
            REST endpoints active on the Express backend and mirrored in the client service layer
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B0F19] text-slate-400">
                <th className="px-4 py-2.5 font-medium">Method</th>
                <th className="px-4 py-2.5 font-medium">Endpoint</th>
                <th className="px-4 py-2.5 font-medium">Layer</th>
                <th className="px-4 py-2.5 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {DOCUMENTED_API_CONTRACTS.map((ep) => (
                <tr key={`${ep.method}_${ep.path}`}>
                  <td className="px-4 py-3 font-mono font-semibold text-indigo-400">
                    {ep.method}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-200">{ep.path}</td>
                  <td className="px-4 py-3 text-teal-300">{ep.integration}</td>
                  <td className="px-4 py-3 text-slate-300">{ep.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Delete Demo Data / Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reset RecallFlow Demo Data?"
        description="This action will delete any newly captured demo memories or status modifications made during this session and reset RecallFlow back to its original seeded demo dataset."
        warningDetail="Demo Reset Warning: Only local session modifications are cleared. The 4 deterministic demo records (API Review Oct 1, API Review Oct 5, Personal planning, and Temporary voice note) will be restored."
        confirmLabel="Confirm Demo Reset"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};
