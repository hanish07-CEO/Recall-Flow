import { describe, it, expect, beforeEach } from 'vitest';
import { getQdrantRepository } from '../src/lib/adapters/qdrant';

describe('Qdrant Memory Repository Abstraction', () => {
  beforeEach(async () => {
    const repo = getQdrantRepository();
    await repo.resetToSeed();
  });

  it('initializes with seed memories and action items', async () => {
    const repo = getQdrantRepository();
    const memories = await repo.listMemories({
      workspaceId: 'workspace-default',
      privacyScopes: ['team', 'public'],
    });

    expect(memories.length).toBeGreaterThan(0);
    const qdrantCostMemory = memories.find((m) => m.memoryId === 'mem-seed-qdrant-cost');
    expect(qdrantCostMemory).toBeDefined();
    expect(qdrantCostMemory?.transcriptText).toContain('escalating Qdrant cluster costs');
  });

  it('performs semantic search and ranks relevant results highest', async () => {
    const repo = getQdrantRepository();
    const results = await repo.searchMemories(
      'Qdrant cost issue uncompressed vectors',
      { privacyScopes: ['team', 'public'] },
      3
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].memory.memoryId).toBe('mem-seed-qdrant-cost');
    expect(results[0].score).toBeGreaterThan(0.3);
  });

  it('strictly excludes confidential memories when scope is not requested', async () => {
    const repo = getQdrantRepository();

    // Query without 'confidential' in privacyScopes
    const standardResults = await repo.searchMemories(
      'executive compensation bonus',
      { privacyScopes: ['team', 'public'] },
      5
    );
    expect(standardResults.some((r) => r.memory.privacyScope === 'confidential')).toBe(false);

    // Query WITH 'confidential' in privacyScopes
    const authorizedResults = await repo.searchMemories(
      'executive compensation bonus',
      { privacyScopes: ['confidential'] },
      5
    );
    expect(authorizedResults.some((r) => r.memory.privacyScope === 'confidential')).toBe(true);
  });

  it('supports memory deletion', async () => {
    const repo = getQdrantRepository();
    const existing = await repo.getMemory('mem-seed-ephemeral-social');
    expect(existing).not.toBeNull();

    const deleted = await repo.deleteMemory('mem-seed-ephemeral-social');
    expect(deleted).toBe(true);

    const check = await repo.getMemory('mem-seed-ephemeral-social');
    expect(check).toBeNull();
  });
});
