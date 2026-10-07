import { NextResponse } from 'next/server';
import { getQdrantRepository } from '@/lib/adapters/qdrant';
import { getLyzrWorkflow } from '@/lib/adapters/lyzr';

export async function GET() {
  const omiSecret = process.env.OMI_WEBHOOK_SECRET;
  const qdrantUrl = process.env.QDRANT_URL;
  const lyzrKey = process.env.LYZR_API_KEY;
  const forcedMode = process.env.RECALLFLOW_MODE;

  const repo = getQdrantRepository();
  const workflow = getLyzrWorkflow();
  const repoHealthy = await repo.isHealthy();

  // Status mapping
  const isDemo = forcedMode === 'demo' || !qdrantUrl || !lyzrKey;

  const status = {
    mode: isDemo ? 'demo' : 'production',
    modeLabel: isDemo ? 'Demo Mode (Local State)' : 'Production Mode (Live Cloud)',
    integrations: {
      omi: {
        status: omiSecret ? 'connected' : 'demo_mode',
        label: omiSecret ? 'Omi Connected (Verified)' : 'Demo Mode (Simulated)',
        secretConfigured: !!omiSecret,
        webhookUrl: '/api/omi/webhook',
      },
      qdrant: {
        status: repo.isDemo ? 'demo_mode' : repoHealthy ? 'connected' : 'unavailable',
        label: repo.isDemo ? 'Qdrant (In-Memory Simulator)' : repoHealthy ? 'Qdrant Cloud Connected' : 'Qdrant Connection Failed',
        adapterName: repo.name,
        collections: ['recallflow_memories', 'recallflow_action_items'],
      },
      lyzr: {
        status: workflow.isDemo ? 'demo_mode' : 'connected',
        label: workflow.isDemo ? 'Lyzr Multi-Agent Simulator' : 'Lyzr Agent Cloud Connected',
        workflowName: workflow.name,
        agents: [
          'PrivacyEnforcementAgent',
          'ContextRetrievalAgent',
          'ActionExtractionAgent',
          'ChangeDetectionAgent',
          'EvidenceSynthesizerAgent',
        ],
      },
    },
    systemTime: new Date().toISOString(),
  };

  return NextResponse.json(status);
}
