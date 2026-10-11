import { IQdrantRepository } from './types';
import { QdrantDemoAdapter } from './demoAdapter';
import { QdrantProductionAdapter } from './productionAdapter';

// Stored on globalThis so state survives Next.js dev HMR and is shared between route bundles.
// NOTE: in-memory demo state still resets on serverless hosts (each instance has its own memory).
const globalStore = globalThis as typeof globalThis & { __recallflowRepository?: IQdrantRepository };

export function getQdrantRepository(): IQdrantRepository {
  if (globalStore.__recallflowRepository) {
    return globalStore.__recallflowRepository;
  }

  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantApiKey = process.env.QDRANT_API_KEY;
  const mode = process.env.RECALLFLOW_MODE;

  globalStore.__recallflowRepository =
    mode !== 'demo' && qdrantUrl && qdrantUrl.trim().length > 0
      ? new QdrantProductionAdapter(qdrantUrl, qdrantApiKey)
      : new QdrantDemoAdapter();

  return globalStore.__recallflowRepository;
}
