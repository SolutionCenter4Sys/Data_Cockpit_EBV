import type { IScoreRepository } from '../../domain/repositories/interfaces';
import type { ApiResponse, ScoreMetric, ScoreAnomalyEvent, ScoreTimeSeries } from '../../domain/entities';
import { MOCK_SCORE_METRICS, MOCK_SCORE_ANOMALIES, generateScoreTimeSeries } from '../mock/mockData';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class MockScoreRepository implements IScoreRepository {
  async getMetrics(): Promise<ApiResponse<ScoreMetric[]>> {
    await delay(700);
    return { data: MOCK_SCORE_METRICS, success: true, timestamp: new Date().toISOString() };
  }

  async getAnomalyEvents(modelId?: string): Promise<ApiResponse<ScoreAnomalyEvent[]>> {
    await delay(400);
    const data = modelId
      ? MOCK_SCORE_ANOMALIES.filter((e) => e.modelId === modelId)
      : MOCK_SCORE_ANOMALIES;
    return { data, success: true, timestamp: new Date().toISOString() };
  }

  async getTimeSeries(modelId: string): Promise<ApiResponse<ScoreTimeSeries[]>> {
    await delay(500);
    return { data: generateScoreTimeSeries(modelId), success: true, timestamp: new Date().toISOString() };
  }
}
