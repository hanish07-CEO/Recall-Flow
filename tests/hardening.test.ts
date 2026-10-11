import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { IngestionService } from '../src/lib/services/ingestionService';
import { getQdrantRepository } from '../src/lib/adapters/qdrant';
import { HttpError } from '../src/lib/errors';
import { narrowScopes, resolveCaller, scopesForUser } from '../src/lib/auth/caller';
import { POST as webhookPOST } from '../src/app/api/omi/webhook/route';

const basePayload = {
  eventId: 'evt-hardening',
  source: 'omi_simulator',
  userId: 'user-default',
  workspaceId: 'workspace-default',
  sessionId: 'session-hardening',
  timestamp: '2026-10-06T14:00:00Z',
  transcript: 'Quick sync about the roadmap.',
  privacyScope: 'team',
  retentionPolicy: '30d',
};

async function rejection(promise: Promise<unknown>): Promise<HttpError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(HttpError);
    return error as HttpError;
  }
  throw new Error('Expected the promise to reject');
}

describe('Hardening', () => {
  beforeEach(async () => {
    await getQdrantRepository().resetToSeed();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('secret scrubbing', () => {
    it('redacts every secret in a transcript, not just the first', async () => {
      const repo = getQdrantRepository();
      const { result, workflowRun } = await IngestionService.ingestOmiEvent({
        ...basePayload,
        sessionId: 'session-two-secrets',
        transcript:
          'Keys are sk_live_AAAA1111 and sk_live_BBBB2222, and password: hunter2 for staging.',
      });

      expect(result.status).toBe('scrubbed');
      expect(workflowRun.memoryRecord).toBeDefined();
      const stored = await repo.getMemory(workflowRun.memoryRecord!.memoryId);
      expect(stored?.transcriptText).not.toContain('AAAA1111');
      expect(stored?.transcriptText).not.toContain('BBBB2222');
      expect(stored?.transcriptText).not.toContain('hunter2');
    });
  });

  describe('do_not_retain', () => {
    it('forces an ephemeral retention policy and persists nothing', async () => {
      const repo = getQdrantRepository();
      const before = (await repo.listActionItems({ workspaceId: 'workspace-default' })).length;

      const { result } = await IngestionService.ingestOmiEvent({
        ...basePayload,
        sessionId: 'session-dnr-hardening',
        transcript: 'Off the record, Priya will rotate the staging credentials by Friday.',
        privacyScope: 'do_not_retain',
        retentionPolicy: 'forever',
      });

      expect(result.status).toBe('purged_do_not_retain');
      expect(result.retentionPolicy).toBe('ephemeral_session');
      expect(result.actionItemsPersisted).toBe(0);

      const after = await repo.listActionItems({ workspaceId: 'workspace-default' });
      expect(after.length).toBe(before);
      const memories = await repo.listMemories({ sessionId: 'session-dnr-hardening' });
      expect(memories).toHaveLength(0);
    });
  });

  describe('action item updates', () => {
    it('reports the extracted status as open but keeps recorded progress when persisting', async () => {
      const repo = getQdrantRepository();
      const { workflowRun } = await IngestionService.ingestOmiEvent({
        ...basePayload,
        sessionId: 'session-20261006-api-review',
        transcript:
          'During today’s API review, Priya will benchmark caching by Friday. We also need to revisit the Qdrant cost issue discussed last Tuesday.',
      });

      const extracted = workflowRun.actionItems[0];
      expect(extracted.status).toBe('open');

      const persisted = await repo.getActionItem(extracted.id);
      expect(persisted?.status).toBe('in_progress');
      expect(persisted?.dueDate).toBe('2026-10-09');
    });
  });

  describe('webhook authentication', () => {
    it('rejects a missing or wrong secret and accepts the right one', async () => {
      vi.stubEnv('OMI_WEBHOOK_SECRET', 'shh-its-a-secret');

      expect((await rejection(IngestionService.ingestOmiEvent(basePayload))).statusCode).toBe(401);
      expect(
        (await rejection(IngestionService.ingestOmiEvent(basePayload, 'wrong-secret'))).statusCode
      ).toBe(401);

      const ok = await IngestionService.ingestOmiEvent(basePayload, 'Bearer shh-its-a-secret');
      expect(ok.result.success).toBe(true);
    });

    it('fails closed in production when no secret is configured', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('OMI_WEBHOOK_SECRET', '');
      vi.stubEnv('RECALLFLOW_MODE', '');

      expect((await rejection(IngestionService.ingestOmiEvent(basePayload))).statusCode).toBe(503);
    });
  });

  describe('payload validation', () => {
    it('rejects a non-ISO timestamp and an oversized transcript with 400', async () => {
      const badTime = await rejection(
        IngestionService.ingestOmiEvent({ ...basePayload, timestamp: 'yesterday-ish' })
      );
      expect(badTime.statusCode).toBe(400);

      const tooLong = await rejection(
        IngestionService.ingestOmiEvent({ ...basePayload, transcript: 'a'.repeat(20_001) })
      );
      expect(tooLong.statusCode).toBe(400);
    });

    it('returns 400, not 500, for a malformed JSON body on the webhook route', async () => {
      const req = new NextRequest('http://localhost/api/omi/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{ not json',
      });
      const res = await webhookPOST(req);
      expect(res.status).toBe(400);
    });

    it('does not echo stored transcript text or retrieved memories to the client', async () => {
      const req = new NextRequest('http://localhost/api/omi/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...basePayload,
          transcript: 'Priya will benchmark caching by Friday. Revisit the Qdrant cost issue.',
        }),
      });
      const res = await webhookPOST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.workflowRun.retrievedContexts).toBeUndefined();
      expect(body.workflowRun.memoryRecord).toBeUndefined();
      expect(body.workflowRun.trace).toBeDefined();
    });
  });

  describe('caller scopes', () => {
    it('never lets a request widen a standard caller to confidential records', () => {
      const standard = scopesForUser('user-default');
      expect(narrowScopes(['public', 'team', 'confidential'], standard)).toEqual(['public', 'team']);
      expect(narrowScopes(['confidential'], standard)).toEqual([]);
    });

    it('treats unknown or malformed personas as least privilege', () => {
      const spoofed = resolveCaller(
        new Request('http://localhost/x', { headers: { 'x-recallflow-user': 'user-admin; DROP' } })
      );
      expect(spoofed.isAdmin).toBe(false);
      expect(spoofed.allowedScopes).not.toContain('confidential');

      const admin = resolveCaller(
        new Request('http://localhost/x', { headers: { 'x-recallflow-user': 'user-admin' } })
      );
      expect(admin.allowedScopes).toContain('confidential');
    });
  });
});
