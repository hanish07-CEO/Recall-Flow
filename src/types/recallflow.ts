export type PrivacyScope = 'Private' | 'Workspace' | 'Do Not Retain';

export type DefaultPrivacySetting = 'Private' | 'Workspace' | 'Ask every time';

export type RetentionPolicy = '7 days' | '30 days' | 'Indefinite' | 'None';

export type StorageState = 'Stored in Qdrant' | 'Not stored';

export type ActionStatus = 'Open' | 'In progress' | 'Completed' | 'Blocked';

export type ActionPriority = 'High' | 'Medium' | 'Low';

export type ActionUrgency = 'Overdue' | 'Due soon' | 'Upcoming';

export type AgentName =
  | 'Router Agent'
  | 'Privacy Policy Agent'
  | 'Memory Retrieval Agent'
  | 'Action Extraction Agent'
  | 'Context Reasoning Agent'
  | 'Briefing Agent';

export type AgentStatus = 'queued' | 'running' | 'completed' | 'blocked' | 'failed';

export type AnswerClassification =
  | 'Confirmed from memory'
  | 'Inferred from context'
  | 'No supporting memory found';

export type OmiConnectionStatus = 'Omi connected' | 'Demo mode' | 'Webhook unavailable';

export type ProcessingStageId =
  | 'received'
  | 'privacy_checked'
  | 'chunked'
  | 'embedded'
  | 'qdrant_stored'
  | 'lyzr_analyzed'
  | 'complete';

export interface VoiceTranscriptEvent {
  eventId: string;
  source: string;
  userId: string;
  workspaceId: string;
  sessionId: string;
  sessionName?: string;
  timestamp: string;
  transcript: string;
  privacyScope: PrivacyScope;
  retentionPolicy: RetentionPolicy;
}

export interface MemoryRecord {
  memoryId: string;
  userId: string;
  workspaceId: string;
  sessionId: string;
  sessionName: string;
  text: string;
  timestamp: string;
  tags: string[];
  privacyScope: PrivacyScope;
  retentionPolicy: RetentionPolicy;
  source: string;
  storageState: StorageState;
  qdrantCollection?: string;
  vectorDimension?: number;
  relevanceScore?: number;
}

export interface EvidenceSnippet {
  memoryId: string;
  sessionId: string;
  sessionName: string;
  timestamp: string;
  quote: string;
  privacyScope: PrivacyScope;
}

export interface ActionChangeRecord {
  changeId: string;
  summary: string;
  activityNote: string;
  previousValue: string;
  newValue: string;
  timestamp: string;
  supportingMemoryIds: string[];
}

export interface ActionItem {
  actionItemId: string;
  task: string;
  owner: string;
  dueDate: string;
  dueDateDisplay: string;
  priority: ActionPriority;
  status: ActionStatus;
  relatedMemoryIds: string[];
  relatedSession: string;
  evidence: EvidenceSnippet[];
  confidence: number;
  privacyScope: PrivacyScope;
  changeHistory: ActionChangeRecord[];
}

export interface AgentTrace {
  agentName: AgentName;
  status: AgentStatus;
  inputSummary: string;
  outputSummary: string;
  durationMs: number;
  timestamp: string;
}

export interface ChangeComparison {
  field: string;
  itemTitle: string;
  previousValue: string;
  previousSession: string;
  previousMemoryId: string;
  previousTimestamp: string;
  updatedValue: string;
  updatedSession: string;
  updatedMemoryId: string;
  updatedTimestamp: string;
  note: string;
}

export interface QueryFilters {
  dateRange?: 'all' | 'today' | 'this_week' | 'october';
  sessionId?: string;
  tag?: string;
  privacyScope?: 'Workspace' | 'Private' | 'All Permitted';
  unresolvedOnly?: boolean;
  workspaceContext?: 'Engineering Workspace' | 'Personal Vault (Private)';
}

export interface QueryResponse {
  query: string;
  answer: string;
  classification: AnswerClassification;
  confidence: number;
  evidence: EvidenceSnippet[];
  retrievedMemories: MemoryRecord[];
  relatedActionItems: ActionItem[];
  agentTrace: AgentTrace[];
  changeComparison?: ChangeComparison;
  privacyFilteredCount?: number;
}

export interface IngestionResult {
  event: VoiceTranscriptEvent;
  memoryRecord: MemoryRecord | null;
  transientRecord?: MemoryRecord;
  extractedTags: string[];
  extractedActionItems: ActionItem[];
  retrievedContextMemories: MemoryRecord[];
  changeDetected?: ChangeComparison;
  agentTrace: AgentTrace[];
  transientMessage?: string;
  stagesCompleted: ProcessingStageId[];
}

export interface PrivacyAndMemorySettings {
  defaultPrivacy: DefaultPrivacySetting;
  defaultRetention: '7 days' | '30 days' | 'Indefinite';
  showEvidenceWithAnswers: boolean;
  enableAgentTraces: boolean;
  enableTranscriptRetention: boolean;
  omiConnectionStatus: OmiConnectionStatus;
}

export interface IntegrationConfigStatus {
  NEXT_PUBLIC_APP_URL: string;
  OMI_API_BASE_URL: string;
  OMI_WEBHOOK_URL: string;
  QDRANT_URL: string;
  QDRANT_API_KEY: string;
  QDRANT_COLLECTION_MEMORIES: string;
  QDRANT_COLLECTION_ACTION_ITEMS: string;
  LYZR_API_BASE_URL: string;
  LYZR_API_KEY: string;
  LYZR_AGENT_CONFIG_ID: string;
  OMI_API_KEY: string;
  OMI_WEBHOOK_SECRET: string;
  DEMO_MODE: boolean;
}

export interface ServerEnvHealthResponse {
  status: string;
  demoMode: boolean;
  appUrl: string;
  webhookUrl: string;
  omiApiBaseUrl: string;
  lyzrApiBaseUrl: string;
  qdrantCollections: {
    memories: string;
    actionItems: string;
  };
  envPresence: {
    NEXT_PUBLIC_APP_URL: boolean;
    QDRANT_URL: boolean;
    QDRANT_API_KEY: boolean;
    QDRANT_COLLECTION_MEMORIES: boolean;
    QDRANT_COLLECTION_ACTION_ITEMS: boolean;
    LYZR_API_KEY: boolean;
    LYZR_AGENT_CONFIG_ID: boolean;
    OMI_API_KEY: boolean;
    OMI_WEBHOOK_SECRET: boolean;
  };
}
