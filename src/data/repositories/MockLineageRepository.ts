import type { ILineageRepository } from '../../domain/repositories/interfaces';
import type { ApiResponse, PipelineRun } from '../../domain/entities';
import { MOCK_PIPELINE_RUNS } from '../mock/mockData';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class MockLineageRepository implements ILineageRepository {
  async getPipelineRuns(): Promise<ApiResponse<PipelineRun[]>> {
    await delay(700);
    return { data: MOCK_PIPELINE_RUNS, success: true, timestamp: new Date().toISOString() };
  }

  async getPipelineDetail(runId: string): Promise<ApiResponse<PipelineRun>> {
    await delay(400);
    const run = MOCK_PIPELINE_RUNS.find((r) => r.runId === runId);
    if (!run) throw new Error(`Pipeline run ${runId} not found`);
    return { data: run, success: true, timestamp: new Date().toISOString() };
  }
}
