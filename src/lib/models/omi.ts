import { z } from 'zod';
import { PrivacyScope, RetentionPolicy } from './memory';

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

export const OmiWebhookPayloadSchema = z.object({
  eventId: z.string().min(1, 'eventId is required'),
  source: z.enum(['omi_device', 'omi_simulator', 'omi_app']).default('omi_simulator'),
  userId: z.string().min(1, 'userId is required'),
  workspaceId: z.string().min(1, 'workspaceId is required'),
  sessionId: z.string().min(1, 'sessionId is required'),
  timestamp: z.string().min(1, 'timestamp is required'),
  transcript: z.string().min(1, 'transcript cannot be empty'),
  privacyScope: z.enum(['public', 'team', 'confidential', 'do_not_retain']).optional().default('team'),
  retentionPolicy: z.enum(['forever', '30d', '7d', 'ephemeral_session']).optional().default('30d'),
});

export type IngestionResult = {
  success: boolean;
  eventId: string;
  memoryId?: string;
  status: 'stored' | 'scrubbed' | 'purged_do_not_retain';
  privacyScope: PrivacyScope;
  retentionPolicy: RetentionPolicy;
  actionItemsExtracted: number;
  changeDetected?: boolean;
  agentTraceId: string;
  message: string;
};
