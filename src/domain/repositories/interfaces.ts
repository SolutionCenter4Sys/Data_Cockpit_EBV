import type {
  DashboardSummary,
  ScoreMetric,
  ScoreAnomalyEvent,
  ScoreTimeSeries,
  Alert,
  AlertRule,
  BatchJob,
  BatchMetrics,
  PipelineRun,
  ApiResponse,
} from '../entities';

export interface IDashboardRepository {
  getSummary(): Promise<ApiResponse<DashboardSummary>>;
}

export interface IScoreRepository {
  getMetrics(): Promise<ApiResponse<ScoreMetric[]>>;
  getAnomalyEvents(modelId?: string): Promise<ApiResponse<ScoreAnomalyEvent[]>>;
  getTimeSeries(modelId: string, hours?: number): Promise<ApiResponse<ScoreTimeSeries[]>>;
}

export interface IAlertRepository {
  getAlerts(status?: Alert['status']): Promise<ApiResponse<Alert[]>>;
  getRules(): Promise<ApiResponse<AlertRule[]>>;
  acknowledgeAlert(id: string): Promise<ApiResponse<Alert>>;
  resolveAlert(id: string): Promise<ApiResponse<Alert>>;
}

export interface IBatchRepository {
  getJobs(): Promise<ApiResponse<BatchJob[]>>;
  getMetrics(): Promise<ApiResponse<BatchMetrics>>;
  retryJob(jobId: string): Promise<ApiResponse<BatchJob>>;
}

export interface ILineageRepository {
  getPipelineRuns(): Promise<ApiResponse<PipelineRun[]>>;
  getPipelineDetail(runId: string): Promise<ApiResponse<PipelineRun>>;
}
