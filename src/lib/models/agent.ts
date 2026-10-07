export type AgentNodeName =
  | 'PrivacyEnforcementAgent'
  | 'ContextRetrievalAgent'
  | 'ActionExtractionAgent'
  | 'ChangeDetectionAgent'
  | 'EvidenceSynthesizerAgent';

export type AgentNodeStatus = 'idle' | 'running' | 'completed' | 'warning' | 'skipped' | 'failed';

export interface AgentStepTrace {
  id: string;
  agentName: AgentNodeName;
  title: string;
  role: string;
  status: AgentNodeStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  inputSummary: string;
  thoughtProcess: string;
  outputSummary: string;
  details?: Record<string, unknown>;
}

export interface AgentWorkflowTrace {
  traceId: string;
  triggerEventId: string;
  timestamp: string;
  mode: 'demo_simulator' | 'lyzr_production';
  status: 'success' | 'partial' | 'error';
  totalDurationMs: number;
  steps: AgentStepTrace[];
}

export interface EvidenceCitation {
  memoryId: string;
  sessionId: string;
  meetingDate: string;
  contextSnippet: string;
  relevanceScore: number;
  privacyScope: string;
  source: string;
}

export interface EvidenceQAResponse {
  query: string;
  answer: string;
  confidence: number; // 0 to 1
  citations: EvidenceCitation[];
  traceId: string;
  agentSteps: AgentStepTrace[];
  privacyFilteredCount: number;
}
