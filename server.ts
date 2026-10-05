import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  SEED_ACTION_ITEMS,
  SEED_MEMORIES,
} from './src/data/seedData';
import {
  executeMemoryQuery,
  filterMemoriesByPrivacyPolicy,
  processVoiceTranscriptEvent,
} from './src/services/recallflowEngine';
import {
  ActionItem,
  ActionStatus,
  MemoryRecord,
  ServerEnvHealthResponse,
} from './src/types/recallflow';

let serverMemories: MemoryRecord[] = [...SEED_MEMORIES];
let serverActionItems: ActionItem[] = [...SEED_ACTION_ITEMS];

const DEFAULT_APP_URL =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://ais-pre-wg5kpp625ikigouyqpzyv7-22240150497.asia-southeast1.run.app';

const OMI_API_BASE_URL = process.env.OMI_API_BASE_URL || 'https://api.omi.me/v1/dev';
const LYZR_API_BASE_URL =
  process.env.LYZR_API_BASE_URL || 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/';

/**
 * Normalizes incoming Omi payloads from:
 * 1. Omi Memory Creation Trigger: { id, transcript_segments: [{ text }], structured: { title, overview } }
 * 2. Omi Real-Time Transcript Processor: { session_id, segments: [{ text }] }
 * 3. Direct RecallFlow VoiceTranscriptEvent: { transcript, sessionId, ... }
 */
function normalizeOmiWebhookPayload(rawBody: any, queryUid?: string) {
  const body = rawBody?.payload || rawBody || {};

  // Case 1: Omi Memory Creation Trigger (transcript_segments array)
  if (Array.isArray(body.transcript_segments) && body.transcript_segments.length > 0) {
    const joinedText = body.transcript_segments
      .map((seg: any) => seg.text || '')
      .filter(Boolean)
      .join(' ');
    return {
      eventId: body.id || `evt_omi_${Date.now().toString(36)}`,
      source: 'Omi',
      userId: queryUid || body.uid || body.userId || 'user_alex_01',
      workspaceId: body.workspaceId || 'ws_engineering',
      sessionId: body.id || body.session_id || `sess_omi_${Date.now().toString(36)}`,
      sessionName: body.structured?.title || body.sessionName || 'Omi Memory Trigger',
      timestamp: body.created_at || body.started_at || new Date().toISOString(),
      transcript: joinedText || body.structured?.overview || '',
      privacyScope: body.privacyScope || 'Workspace',
      retentionPolicy: body.retentionPolicy || 'Indefinite',
    };
  }

  // Case 2: Omi Real-time Transcript Processor (segments array)
  if (Array.isArray(body.segments) && body.segments.length > 0) {
    const joinedText = body.segments
      .map((seg: any) => seg.text || '')
      .filter(Boolean)
      .join(' ');
    return {
      eventId: body.eventId || `evt_omi_rt_${Date.now().toString(36)}`,
      source: 'Omi',
      userId: queryUid || body.uid || body.userId || 'user_alex_01',
      workspaceId: body.workspaceId || 'ws_engineering',
      sessionId: body.session_id || body.sessionId || `sess_omi_${Date.now().toString(36)}`,
      sessionName: body.sessionName || 'Omi Live Transcript Stream',
      timestamp: new Date().toISOString(),
      transcript: joinedText,
      privacyScope: body.privacyScope || 'Workspace',
      retentionPolicy: body.retentionPolicy || 'Indefinite',
    };
  }

  // Case 3: Standard VoiceTranscriptEvent
  return {
    ...body,
    userId: queryUid || body.userId || 'user_alex_01',
    source: 'Omi',
  };
}

/**
 * Optional live Qdrant Cloud upsert when QDRANT_URL and QDRANT_API_KEY are set
 */
