import { z } from 'zod';
import { PrivacyScope, RetentionPolicy } from './memory';

export const MAX_TRANSCRIPT_CHARS = 20_000;

export interface OmiWebhookPayload {
  eventId: string;
  source: 'omi_device' | 'omi_simulator' | 'omi_app';
  userId: string;
  workspaceId: string;
  sessionId: string;
  timestamp: string;
  transcript: string;
  privacyScope?: PrivacyScope;
  retentionPolicy?: RetentionPolicy;
}

export const OmiWebhookPayloadSchema = z
  .object({
    eventId: z.string().trim().min(1, 'eventId is required').max(128),
    source: z.enum(['omi_device', 'omi_simulator', 'omi_app']).default('omi_simulator'),
    userId: z.string().trim().min(1, 'userId is required').max(64),
    workspaceId: z.string().trim().min(1, 'workspaceId is required').max(64),
    sessionId: z.string().trim().min(1, 'sessionId is required').max(128),
    timestamp: z.string().datetime({ offset: true, message: 'timestamp must be an ISO 8601 datetime' }),
    transcript: z
      .string()
      .trim()
      .min(1, 'transcript cannot be empty')
      .max(MAX_TRANSCRIPT_CHARS, `transcript exceeds ${MAX_TRANSCRIPT_CHARS} characters`),
    privacyScope: z.enum(['public', 'team', 'confidential', 'do_not_retain']).optional().default('team'),
    retentionPolicy: z.enum(['forever', '30d', '7d', 'ephemeral_session']).optional().default('30d'),
  })
  // Zero-retention events can never carry a persistent retention policy.
  .transform((payload) =>
    payload.privacyScope === 'do_not_retain'
      ? { ...payload, retentionPolicy: 'ephemeral_session' as const }
      : payload
  );

export type IngestionResult = {
  success: boolean;
  eventId: string;
  memoryId?: string;
  status: 'stored' | 'scrubbed' | 'purged_do_not_retain';
  privacyScope: PrivacyScope;
  retentionPolicy: RetentionPolicy;
  actionItemsExtracted: number;
  /** Action items actually written to storage (0 for do_not_retain). */
  actionItemsPersisted: number;
  changeDetected?: boolean;
  agentTraceId: string;
  message: string;
};
