import { MemoryRecord } from '../../models/memory';
import { ActionItemRecord } from '../../models/actionItem';
import { AgentWorkflowTrace, EvidenceQAResponse } from '../../models/agent';
import { IQdrantRepository } from '../qdrant/types';

export interface WorkflowRunInput {
  transcript: string;
  userId: string;
  workspaceId: string;
  sessionId: string;
  meetingDate?: string;
  privacyScope?: string;
  retentionPolicy?: string;
}

export interface WorkflowRunResult {
  trace: AgentWorkflowTrace;
  memoryRecord?: MemoryRecord;
  actionItems: ActionItemRecord[];
  retrievedContexts: MemoryRecord[];
  changeDetected?: {
    actionItemId: string;
    field: string;
    oldValue: string;
    newValue: string;
    reason: string;
  };
  privacyStatus: 'approved' | 'scrubbed' | 'do_not_retain_purged';
}

export interface ILyzrWorkflow {
  name: string;
  isDemo: boolean;
  
  // Multi-agent ingestion pipeline
  processTranscript(input: WorkflowRunInput, repository: IQdrantRepository): Promise<WorkflowRunResult>;
  
  // Multi-agent QA Search pipeline
  answerQuestion(
    query: string,
    userId: string,
    workspaceId: string,
    allowedScopes: string[],
    repository: IQdrantRepository
  ): Promise<EvidenceQAResponse>;
}
