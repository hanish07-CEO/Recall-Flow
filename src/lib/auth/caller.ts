import { timingSafeEqual } from 'crypto';
import { PrivacyScope } from '../models/memory';

/**
 * Server-side caller resolution.
 *
 * DEMO LIMITATION: RecallFlow has no real login. The demo persona is carried in the
 * `x-recallflow-user` header. What a persona may SEE is decided here on the server and is
 * never taken from client-supplied scope lists. Unknown personas get least privilege.
 * A production deployment must replace `resolveCaller` with real session authentication.
 */

export const DEFAULT_USER_ID = 'user-default';
export const DEFAULT_WORKSPACE_ID = 'workspace-default';
export const USER_HEADER = 'x-recallflow-user';

const BASE_SCOPES: PrivacyScope[] = ['public', 'team'];
const ROLE_SCOPES: Record<string, PrivacyScope[]> = {
  'user-admin': ['public', 'team', 'confidential'],
};

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export interface Caller {
  userId: string;
  workspaceId: string;
  allowedScopes: PrivacyScope[];
  isAdmin: boolean;
}

/** Scopes a user may read. `do_not_retain` is never readable because it is never stored. */
export function scopesForUser(userId?: string | null): PrivacyScope[] {
  return [...(userId && ROLE_SCOPES[userId] ? ROLE_SCOPES[userId] : BASE_SCOPES)];
}

export function resolveCaller(req: Request): Caller {
  const raw = req.headers.get(USER_HEADER)?.trim();
  const userId = raw && ID_PATTERN.test(raw) ? raw : DEFAULT_USER_ID;
  return {
    userId,
    workspaceId: DEFAULT_WORKSPACE_ID,
    allowedScopes: scopesForUser(userId),
    isAdmin: userId === 'user-admin',
  };
}

/** Intersect requested scopes with what the caller may read. Empty/invalid request => all allowed. */
export function narrowScopes(requested: string[] | undefined, allowed: PrivacyScope[]): PrivacyScope[] {
  if (!requested || requested.length === 0) return allowed;
  const narrowed = allowed.filter((s) => requested.includes(s));
  return narrowed;
}

/** Constant-time string comparison (length differences still short-circuit safely). */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
