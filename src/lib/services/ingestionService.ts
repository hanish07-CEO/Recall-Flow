import { OmiWebhookPayload, IngestionResult } from '../models/omi';
import { validateOmiWebhookPayload } from '../adapters/omi/validator';
import { getQdrantRepository } from '../adapters/qdrant';
import { getLyzrWorkflow } from '../adapters/lyzr';
import { WorkflowRunResult } from '../adapters/lyzr/types';
import { scopesForUser } from '../auth/caller';
import { HttpError } from '../errors';

export interface IngestionExecutionOutput {
  result: IngestionResult;
  workflowRun: WorkflowRunResult;
}

/** What is safe to return to a browser or device: the outcome and the agent trace, no stored text. */
export interface IngestionClientResponse {
  result: IngestionResult;
  workflowRun: { trace: WorkflowRunResult['trace'] };
}

export function toClientResponse(output: IngestionExecutionOutput): IngestionClientResponse {
  return { result: output.result, workflowRun: { trace: output.workflowRun.trace } };
}

export interface IngestOptions {
  /** Trusted in-process callers (demo simulator) skip webhook-secret verification. */
  skipSecret?: boolean;
}

export class IngestionService {
  public static async ingestOmiEvent(
    rawPayload: unknown,
    secretHeader?: string | null,
    options: IngestOptions = {}
  ): Promise<IngestionExecutionOutput> {
    // 1. Validation
    const validation = validateOmiWebhookPayload(rawPayload, secretHeader, {
      skipSecret: options.skipSecret,
    });
    if (!validation.isValid || !validation.data) {
      throw new HttpError(validation.statusCode, validation.error || 'Invalid Omi webhook payload');
    }

    const payload: OmiWebhookPayload = validation.data;
    const repository = getQdrantRepository();
    const workflow = getLyzrWorkflow();

    // Enforce retention on the write path (best effort: a purge failure must not block ingestion).
    try {
      await repository.purgeRetentionExpired();
    } catch (error) {
      console.warn('[ingestion] retention purge failed', error);
    }

    // 2. Dispatch to Lyzr Multi-Agent Pipeline.
    // Context retrieval is bounded by what the *owner* may read, never by the payload's own scope.
    const workflowRun = await workflow.processTranscript(
      {
        transcript: payload.transcript,
        userId: payload.userId,
        workspaceId: payload.workspaceId,
        sessionId: payload.sessionId,
        eventId: payload.eventId,
        source: payload.source,
        meetingDate: payload.timestamp.slice(0, 10),
        privacyScope: payload.privacyScope,
        retentionPolicy: payload.retentionPolicy,
        retrievalScopes: scopesForUser(payload.userId),
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
      actionItemsPersisted: isDoNotRetain ? 0 : workflowRun.actionItems.length,
      changeDetected: !!workflowRun.changeDetected,
      agentTraceId: workflowRun.trace.traceId,
      message: isDoNotRetain
        ? 'Analysed transiently by the agents. Nothing was written to long-term storage (Zero Retention).'
        : `Processed by the agents and stored (Scope: ${payload.privacyScope || 'team'}).`,
    };

    return {
      result,
      workflowRun,
    };
  }
}