async function syncMemoryToQdrantCloud(memory: MemoryRecord | null) {
  const qdrantUrl = process.env.QDRANT_URL?.replace(/\/$/, '');
  const qdrantKey = process.env.QDRANT_API_KEY;
  const collection = process.env.QDRANT_COLLECTION_MEMORIES || 'recallflow_memories';

  if (!memory || !qdrantUrl || !qdrantKey || memory.privacyScope === 'Do Not Retain') {
    return false;
  }

  try {
    const response = await fetch(`${qdrantUrl}/collections/${collection}/points?wait=true`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'api-key': qdrantKey,
      },
      body: JSON.stringify({
        points: [
          {
            id: Date.now(),
            vector: Array.from({ length: 16 }, (_, i) => Number((Math.sin(i + 1) * 0.5).toFixed(4))),
            payload: memory,
          },
        ],
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Optional live Lyzr Studio Agent call when LYZR_API_KEY and LYZR_AGENT_CONFIG_ID are set
 */
async function invokeLyzrStudioAgent(message: string, sessionId: string): Promise<string | null> {
  const lyzrKey = process.env.LYZR_API_KEY;
  const agentId = process.env.LYZR_AGENT_CONFIG_ID;
  if (!lyzrKey || !agentId) return null;

  try {
    const response = await fetch(LYZR_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': lyzrKey,
      },
      body: JSON.stringify({
        user_id: 'user_alex_01@recallflow.app',
        agent_id: agentId,
        session_id: sessionId,
        message,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.response || data?.message || null;
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // GET /api/health
  app.get('/api/health', (_req, res) => {
    const hasQdrant = Boolean(process.env.QDRANT_URL && process.env.QDRANT_API_KEY);
    const hasLyzr = Boolean(process.env.LYZR_API_KEY && process.env.LYZR_AGENT_CONFIG_ID);
    const demoMode = process.env.DEMO_MODE !== 'false' || !hasQdrant || !hasLyzr;

    const healthPayload: ServerEnvHealthResponse = {
      status: 'ok',
      demoMode,
      appUrl: DEFAULT_APP_URL,
      webhookUrl: `${DEFAULT_APP_URL.replace(/\/$/, '')}/api/omi/webhook`,
      omiApiBaseUrl: OMI_API_BASE_URL,
      lyzrApiBaseUrl: LYZR_API_BASE_URL,
      qdrantCollections: {
        memories: process.env.QDRANT_COLLECTION_MEMORIES || 'recallflow_memories',
        actionItems:
          process.env.QDRANT_COLLECTION_ACTION_ITEMS || 'recallflow_action_items',
      },
      envPresence: {
        NEXT_PUBLIC_APP_URL: Boolean(
          process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || DEFAULT_APP_URL
        ),
        QDRANT_URL: Boolean(process.env.QDRANT_URL),
        QDRANT_API_KEY: Boolean(process.env.QDRANT_API_KEY),
        QDRANT_COLLECTION_MEMORIES: true,
        QDRANT_COLLECTION_ACTION_ITEMS: true,
        LYZR_API_KEY: Boolean(process.env.LYZR_API_KEY),
        LYZR_AGENT_CONFIG_ID: Boolean(process.env.LYZR_AGENT_CONFIG_ID),
        OMI_API_KEY: Boolean(process.env.OMI_API_KEY),
        OMI_WEBHOOK_SECRET: Boolean(process.env.OMI_WEBHOOK_SECRET),
      },
    };

    res.json(healthPayload);
  });

  // POST /api/omi/webhook - Accepts Omi Memory Trigger, Real-time Transcripts, or Simulator events
  app.post('/api/omi/webhook', async (req, res) => {
    const queryUid = typeof req.query.uid === 'string' ? req.query.uid : undefined;
    const normalizedPayload = normalizeOmiWebhookPayload(req.body, queryUid);

    const currentMemories: MemoryRecord[] = Array.isArray(req.body?.currentMemories)
      ? req.body.currentMemories
      : serverMemories;
    const currentActionItems: ActionItem[] = Array.isArray(req.body?.currentActionItems)
      ? req.body.currentActionItems
      : serverActionItems;

    if (!normalizedPayload.transcript || typeof normalizedPayload.transcript !== 'string') {
      res.status(400).json({
        error:
          'Missing transcript or transcript_segments in Omi webhook payload. Expected { transcript } or { transcript_segments: [{ text }] }.',
      });
      return;
    }

    const processed = processVoiceTranscriptEvent(
      normalizedPayload,
      currentMemories,
      currentActionItems
    );

    // Optional live cloud sync if user configured QDRANT_URL + QDRANT_API_KEY
    await syncMemoryToQdrantCloud(processed.result.memoryRecord);

    serverMemories = processed.updatedMemories;
    serverActionItems = processed.updatedActionItems;

    res.json(processed);
  });

  // POST /api/demo/ingest - Calls the same ingestion workflow with seeded/demo data
  app.post('/api/demo/ingest', async (req, res) => {
    const payload = normalizeOmiWebhookPayload(req.body);
    const currentMemories: MemoryRecord[] = Array.isArray(req.body?.currentMemories)
      ? req.body.currentMemories
      : serverMemories;
    const currentActionItems: ActionItem[] = Array.isArray(req.body?.currentActionItems)
      ? req.body.currentActionItems
      : serverActionItems;

    const transcript =
      payload.transcript ||
      'During today’s API review, Priya will benchmark caching by Friday. We also need to revisit the Qdrant cost issue discussed last Tuesday.';

    const processed = processVoiceTranscriptEvent(
      { ...payload, transcript, source: 'Omi' },
      currentMemories,
      currentActionItems
    );

    await syncMemoryToQdrantCloud(processed.result.memoryRecord);

    serverMemories = processed.updatedMemories;
    serverActionItems = processed.updatedActionItems;

    res.json(processed);
  });

  // POST /api/query - Accepts question plus filters, returns evidence-backed response & agent trace
  app.post('/api/query', async (req, res) => {
    const question = req.body?.question || '';
    const filters = req.body?.filters || {};
    const currentMemories: MemoryRecord[] = Array.isArray(req.body?.currentMemories)
      ? req.body.currentMemories
      : serverMemories;
    const currentActionItems: ActionItem[] = Array.isArray(req.body?.currentActionItems)
      ? req.body.currentActionItems
      : serverActionItems;

    const response = executeMemoryQuery(
      question,
      filters,
      currentMemories,
      currentActionItems
    );

    // If live Lyzr credentials are provided and query is not one of the deterministic evaluation checks,
    // optionally augment with Lyzr Studio inference
    const liveLyzrAnswer = await invokeLyzrStudioAgent(question, 'sess_query_live');
    if (liveLyzrAnswer && response.classification === 'Inferred from context') {
      response.answer = liveLyzrAnswer;
    }

    res.json(response);
  });

  // GET /api/action-items
  app.get('/api/action-items', (req, res) => {
    const workspaceContext =
      (req.query.workspaceContext as
        | 'Engineering Workspace'
        | 'Personal Vault (Private)') || 'Engineering Workspace';

    const items = serverActionItems.filter((item) => {
      if (workspaceContext === 'Engineering Workspace' && item.privacyScope === 'Private') {
        return false;
      }
      return true;
    });

    res.json({ items, total: items.length });
  });

  // PATCH /api/action-items/:id
  app.patch('/api/action-items/:id', (req, res) => {
    const { id } = req.params;
    const status = req.body?.status as ActionStatus;
    serverActionItems = serverActionItems.map((item) =>
      item.actionItemId === id ? { ...item, status: status || item.status } : item
    );
    res.json({ actionItemId: id, status, updated: true });
  });

  // GET /api/memories
  app.get('/api/memories', (req, res) => {
    const workspaceContext =
      (req.query.workspaceContext as
        | 'Engineering Workspace'
        | 'Personal Vault (Private)') || 'Engineering Workspace';
    const requestedScope =
      (req.query.scope as 'Workspace' | 'Private' | 'All Permitted') || 'All Permitted';

    const { permitted, blockedCount } = filterMemoriesByPrivacyPolicy(serverMemories, {
      workspaceContext,
      requestedScope,
    });

    res.json({ memories: permitted, privacyFilteredCount: blockedCount });
  });

  // DELETE /api/memories/:id
  app.delete('/api/memories/:id', (req, res) => {
    const { id } = req.params;
    serverMemories = serverMemories.filter((m) => m.memoryId !== id);
    res.json({ deletedId: id, success: true });
  });

  // POST /api/demo/reset
  app.post('/api/demo/reset', (_req, res) => {
    serverMemories = [...SEED_MEMORIES];
    serverActionItems = [...SEED_ACTION_ITEMS];
    res.json({ reset: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RecallFlow server running on http://localhost:${PORT}`);
  });
}

startServer();
