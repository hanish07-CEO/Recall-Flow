import { describe, it, expect, beforeEach } from 'vitest';
import { IngestionService } from '../src/lib/services/ingestionService';
import { getQdrantRepository } from '../src/lib/adapters/qdrant';
import { getLyzrWorkflow } from '../src/lib/adapters/lyzr';

describe('Privacy and Retention Enforcement', () => {
  beforeEach(async () => {
    const repo = getQdrantRepository();
    await repo.resetToSeed();
  });

  it('purges and does not store do_not_retain events in long-term memory', async () => {
    const repo = getQdrantRepository();
    const ephemeralPayload = {
      eventId: 'evt-do-not-retain-test',
      source: 'omi_simulator',
      userId: 'user-default',
      workspaceId: 'workspace-default',
      sessionId: 'session-ephemeral-1',
      timestamp: '2026-10-06T14:00:00Z',
      transcript: 'Off the record: discussion regarding temporary test environment keys.',
      privacyScope: 'do_not_retain',
      retentionPolicy: 'ephemeral_session',
    };

    const { result } = await IngestionService.ingestOmiEvent(ephemeralPayload);
    expect(result.status).toBe('purged_do_not_retain');

    // Confirm it was NOT stored in Qdrant
    const memories = await repo.listMemories({
      workspaceId: 'workspace-default',
      sessionId: 'session-ephemeral-1',
    });
    expect(memories.length).toBe(0);
  });

  it('redacts sensitive API tokens before storing in Qdrant', async () => {
    const repo = getQdrantRepository();
    const payloadWithSecret = {
      eventId: 'evt-secret-test',
      source: 'omi_simulator',
      userId: 'user-default',
      workspaceId: 'workspace-default',
      sessionId: 'session-secret-1',
      timestamp: '2026-10-06T14:30:00Z',
      transcript: 'Please verify the token sk_live_9876543210abcdef before deployment.',
      privacyScope: 'team',
      retentionPolicy: '30d',
    };

    const { result, workflowRun } = await IngestionService.ingestOmiEvent(payloadWithSecret);
    expect(result.status).toBe('scrubbed');

    // Check memory text in repository
    expect(workflowRun.memoryRecord).toBeDefined();
    const stored = await repo.getMemory(workflowRun.memoryRecord!.memoryId);
    expect(stored?.transcriptText).toContain('[REDACTED_SECRET]');
    expect(stored?.transcriptText).not.toContain('sk_live_9876543210abcdef');
  });

  it('blocks unauthorized access to confidential records during QA search', async () => {
    const repo = getQdrantRepository();
    const workflow = getLyzrWorkflow();

    // Standard user with only 'team' and 'public' permissions
    const standardRes = await workflow.answerQuestion(
      'What were the executive compensation and bonus numbers?',
      'user-default',
      'workspace-default',
      ['team', 'public'],
      repo
    );

    expect(standardRes.answer).toContain('Privacy Shield Active');
    expect(standardRes.privacyFilteredCount).toBeGreaterThanOrEqual(1);

    // Privileged admin with 'confidential' permission
    const adminRes = await workflow.answerQuestion(
      'What were the executive compensation and bonus numbers?',
      'user-admin',
      'workspace-default',
      ['team', 'public', 'confidential'],
      repo
    );

    expect(adminRes.answer).not.toContain('Privacy Shield Active');
    expect(adminRes.citations.some((c) => c.privacyScope === 'confidential')).toBe(true);
  });
});
