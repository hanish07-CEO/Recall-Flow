import { MemoryRecord } from '../../models/memory';

const DAY_MS = 86_400_000;

/** Ephemeral-session memories live for one day at most. */
export const EPHEMERAL_TTL_MS = DAY_MS;

/** True when a memory has outlived its retention policy at `now`. */
export function isExpired(memory: Pick<MemoryRecord, 'retentionPolicy' | 'createdAt'>, now: number = Date.now()): boolean {
  const created = new Date(memory.createdAt).getTime();
  if (Number.isNaN(created)) return false;
  switch (memory.retentionPolicy) {
    case '7d':
      return now - created > 7 * DAY_MS;
    case '30d':
      return now - created > 30 * DAY_MS;
    case 'ephemeral_session':
      return now - created > EPHEMERAL_TTL_MS;
    case 'forever':
    default:
      return false;
  }
}
