import type { IBatchRepository } from '../../domain/repositories/interfaces';
import type { ApiResponse, BatchJob, BatchMetrics } from '../../domain/entities';
import { MOCK_BATCH_JOBS, MOCK_BATCH_METRICS } from '../mock/mockData';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class MockBatchRepository implements IBatchRepository {
  async getJobs(): Promise<ApiResponse<BatchJob[]>> {
    await delay(600);
    return { data: MOCK_BATCH_JOBS, success: true, timestamp: new Date().toISOString() };
  }

  async getMetrics(): Promise<ApiResponse<BatchMetrics>> {
    await delay(400);
    return { data: MOCK_BATCH_METRICS, success: true, timestamp: new Date().toISOString() };
  }

  async retryJob(jobId: string): Promise<ApiResponse<BatchJob>> {
    await delay(1000);
    const job = MOCK_BATCH_JOBS.find((j) => j.jobId === jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    const retried: BatchJob = { ...job, status: 'RUNNING', startTime: new Date().toISOString(), endTime: undefined, errorMessage: undefined };
    return { data: retried, success: true, message: `Job ${jobId} reagendado com sucesso.`, timestamp: new Date().toISOString() };
  }
}
