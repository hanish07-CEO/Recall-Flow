import { MemoryRecord, PrivacyScope } from '../../models/memory';
import { ActionItemRecord } from '../../models/actionItem';
import { IQdrantRepository, MemoryFilterOptions, SemanticSearchResult } from './types';
import { SEED_MEMORIES, SEED_ACTION_ITEMS } from '../../mockData/seedMemories';

export class QdrantDemoAdapter implements IQdrantRepository {
  public readonly name = 'Qdrant In-Memory Demo Adapter';
  public readonly isDemo = true;

  private memories: Map<string, MemoryRecord> = new Map();
  private actionItems: Map<string, ActionItemRecord> = new Map();

  constructor() {
    this.seed();
  }

  private seed(): void {
    this.memories.clear();
    this.actionItems.clear();

    for (const mem of SEED_MEMORIES) {
      this.memories.set(mem.memoryId, { ...mem });
    }

    for (const item of SEED_ACTION_ITEMS) {
      this.actionItems.set(item.id, { ...item });
    }
  }

  public async isHealthy(): Promise<boolean> {
    return true;
  }

  public async resetToSeed(): Promise<void> {
    this.seed();
  }

  public async upsertMemory(memory: MemoryRecord): Promise<void> {
    // If privacy scope is do_not_retain, do not persist to long-term memory
    if (memory.privacyScope === 'do_not_retain') {
      return;
    }
    this.memories.set(memory.memoryId, { ...memory });
  }

  public async getMemory(memoryId: string): Promise<MemoryRecord | null> {
    const mem = this.memories.get(memoryId);
    return mem ? { ...mem } : null;
  }

  public async listMemories(filters: MemoryFilterOptions): Promise<MemoryRecord[]> {
    const results: MemoryRecord[] = [];

    for (const mem of this.memories.values()) {
      if (mem.storageState === 'purged') continue;

      if (filters.userId && mem.userId !== filters.userId && mem.userId !== 'user-default') {
        continue;
      }
      if (filters.workspaceId && mem.workspaceId !== filters.workspaceId) {
        continue;
      }
      if (filters.privacyScopes && !filters.privacyScopes.includes(mem.privacyScope)) {
        continue;
      }
      if (filters.storageStates && !filters.storageStates.includes(mem.storageState)) {
        continue;
      }
      if (filters.retentionPolicies && !filters.retentionPolicies.includes(mem.retentionPolicy)) {
        continue;
      }
      if (filters.sessionId && mem.sessionId !== filters.sessionId) {
        continue;
      }

      results.push({ ...mem });
    }

    // Sort descending by meetingDate / createdAt
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async searchMemories(
    query: string,
    filters: MemoryFilterOptions,
    limit: number = 5
  ): Promise<SemanticSearchResult[]> {
    const baseList = await this.listMemories(filters);
    const queryTokens = this.tokenize(query);

    const scored: SemanticSearchResult[] = baseList.map((mem) => {
      const textTokens = this.tokenize(mem.transcriptText + ' ' + mem.tags.join(' '));
      const score = this.calculateSimilarity(queryTokens, textTokens, mem);
      return { memory: mem, score };
    });

    return scored
      .filter((s) => s.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  public async deleteMemory(memoryId: string): Promise<boolean> {
    return this.memories.delete(memoryId);
  }

  public async purgeRetentionExpired(): Promise<number> {
    let count = 0;
    for (const [id, mem] of this.memories.entries()) {
      if (mem.retentionPolicy === 'ephemeral_session') {
        this.memories.delete(id);
        count++;
      }
    }
    return count;
  }

  public async upsertActionItem(item: ActionItemRecord): Promise<void> {
    this.actionItems.set(item.id, { ...item });
  }

  public async getActionItem(id: string): Promise<ActionItemRecord | null> {
    const item = this.actionItems.get(id);
    return item ? { ...item } : null;
  }

  public async listActionItems(filters?: {
    userId?: string;
    workspaceId?: string;
    status?: string;
  }): Promise<ActionItemRecord[]> {
    const results: ActionItemRecord[] = [];
    for (const item of this.actionItems.values()) {
      if (filters?.userId && item.userId !== filters.userId && item.userId !== 'user-default') {
        continue;
      }
      if (filters?.workspaceId && item.workspaceId !== filters.workspaceId) {
        continue;
      }
      if (filters?.status && item.status !== filters.status) {
        continue;
      }
      results.push({ ...item });
    }
    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public async updateActionItemStatus(
    id: string,
    status: ActionItemRecord['status']
  ): Promise<ActionItemRecord | null> {
    const item = this.actionItems.get(id);
    if (!item) return null;
    const updated: ActionItemRecord = {
      ...item,
      status,
      updatedAt: new Date().toISOString(),
    };
    this.actionItems.set(id, updated);
    return { ...updated };
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  private calculateSimilarity(queryTokens: string[], textTokens: string[], mem: MemoryRecord): number {
    if (queryTokens.length === 0 || textTokens.length === 0) return 0;

    let overlap = 0;
    const textSet = new Set(textTokens);

    for (const q of queryTokens) {
      if (textSet.has(q)) {
        overlap += 1;
      } else {
        // Partial substring match for technical terms (e.g. qdrant, cach)
        for (const t of textTokens) {
          if (t.includes(q) || q.includes(t)) {
            overlap += 0.5;
            break;
          }
        }
      }
    }

    // Boost for tag matches
    const tagMatches = mem.tags.filter((t) => queryTokens.some((q) => t.toLowerCase().includes(q))).length;
    const score = (overlap / Math.sqrt(queryTokens.length * textTokens.length)) * 2 + tagMatches * 0.25;

    return Math.min(Math.round(score * 100) / 100, 1.0);
  }
}
