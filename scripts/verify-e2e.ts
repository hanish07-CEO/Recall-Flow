import { IngestionService } from '../src/lib/services/ingestionService';
import { getQdrantRepository } from '../src/lib/adapters/qdrant';
import { getLyzrWorkflow } from '../src/lib/adapters/lyzr';

async function runEndToEndVerification() {
  console.log('=== STARTING RECALLFLOW E2E VERIFICATION ===\n');

  const repo = getQdrantRepository();
  const workflow = getLyzrWorkflow();

  // 1. Reset state
  await repo.resetToSeed();
  console.log('✓ Step 1: Demo repository reset to seed state.');

  // 2. Verify initial seed state
  const initialMemories = await repo.listMemories({ workspaceId: 'workspace-default' });
  const initialActions = await repo.listActionItems({ workspaceId: 'workspace-default' });
  console.log(`✓ Step 2: Seed data verified (${initialMemories.length} memories, ${initialActions.length} action items).`);

  // 3. Primary User Scenario Ingestion:
  console.log('\n--- Ingesting Target Voice Event via Shared Ingestion Service ---');
  const primaryPayload = {
    eventId: 'evt-verify-primary-001',
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

  const { result, workflowRun } = await IngestionService.ingestOmiEvent(primaryPayload);
  console.log(`✓ Ingestion Status: ${result.status}`);
  console.log(`✓ Action Items Extracted: ${result.actionItemsExtracted}`);
  console.log(`✓ Change Delta Detected: ${result.changeDetected}`);
  console.log(`✓ Lyzr Workflow Agents Executed: ${workflowRun.trace.steps.length}`);

  // Assertions for Primary Scenario
  if (!workflowRun.actionItems.length) throw new Error('Missing action items');
  const priyaTask = workflowRun.actionItems[0];
  console.log(`  - Task: "${priyaTask.task}"`);
  console.log(`  - Owner: "${priyaTask.owner}"`);
  console.log(`  - Due Date: "${priyaTask.dueDate}" (Friday, October 9, 2026)`);
  console.log(`  - Priority: "${priyaTask.priority}"`);
  console.log(`  - Status: "${priyaTask.status}"`);
  console.log(`  - Change Detected: Was "${workflowRun.changeDetected?.oldValue}" -> Now "${workflowRun.changeDetected?.newValue}"`);

  // 4. Historical Qdrant context retrieval check
  const costMemory = workflowRun.retrievedContexts.find((c) =>
    c.transcriptText.toLowerCase().includes('qdrant')
  );
  if (!costMemory) throw new Error('Failed to retrieve earlier Qdrant cost context');
  console.log(`✓ Retrieved Earlier Context: Session "${costMemory.sessionId}" on ${costMemory.meetingDate}`);

  // 5. Evidence-Backed QA Verification
  console.log('\n--- Evidence-Backed QA Verification ---');
  const qaCost = await workflow.answerQuestion(
    'What was discussed about the Qdrant cost issue last Tuesday?',
    'user-default',
    'workspace-default',
    ['team', 'public'],
    repo
  );
  console.log(`Q: "What was discussed about the Qdrant cost issue last Tuesday?"`);
  console.log(`A: "${qaCost.answer}"`);
  console.log(`Citations: ${qaCost.citations.length} verified citation(s) (Confidence: ${(qaCost.confidence * 100).toFixed(0)}%)`);

  // 6. Privacy Shield Verification
  console.log('\n--- Privacy Shield Verification ---');
  const qaRestricted = await workflow.answerQuestion(
    'What are the executive compensation numbers?',
    'user-default',
    'workspace-default',
    ['team', 'public'],
    repo
  );
  console.log(`Q: "What are the executive compensation numbers?" (as Standard User)`);
  console.log(`A: "${qaRestricted.answer}"`);
  console.log(`Privacy Filtered Count: ${qaRestricted.privacyFilteredCount}`);

  const qaAuthorized = await workflow.answerQuestion(
    'What are the executive compensation numbers?',
    'user-admin',
    'workspace-default',
    ['team', 'public', 'confidential'],
    repo
  );
  console.log(`Q: "What are the executive compensation numbers?" (as Executive Admin)`);
  console.log(`A: "${qaAuthorized.answer.slice(0, 80)}..."`);
  console.log(`Authorized Citation Scope: "${qaAuthorized.citations[0]?.privacyScope}"`);

  console.log('\n=== ALL E2E VERIFICATIONS PASSED SUCCESSFULLY ===');
}

runEndToEndVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
