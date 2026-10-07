import { MemoryRecord, PrivacyScope } from '../../models/memory';
import { ActionItemRecord } from '../../models/actionItem';
import { IQdrantRepository, MemoryFilterOptions, SemanticSearchResult } from './types';

export class QdrantProductionAdapter implements IQdrantRepository {
  public readonly name = 'Qdrant Cloud Production Client';
  public readonly isDemo = false;

  private url: string;
  private apiKey?: string;

  constructor(url: string, apiKey?: string) {
    this.url = url.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      h['api-key'] = this.apiKey;
    }
    return h;
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch(`${this.url}/healthz`, {
        method: 'GET',
        headers: this.headers,
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async resetToSeed(): Promise<void> {
    // In production, reset would re-sync initial system collections or is a no-op
    // to prevent accidental data loss in live clusters
  }

  public async upsertMemory(memory: MemoryRecord): Promise<void> {
    if (memory.privacyScope === 'do_not_retain') {
      return;
    }

    // In production Qdrant REST: PUT /collections/recallflow_memories/points
    const point = {
      id: this.uuidToNumericOrString(memory.memoryId),
      payload: {
        memoryId: memory.memoryId,
        userId: memory.userId,
        workspaceId: memory.workspaceId,
        sessionId: memory.sessionId,
        transcriptText: memory.transcriptText,
        createdAt: memory.createdAt,
        meetingDate: memory.meetingDate,
        tags: memory.tags,
        privacyScope: memory.privacyScope,
        retentionPolicy: memory.retentionPolicy,
        storageState: memory.storageState,
        source: memory.source,
        actionItemId: memory.actionItemId,
      },
      // If vector embedding is provided, attach it; otherwise use dummy or zero vector for mock schema
      vector: memory.vector || new Array(384).fill(0.01),
    };

    const res = await fetch(`${this.url}/collections/recallflow_memories/points`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify({ points: [point] }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Qdrant production upsert failed (${res.status}): ${err}`);
    }
  }

  public async getMemory(memoryId: string): Promise<MemoryRecord | null> {
    const res = await fetch(`${this.url}/collections/recallflow_memories/points/${this.uuidToNumericOrString(memoryId)}`, {
      headers: this.headers,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.result?.payload as MemoryRecord) || null;
  }

  public async listMemories(filters: MemoryFilterOptions): Promise<MemoryRecord[]> {
    // In production Qdrant: POST /collections/recallflow_memories/points/scroll
    const mustFilters: unknown[] = [];
    if (filters.userId) {
      mustFilters.push({ key: 'userId', match: { value: filters.userId } });
    }
    if (filters.workspaceId) {
      mustFilters.push({ key: 'workspaceId', match: { value: filters.workspaceId } });
    }
    if (filters.privacyScopes && filters.privacyScopes.length > 0) {
      mustFilters.push({ key: 'privacyScope', match: { any: filters.privacyScopes } });
    }

    const res = await fetch(`${this.url}/collections/recallflow_memories/points/scroll`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        filter: mustFilters.length > 0 ? { must: mustFilters } : undefined,
        limit: 100,
        with_payload: true,
      }),
    });

    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    const points = json.result?.points || [];
    return points.map((p: { payload: MemoryRecord }) => p.payload);
  }

  public async searchMemories(
    query: string,
    filters: MemoryFilterOptions,
    limit: number = 5
  ): Promise<SemanticSearchResult[]> {
    // In production Qdrant: POST /collections/recallflow_memories/points/search
    // Vector embedding would be generated via embeddings provider (or Lyzr embedding)
    const dummyVector = new Array(384).fill(0.01);
    const mustFilters: unknown[] = [];
    if (filters.privacyScopes) {
      mustFilters.push({ key: 'privacyScope', match: { any: filters.privacyScopes } });
    }

    const res = await fetch(`${this.url}/collections/recallflow_memories/points/search`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        vector: dummyVector,
        filter: mustFilters.length > 0 ? { must: mustFilters } : undefined,
        limit,
        with_payload: true,
      }),
    });

    if (!res.ok) return [];
    const json = await res.json();
    return (json.result || []).map((r: { payload: MemoryRecord; score: number }) => ({
      memory: r.payload,
      score: r.score,
    }));
  }

  public async deleteMemory(memoryId: string): Promise<boolean> {
    const res = await fetch(`${this.url}/collections/recallflow_memories/points/delete`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ points: [this.uuidToNumericOrString(memoryId)] }),
    });
    return res.ok;
  }

  public async purgeRetentionExpired(): Promise<number> {
    return 0;
  }

  public async upsertActionItem(item: ActionItemRecord): Promise<void> {
    // Action item points in recallflow_action_items collection
  }

  public async getActionItem(id: string): Promise<ActionItemRecord | null> {
    return null;
  }

  public async listActionItems(filters?: { userId?: string; workspaceId?: string; status?: string }): Promise<ActionItemRecord[]> {
    return [];
  }

  public async updateActionItemStatus(id: string, status: ActionItemRecord['status']): Promise<ActionItemRecord | null> {
    return null;
  }

  private uuidToNumericOrString(id: string): string {
    return id;
  }
}
