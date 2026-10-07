import { MemoryRecord, PrivacyScope, RetentionPolicy, StorageState } from '../../models/memory';
import { ActionItemRecord } from '../../models/actionItem';

export interface MemoryFilterOptions {
  userId?: string;
  workspaceId?: string;
  privacyScopes?: PrivacyScope[];
  storageStates?: StorageState[];
  retentionPolicies?: RetentionPolicy[];
  tags?: string[];
  sessionId?: string;
}

export interface SemanticSearchResult {
  memory: MemoryRecord;
  score: number;
}

export interface IQdrantRepository {
  name: string;
  isDemo: boolean;
  
  // Lifecycle / health
  isHealthy(): Promise<boolean>;
  resetToSeed(): Promise<void>;
  
  // Memories collection (recallflow_memories)
  upsertMemory(memory: MemoryRecord): Promise<void>;
  getMemory(memoryId: string): Promise<MemoryRecord | null>;
  listMemories(filters: MemoryFilterOptions): Promise<MemoryRecord[]>;
  searchMemories(query: string, filters: MemoryFilterOptions, limit?: number): Promise<SemanticSearchResult[]>;
  deleteMemory(memoryId: string): Promise<boolean>;
  purgeRetentionExpired(): Promise<number>;

  // Action items collection (recallflow_action_items)
  upsertActionItem(item: ActionItemRecord): Promise<void>;
  getActionItem(id: string): Promise<ActionItemRecord | null>;
  listActionItems(filters?: { userId?: string; workspaceId?: string; status?: string }): Promise<ActionItemRecord[]>;
  updateActionItemStatus(id: string, status: ActionItemRecord['status']): Promise<ActionItemRecord | null>;
}
