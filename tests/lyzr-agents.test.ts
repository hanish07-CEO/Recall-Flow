import { describe, it, expect, beforeEach } from 'vitest';
import { IngestionService } from '../src/lib/services/ingestionService';
import { getQdrantRepository } from '../src/lib/adapters/qdrant';
import { getLyzrWorkflow } from '../src/lib/adapters/lyzr';

describe('Lyzr Multi-Agent Workflow Engine - Core User Journey', () => {
  beforeEach(async () => {
    const repo = getQdrantRepository();
    await repo.resetToSeed();
  });

  it('executes full multi-agent pipeline for primary transcript scenario', async () => {
    const primaryPayload = {
      eventId: 'evt-test-primary',
      source: 'omi_simulator',
      userId: 'user-default',
      workspaceId: 'workspace-default',
      sessionId: 'session-20261006-api-review',
      timestamp: '2026-10-06T15:00:00.000Z',
      transcript:
        'During today’s API review, Priya will benchmark caching by Friday. We also need to revisit the Qdrant cost issue discussed last Tuesday.',
      privacyScope: 'team',
      retentionPolicy: '30d',
    };

    // 1. Process text as Omi-compatible voice transcript via shared ingestion service
    const { result, workflowRun } = await IngestionService.ingestOmiEvent(primaryPayload);

    expect(result.success).toBe(true);
    expect(result.status).toBe('stored');

    // 2. Extract Task, Owner, Due Date, Priority, Status
    expect(workflowRun.actionItems.length).toBeGreaterThan(0);
    const actionItem = workflowRun.actionItems[0];
    expect(actionItem.task).toBe('Benchmark caching');
    expect(actionItem.owner).toBe('Priya');
    expect(actionItem.dueDate).toBe('2026-10-09'); // Friday, October 9, 2026
    expect(actionItem.priority).toBe('high');
    expect(actionItem.status).toBe('open');

    // 3. Retrieve earlier Qdrant-cost context
    expect(workflowRun.retrievedContexts.length).toBeGreaterThan(0);
    const costContext = workflowRun.retrievedContexts.find((c) =>
      c.transcriptText.toLowerCase().includes('qdrant')
    );
    expect(costContext).toBeDefined();
    expect(costContext?.meetingDate).toBe('2026-09-29'); // Last Tuesday
    expect(costContext?.transcriptText).toContain('escalating Qdrant cluster costs');

    // 4. Detect that caching deadline changed from Thursday to Friday
    expect(workflowRun.changeDetected).toBeDefined();
    expect(workflowRun.changeDetected?.field).toBe('dueDate');
    expect(workflowRun.changeDetected?.oldValue).toContain('Thursday');
    expect(workflowRun.changeDetected?.newValue).toContain('Friday');
    expect(actionItem.previousDeadline).toBe('2026-10-08');

    // 5. Verify Lyzr Agent Workflow trace structure
    expect(workflowRun.trace.steps.length).toBe(5);
    const agentNames = workflowRun.trace.steps.map((s) => s.agentName);
    expect(agentNames).toContain('PrivacyEnforcementAgent');
    expect(agentNames).toContain('ContextRetrievalAgent');
    expect(agentNames).toContain('ActionExtractionAgent');
    expect(agentNames).toContain('ChangeDetectionAgent');
    expect(agentNames).toContain('EvidenceSynthesizerAgent');

    // Verify thoughts and timing
    for (const step of workflowRun.trace.steps) {
      expect(step.thoughtProcess.length).toBeGreaterThan(10);
      expect(step.status).toMatch(/completed|warning|idle/);
    }
  });

  it('answers evidence-backed question citing timestamps and session IDs', async () => {
    const repo = getQdrantRepository();
    const workflow = getLyzrWorkflow();

    const qaResult = await workflow.answerQuestion(
      'What was decided about the Qdrant cost issue discussed last Tuesday?',
      'user-default',
      'workspace-default',
      ['team', 'public'],
      repo
    );

    expect(qaResult.answer).toContain('September 29, 2026');
    expect(qaResult.answer).toContain('scalar quantization');
    expect(qaResult.confidence).toBeGreaterThan(0.9);
    expect(qaResult.citations.length).toBeGreaterThan(0);
    expect(qaResult.citations[0].sessionId).toBe('session-20260929-api-review');
    expect(qaResult.citations[0].meetingDate).toBe('2026-09-29');
  });
});
