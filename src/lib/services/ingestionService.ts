import { OmiWebhookPayload, IngestionResult } from '../models/omi';
import { validateOmiWebhookPayload } from '../adapters/omi/validator';
import { getQdrantRepository } from '../adapters/qdrant';
import { getLyzrWorkflow } from '../adapters/lyzr';
import { WorkflowRunResult } from '../adapters/lyzr/types';

export interface IngestionExecutionOutput {
  result: IngestionResult;
  workflowRun: WorkflowRunResult;
}

export class IngestionService {
  public static async ingestOmiEvent(
    rawPayload: unknown,
    secretHeader?: string | null
  ): Promise<IngestionExecutionOutput> {
    // 1. Validation
    const validation = validateOmiWebhookPayload(rawPayload, secretHeader);
    if (!validation.isValid || !validation.data) {
      throw {
        statusCode: validation.statusCode,
        message: validation.error || 'Invalid Omi webhook payload',
      };
    }

    const payload: OmiWebhookPayload = validation.data;
    const repository = getQdrantRepository();
    const workflow = getLyzrWorkflow();

    // 2. Dispatch to Lyzr Multi-Agent Pipeline
    const workflowRun = await workflow.processTranscript(
      {
        transcript: payload.transcript,
        userId: payload.userId,
        workspaceId: payload.workspaceId,
        sessionId: payload.sessionId,
        meetingDate: payload.timestamp.slice(0, 10),
        privacyScope: payload.privacyScope,
        retentionPolicy: payload.retentionPolicy,
      },
      repository
    );

    // 3. Format Ingestion Result
    const isDoNotRetain = payload.privacyScope === 'do_not_retain';
    const status: IngestionResult['status'] = isDoNotRetain
      ? 'purged_do_not_retain'
      : workflowRun.privacyStatus === 'scrubbed'
      ? 'scrubbed'
      : 'stored';

    const result: IngestionResult = {
      success: true,
      eventId: payload.eventId,
      memoryId: workflowRun.memoryRecord?.memoryId,
      status,
      privacyScope: payload.privacyScope || 'team',
      retentionPolicy: payload.retentionPolicy || '30d',
      actionItemsExtracted: workflowRun.actionItems.length,
      changeDetected: !!workflowRun.changeDetected,
      agentTraceId: workflowRun.trace.traceId,
      message: isDoNotRetain
        ? 'Processed through Lyzr agents; purged from long-term Qdrant storage (Zero Retention Policy).'
        : `Successfully processed through Lyzr agents and stored in Qdrant (Scope: ${payload.privacyScope || 'team'}).`,
    };

    return {
      result,
      workflowRun,
    };
  }
}
