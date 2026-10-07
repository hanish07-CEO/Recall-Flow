import { z } from 'zod';

export type ActionItemPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ActionItemStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface ActionItemChange {
  field: string;
  oldValue: string;
  newValue: string;
  reason: string;
  detectedAt: string;
  sourceSessionId: string;
}

export interface ActionItemRecord {
  id: string;
  memoryId: string;
  userId: string;
  workspaceId: string;
  task: string;
  owner: string;
  dueDate: string;          // e.g. "2026-10-09"
  priority: ActionItemPriority;
  status: ActionItemStatus;
  contextSnippet: string;
  previousDeadline?: string;// e.g. "2026-10-08" (Thursday)
  changeDetected?: ActionItemChange;
  createdAt: string;
  updatedAt: string;
}

export const ActionItemRecordSchema = z.object({
  id: z.string().min(1),
  memoryId: z.string().min(1),
  userId: z.string().min(1),
  workspaceId: z.string().min(1),
  task: z.string().min(1),
  owner: z.string().min(1),
  dueDate: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).default('open'),
  contextSnippet: z.string().default(''),
  previousDeadline: z.string().optional(),
  changeDetected: z.object({
    field: z.string(),
    oldValue: z.string(),
    newValue: z.string(),
    reason: z.string(),
    detectedAt: z.string(),
    sourceSessionId: z.string(),
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
