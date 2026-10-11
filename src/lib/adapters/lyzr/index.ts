import { ILyzrWorkflow } from './types';
import { LyzrDemoWorkflow } from './demoWorkflow';
import { LyzrProductionWorkflow } from './productionWorkflow';

const globalStore = globalThis as typeof globalThis & { __recallflowWorkflow?: ILyzrWorkflow };

export function getLyzrWorkflow(): ILyzrWorkflow {
  if (globalStore.__recallflowWorkflow) {
    return globalStore.__recallflowWorkflow;
  }

  const lyzrKey = process.env.LYZR_API_KEY;
  const mode = process.env.RECALLFLOW_MODE;

  globalStore.__recallflowWorkflow =
    mode !== 'demo' && lyzrKey && lyzrKey.trim().length > 0
      ? new LyzrProductionWorkflow(lyzrKey)
      : new LyzrDemoWorkflow();

  return globalStore.__recallflowWorkflow;
}
