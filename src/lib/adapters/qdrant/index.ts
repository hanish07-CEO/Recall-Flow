import { IQdrantRepository } from './types';
import { QdrantDemoAdapter } from './demoAdapter';
import { QdrantProductionAdapter } from './productionAdapter';

// Global singleton instance so state persists across API routes in dev/demo mode
let globalRepository: IQdrantRepository | null = null;

export function getQdrantRepository(): IQdrantRepository {
  if (globalRepository) {
    return globalRepository;
  }

  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantApiKey = process.env.QDRANT_API_KEY;
  const mode = process.env.RECALLFLOW_MODE;

  if (mode !== 'demo' && qdrantUrl && qdrantUrl.trim().length > 0) {
    globalRepository = new QdrantProductionAdapter(qdrantUrl, qdrantApiKey);
  } else {
    globalRepository = new QdrantDemoAdapter();
  }

  return globalRepository;
}
