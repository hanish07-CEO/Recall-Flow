/**
 * Deterministic hashing embedder (bag-of-words -> fixed-size, L2-normalised vector).
 *
 * This is NOT a neural embedding model: it gives lexical similarity only. It exists so the
 * production adapter stores and ranks real, content-dependent vectors without needing a hosted
 * embedding provider. Swap `embedText` for a real provider (OpenAI, Cohere, Lyzr, ...) and keep
 * EMBEDDING_DIMENSIONS in sync with the Qdrant collection size.
 */
export const EMBEDDING_DIMENSIONS = 384;

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function embedText(text: string, dimensions: number = EMBEDDING_DIMENSIONS): number[] {
  const vector = new Array<number>(dimensions).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  for (const token of tokens) {
    const h = fnv1a(token);
    const index = h % dimensions;
    const sign = (h >>> 16) & 1 ? 1 : -1; // signed hashing reduces collision bias
    vector[index] += sign;
  }

  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) {
    vector[0] = 1; // keep a valid unit vector for empty/stop-word-only text
    return vector;
  }
  return vector.map((v) => v / norm);
}
