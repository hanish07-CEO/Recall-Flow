import { ILyzrWorkflow } from './types';
import { LyzrDemoWorkflow } from './demoWorkflow';
import { LyzrProductionWorkflow } from './productionWorkflow';

let globalWorkflow: ILyzrWorkflow | null = null;

export function getLyzrWorkflow(): ILyzrWorkflow {
  if (globalWorkflow) {
    return globalWorkflow;
  }

  const lyzrKey = process.env.LYZR_API_KEY;
  const mode = process.env.RECALLFLOW_MODE;

  if (mode !== 'demo' && lyzrKey && lyzrKey.trim().length > 0) {
    globalWorkflow = new LyzrProductionWorkflow(lyzrKey);
  } else {
    globalWorkflow = new LyzrDemoWorkflow();
  }

  return globalWorkflow;
}
