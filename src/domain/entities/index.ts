// ── Shared ──────────────────────────────────────────────────────────────────

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'HEALTHY';
export type ProcessStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'WARNING' | 'PENDING';
export type DataLayer = 'INGESTION' | 'TRUSTED' | 'ANALYTICS';
export type TrendDirection = 'UP' | 'DOWN' | 'STABLE';

// ── EP-01: Dashboard ──────────────────────────────────────────────────────────

export interface GlobalHealthKpi {
  label: string;
  value: number | string;
  unit?: string;
  trend: TrendDirection;
  trendValue: string;
  severity: SeverityLevel;
  icon: string;
}

export interface LayerHealth {
  layer: DataLayer;
  healthScore: number;
  activeAlerts: number;
  successRate: number;
  lastUpdated: string;
}

export interface DashboardSummary {
  overallHealth: number;
  kpis: GlobalHealthKpi[];
  layerHealth: LayerHealth[];
  activeAlerts: number;
  criticalAlerts: number;
  lastRefreshed: string;
}

// ── EP-02: Score Monitor ──────────────────────────────────────────────────────

export interface ScoreMetric {
  modelId: string;
  modelName: string;
  currentScore: number;
  previousScore: number;
  deviation: number;
  zeratedCount: number;
  zeratedPercent: number;
  status: SeverityLevel;
  lastUpdated: string;
  layer: DataLayer;
}

export interface ScoreAnomalyEvent {
  id: string;
  modelId: string;
  eventType: 'ZERADO' | 'ANOMALIA' | 'OSCILACAO' | 'CONSULTA_INDEVIDA';
  description: string;
  affectedRecords: number;
  detectedAt: string;
  severity: SeverityLevel;
  rootCause?: string;
}

export interface ScoreTimeSeries {
  timestamp: string;
  scoreAvg: number;
  zeratedCount: number;
  modelId: string;
}

// ── EP-03: Alertas ────────────────────────────────────────────────────────────

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  layer: DataLayer;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  triggerType: 'THRESHOLD' | 'ANOMALY' | 'BATCH_FAILURE' | 'SCORE_ZERO' | 'LATENCY';
  affectedProcess: string;
  suggestedAction: string;
  autoAction?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: SeverityLevel;
  layer: DataLayer;
  enabled: boolean;
  triggerCount: number;
  lastTriggered?: string;
}

// ── EP-04: Batch Monitor ──────────────────────────────────────────────────────

export interface BatchJob {
  jobId: string;
  jobName: string;
  layer: DataLayer;
  status: ProcessStatus;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  recordsProcessed?: number;
  recordsFailed?: number;
  errorMessage?: string;
  successRate?: number;
  nextScheduled?: string;
}

export interface BatchMetrics {
  totalJobs: number;
  successRate: number;
  avgDurationMinutes: number;
  failedToday: number;
  pendingJobs: number;
  lastSuccessful: string;
}

// ── EP-05: Lineage ────────────────────────────────────────────────────────────

export interface LineageNode {
  id: string;
  name: string;
  type: 'SOURCE' | 'PROCESS' | 'TABLE' | 'MODEL' | 'OUTPUT';
  layer: DataLayer;
  status: ProcessStatus;
  lastUpdated: string;
  recordCount?: number;
}

export interface LineageEdge {
  id: string;
  sourceId: string;
  targetId: string;
  transformationType: string;
  dataVolume?: number;
  status: ProcessStatus;
}

export interface PipelineRun {
  runId: string;
  pipelineName: string;
  layer: DataLayer;
  startTime: string;
  endTime?: string;
  status: ProcessStatus;
  stepsTotal: number;
  stepsCompleted: number;
  stepsFailled: number;
  nodes: LineageNode[];
  edges: LineageEdge[];
}

// ── API Response wrapper ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}
