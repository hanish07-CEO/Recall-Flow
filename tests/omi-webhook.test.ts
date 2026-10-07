import { describe, it, expect, beforeEach } from 'vitest';
import { validateOmiWebhookPayload } from '../src/lib/adapters/omi/validator';
import { IngestionService } from '../src/lib/services/ingestionService';
import { getQdrantRepository } from '../src/lib/adapters/qdrant';

describe('Omi Webhook & Ingestion Layer', () => {
  beforeEach(async () => {
    delete process.env.OMI_WEBHOOK_SECRET;
    const repo = getQdrantRepository();
    await repo.resetToSeed();
  });

  it('validates a correct Omi webhook payload', () => {
    const validPayload = {
      eventId: 'evt-test-1',
      source: 'omi_device',
      userId: 'user-default',
      workspaceId: 'workspace-default',
      sessionId: 'session-test',
      timestamp: '2026-10-06T12:00:00Z',
      transcript: 'Testing audio transcript ingestion',
      privacyScope: 'team',
      retentionPolicy: '30d',
    };

    const res = validateOmiWebhookPayload(validPayload);
    expect(res.isValid).toBe(true);
    expect(res.data?.eventId).toBe('evt-test-1');
  });

  it('rejects an invalid payload missing required fields', () => {
    const invalidPayload = {
      eventId: 'evt-test-2',
      // missing userId, workspaceId, transcript
    };

    const res = validateOmiWebhookPayload(invalidPayload);
    expect(res.isValid).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.error).toMatch(/userId/i);
  });

  it('enforces webhook secret when configured in environment', () => {
    process.env.OMI_WEBHOOK_SECRET = 'secret_omi_123';

    const validPayload = {
      eventId: 'evt-test-3',
      source: 'omi_device',
      userId: 'user-default',
      workspaceId: 'workspace-default',
      sessionId: 'session-test',
      timestamp: '2026-10-06T12:00:00Z',
      transcript: 'Authenticated event',
    };

    // No header provided
    const resNoHeader = validateOmiWebhookPayload(validPayload, null);
    expect(resNoHeader.isValid).toBe(false);
    expect(resNoHeader.statusCode).toBe(401);

    // Wrong header
    const resWrongHeader = validateOmiWebhookPayload(validPayload, 'wrong_secret');
    expect(resWrongHeader.isValid).toBe(false);
    expect(resWrongHeader.statusCode).toBe(401);

    // Correct header
    const resValidHeader = validateOmiWebhookPayload(validPayload, 'secret_omi_123');
    expect(resValidHeader.isValid).toBe(true);
    expect(resValidHeader.statusCode).toBe(200);
  });

  it('calls shared ingestion service and stores memory for regular scope', async () => {
    const payload = {
      eventId: 'evt-test-ingest',
      source: 'omi_simulator',
      userId: 'user-default',
      workspaceId: 'workspace-default',
      sessionId: 'session-ingest-4',
      timestamp: '2026-10-06T12:00:00Z',
      transcript: 'Regular team update regarding release milestone.',
      privacyScope: 'team',
      retentionPolicy: '30d',
    };

    const { result, workflowRun } = await IngestionService.ingestOmiEvent(payload);

    expect(result.success).toBe(true);
    expect(result.status).toBe('stored');
    expect(workflowRun.trace.steps.length).toBeGreaterThanOrEqual(4);
  });
});
