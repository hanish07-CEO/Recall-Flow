/** Client-side fetch helper that identifies the active demo persona to the API. */
export function apiFetch(userId: string, url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('x-recallflow-user', userId);
  return fetch(url, { ...init, headers });
}
