import { z } from 'zod';

export type PrivacyScope = 'public' | 'team' | 'confidential' | 'do_not_retain';
export type RetentionPolicy = 'forever' | '30d' | '7d' | 'ephemeral_session';
export type StorageState = 'active' | 'archived' | 'purged';

export interface MemoryRecord {
  memoryId: string;
  userId: string;
  workspaceId: string;
  sessionId: string;
  transcriptText: string;
  createdAt: string;       // ISO 8601
  meetingDate: string;     // ISO 8601 or YYYY-MM-DD
  tags: string[];
  privacyScope: PrivacyScope;
  retentionPolicy: RetentionPolicy;
  storageState: StorageState;
  source: 'omi_webhook' | 'omi_simulator' | 'manual_ingest';
  actionItemId?: string;
  vector?: number[];
  metadata?: Record<string, unknown>;
}

export const MemoryRecordSchema = z.object({
  memoryId: z.string().min(1),
  userId: z.string().min(1),
  workspaceId: z.string().min(1),
  sessionId: z.string().min(1),
  transcriptText: z.string().min(1),
  createdAt: z.string(),
  meetingDate: z.string(),
  tags: z.array(z.string()).default([]),
  privacyScope: z.enum(['public', 'team', 'confidential', 'do_not_retain']).default('team'),
  retentionPolicy: z.enum(['forever', '30d', '7d', 'ephemeral_session']).default('30d'),
  storageState: z.enum(['active', 'archived', 'purged']).default('active'),
  source: z.enum(['omi_webhook', 'omi_simulator', 'manual_ingest']).default('omi_simulator'),
  actionItemId: z.string().optional(),
  vector: z.array(z.number()).optional(),
  metadata: z.record(z.unknown()).optional(),
});
