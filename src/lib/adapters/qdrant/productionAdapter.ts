import { createHash } from 'crypto';
import { MemoryRecord } from '../../models/memory';
import { ActionItemRecord } from '../../models/actionItem';
import { IQdrantRepository, MemoryFilterOptions, SemanticSearchResult } from './types';
import { EMBEDDING_DIMENSIONS, embedText } from './embedding';
import { isExpired } from './retention';

const MEMORIES = 'recallflow_memories';
const ACTION_ITEMS = 'recallflow_action_items';
const SCROLL_PAGE = 100;
const SCROLL_MAX = 1000;
const REQUEST_TIMEOUT_MS = 10_000;
const SHARED_USER = 'user-default';

/** Qdrant point IDs must be UUIDs or unsigned ints, so derive a stable UUID from our string IDs. */
export function toPointId(id: string): string {
  const h = createHash('sha1').update(id).digest('hex');
  const variant = ((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(18, 20)}-${h.slice(20, 32)}`;
}

type QdrantFilter = Record<string, unknown>;

interface QdrantPoint<T> {
  id: string | number;
  payload?: T;
  score?: number;
}

export class QdrantProductionAdapter implements IQdrantRepository {
  public readonly name = 'Qdrant Cloud Production Client';
  public readonly isDemo = false;

  private url: string;
  private apiKey?: string;
  private ready?: Promise<void>;

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

  /** Low-level request. Throws on non-2xx (except where the caller opts into 404 => null). */
  private async request<T>(path: string, init: RequestInit = {}, allow404 = false): Promise<T | null> {
    const res = await fetch(`${this.url}${path}`, {
      ...init,
      headers: { ...this.headers, ...(init.headers as Record<string, string> | undefined) },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (allow404 && res.status === 404) return null;
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      throw new Error(`Qdrant request failed: ${init.method ?? 'GET'} ${path} (${res.status}) ${detail}`);
    }
    return (await res.json()) as T;
  }

  private ensureCollections(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        for (const name of [MEMORIES, ACTION_ITEMS]) {
          const existing = await this.request(`/collections/${name}`, { method: 'GET' }, true);
          if (existing === null) {
            await this.request(`/collections/${name}`, {
              method: 'PUT',
              body: JSON.stringify({ vectors: { size: EMBEDDING_DIMENSIONS, distance: 'Cosine' } }),
            });
          }
        }
      })().catch((err) => {
        this.ready = undefined; // retry on the next call instead of caching a failure
        throw err;
      });
    }
    return this.ready;
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
    // Intentionally a no-op: never wipe a live cluster. The demo adapter implements the real reset.
  }

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  /** Mirrors the demo adapter: a user sees their own records plus the shared default user's. */
  private userCondition(userId?: string): unknown[] | undefined {
    if (!userId) return undefined;
    return userId === SHARED_USER
      ? [{ key: 'userId', match: { value: SHARED_USER } }]
      : [
          { key: 'userId', match: { value: userId } },
          { key: 'userId', match: { value: SHARED_USER } },
        ];
  }

  private memoryFilter(filters: MemoryFilterOptions): QdrantFilter {
    const must: unknown[] = [];
    if (filters.workspaceId) must.push({ key: 'workspaceId', match: { value: filters.workspaceId } });
    if (filters.privacyScopes) must.push({ key: 'privacyScope', match: { any: filters.privacyScopes } });
    if (filters.storageStates?.length) must.push({ key: 'storageState', match: { any: filters.storageStates } });
    if (filters.retentionPolicies?.length) must.push({ key: 'retentionPolicy', match: { any: filters.retentionPolicies } });
    if (filters.sessionId) must.push({ key: 'sessionId', match: { value: filters.sessionId } });
    if (filters.tags?.length) must.push({ key: 'tags', match: { any: filters.tags } });

    const filter: QdrantFilter = { must_not: [{ key: 'storageState', match: { value: 'purged' } }] };
    if (must.length > 0) filter.must = must;
    const should = this.userCondition(filters.userId);
    if (should) filter.should = should;
    return filter;
  }

  private actionFilter(filters?: { userId?: string; workspaceId?: string; status?: string }): QdrantFilter | undefined {
    const must: unknown[] = [];
    if (filters?.workspaceId) must.push({ key: 'workspaceId', match: { value: filters.workspaceId } });
    if (filters?.status) must.push({ key: 'status', match: { value: filters.status } });
    const filter: QdrantFilter = {};
    if (must.length > 0) filter.must = must;
    const should = this.userCondition(filters?.userId);
    if (should) filter.should = should;
    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  private async scrollAll<T>(collection: string, filter?: QdrantFilter): Promise<T[]> {
    await this.ensureCollections();
    const out: T[] = [];
    let offset: string | number | null | undefined;
    do {
      const json = await this.request<{ result?: { points?: QdrantPoint<T>[]; next_page_offset?: string | number | null } }>(
        `/collections/${collection}/points/scroll`,
        {
          method: 'POST',
          body: JSON.stringify({
            filter,
            limit: SCROLL_PAGE,
            offset,
            with_payload: true,
            with_vector: false,
          }),
        }
      );
      for (const p of json?.result?.points ?? []) {
        if (p.payload) out.push(p.payload);
      }
      offset = json?.result?.next_page_offset;
    } while (offset != null && out.length < SCROLL_MAX);
    return out;
  }

  // ---------------------------------------------------------------------------
  // Memories (recallflow_memories)
  // ---------------------------------------------------------------------------

  public async upsertMemory(memory: MemoryRecord): Promise<void> {
    // Zero-retention records must never reach long-term storage.
    if (memory.privacyScope === 'do_not_retain') return;
    await this.ensureCollections();

    const { vector, ...payload } = memory;
    await this.request(`/collections/${MEMORIES}/points?wait=true`, {
      method: 'PUT',
      body: JSON.stringify({
        points: [
          {
            id: toPointId(memory.memoryId),
            payload,
            vector: vector ?? embedText(`${memory.transcriptText} ${memory.tags.join(' ')}`),
          },
        ],
      }),
    });
  }

  public async getMemory(memoryId: string): Promise<MemoryRecord | null> {
    await this.ensureCollections();
    const json = await this.request<{ result?: QdrantPoint<MemoryRecord> }>(
      `/collections/${MEMORIES}/points/${toPointId(memoryId)}`,
      { method: 'GET' },
      true
    );
    return json?.result?.payload ?? null;
  }

  public async listMemories(filters: MemoryFilterOptions): Promise<MemoryRecord[]> {
    if (filters.privacyScopes && filters.privacyScopes.length === 0) return [];
    const memories = await this.scrollAll<MemoryRecord>(MEMORIES, this.memoryFilter(filters));
    return memories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async searchMemories(
    query: string,
    filters: MemoryFilterOptions,
    limit: number = 5
  ): Promise<SemanticSearchResult[]> {
    if (filters.privacyScopes && filters.privacyScopes.length === 0) return [];
    await this.ensureCollections();

    const json = await this.request<{ result?: QdrantPoint<MemoryRecord>[] }>(
      `/collections/${MEMORIES}/points/search`,
      {
        method: 'POST',
        body: JSON.stringify({
          vector: embedText(query),
          filter: this.memoryFilter(filters),
          limit,
          score_threshold: 0.05,
          with_payload: true,
        }),
      }
    );
    return (json?.result ?? [])
      .filter((r): r is QdrantPoint<MemoryRecord> & { payload: MemoryRecord } => !!r.payload)
      .map((r) => ({ memory: r.payload, score: Math.round((r.score ?? 0) * 100) / 100 }));
  }

  public async deleteMemory(memoryId: string): Promise<boolean> {
    await this.ensureCollections();
    const existing = await this.getMemory(memoryId);
    if (!existing) return false;
    await this.request(`/collections/${MEMORIES}/points/delete?wait=true`, {
      method: 'POST',
      body: JSON.stringify({ points: [toPointId(memoryId)] }),
    });
    return true;
  }

  public async purgeRetentionExpired(): Promise<number> {
    const candidates = await this.scrollAll<MemoryRecord>(MEMORIES, {
      must: [{ key: 'retentionPolicy', match: { any: ['7d', '30d', 'ephemeral_session'] } }],
    });
    const now = Date.now();
    const expired = candidates.filter((m) => isExpired(m, now));
    if (expired.length === 0) return 0;

    await this.request(`/collections/${MEMORIES}/points/delete?wait=true`, {
      method: 'POST',
      body: JSON.stringify({ points: expired.map((m) => toPointId(m.memoryId)) }),
    });
    return expired.length;
  }

  // ---------------------------------------------------------------------------
  // Action items (recallflow_action_items)
  // ---------------------------------------------------------------------------

  public async upsertActionItem(item: ActionItemRecord): Promise<void> {
    await this.ensureCollections();
    await this.request(`/collections/${ACTION_ITEMS}/points?wait=true`, {
      method: 'PUT',
      body: JSON.stringify({
        points: [
          {
            id: toPointId(item.id),
            payload: item,
            vector: embedText(`${item.task} ${item.owner} ${item.contextSnippet}`),
          },
        ],
      }),
    });
  }

  public async getActionItem(id: string): Promise<ActionItemRecord | null> {
    await this.ensureCollections();
    const json = await this.request<{ result?: QdrantPoint<ActionItemRecord> }>(
      `/collections/${ACTION_ITEMS}/points/${toPointId(id)}`,
      { method: 'GET' },
      true
    );
    return json?.result?.payload ?? null;
  }

  public async listActionItems(filters?: {
    userId?: string;
    workspaceId?: string;
    status?: string;
  }): Promise<ActionItemRecord[]> {
    const items = await this.scrollAll<ActionItemRecord>(ACTION_ITEMS, this.actionFilter(filters));
    return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public async updateActionItemStatus(
    id: string,
    status: ActionItemRecord['status']
  ): Promise<ActionItemRecord | null> {
    const existing = await this.getActionItem(id);
    if (!existing) return null;
    const updated: ActionItemRecord = { ...existing, status, updatedAt: new Date().toISOString() };
    await this.upsertActionItem(updated);
    return updated;
  }
}
