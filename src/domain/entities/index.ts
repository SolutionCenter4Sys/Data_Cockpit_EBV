// ── Shared ──────────────────────────────────────────────────────────────────

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'HEALTHY';
export type ProcessStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'WARNING' | 'PENDING';
export type DataLayer = 'INGESTION' | 'TRUSTED' | 'ANALYTICS';
export type TrendDirection = 'UP' | 'DOWN' | 'STABLE';

export type PipelineStage = 'INGESTAO' | 'GOVERNANCA' | 'DW' | 'ANALYTICS_STAGE' | 'DELIVERY' | 'PRODUTOS';

export interface StageHealth {
  stage: PipelineStage;
  label: string;
  owner: string;
  healthScore: number;
  activeAlerts: number;
  qualityChecks: number;
  qualityPassing: number;
  lastUpdated: string;
}

export interface DiscoveryResult {
  id: string;
  type: 'TABLE' | 'COLUMN' | 'QUALITY_RULE' | 'ALERT' | 'CONNECTOR' | 'PIPELINE';
  name: string;
  description: string;
  source: string;
  relevance: number;
  metadata: Record<string, string>;
}

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

// ── Catálogo de Dados ────────────────────────────────────────────────────────

export type DataSourceType = 'POSTGRESQL' | 'BIGQUERY' | 'GCS' | 'ORACLE' | 'MYSQL' | 'KAFKA' | 'REST_API';

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  layer: DataLayer;
  owner: string;
  description: string;
  tags: string[];
  tablesCount: number;
  recordsTotal: number;
  lastSync: string;
  status: ProcessStatus;
  qualityScore: number;
  hasAlerts: boolean;
  connectorId: string;
}

export interface DataAsset {
  id: string;
  sourceId: string;
  name: string;
  type: 'TABLE' | 'VIEW' | 'TOPIC' | 'ENDPOINT' | 'BUCKET';
  schema: string;
  columns: number;
  rows: number;
  owner: string;
  tags: string[];
  qualityScore: number;
  lastUpdated: string;
  description: string;
  hasTests: boolean;
  piiFields: string[];
}

// ── Hub de Eventos ───────────────────────────────────────────────────────────

export type EventType = 'INGESTION' | 'TRANSFORMATION' | 'VALIDATION' | 'ALERT' | 'QUALITY_CHECK' | 'SCHEMA_CHANGE';

export interface DataEvent {
  id: string;
  type: EventType;
  source: string;
  layer: DataLayer;
  status: ProcessStatus;
  timestamp: string;
  payload: Record<string, unknown>;
  schemaValid: boolean;
  metadata: Record<string, string>;
  processingTimeMs: number;
}

export interface EventStats {
  totalToday: number;
  eventsPerMinute: number;
  failedEvents: number;
  schemaViolations: number;
  avgProcessingMs: number;
  byLayer: Record<DataLayer, number>;
}

// ── Qualidade de Dados ───────────────────────────────────────────────────────

export type TestResult = 'PASS' | 'FAIL' | 'ERROR' | 'PENDING';
export type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'NONE';

export interface QualityTest {
  id: string;
  name: string;
  sourceId: string;
  sourceName: string;
  query: string;
  expectedResult: string;
  lastResult: TestResult;
  lastRunAt: string;
  schedule: string;
  createdBy: string;
  severity: SeverityLevel;
  description: string;
  tableName: string;
  columnName: string;
  failureReason: string;
  incidentStatus: IncidentStatus;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: string[];
  owner: string;
  lastRun: string;
  passRate: number;
  totalTests: number;
  passingTests: number;
}

export interface QualityIndicator {
  pipeline: string;
  layer: DataLayer;
  completeness: number;
  accuracy: number;
  freshness: number;
  consistency: number;
  overallScore: number;
  testsTotal: number;
  testsPassing: number;
  lastChecked: string;
}

// ── Query Builder ────────────────────────────────────────────────────────────

export type BlockType = 'SOURCE' | 'FILTER' | 'JOIN' | 'AGGREGATE' | 'OUTPUT';

export interface QueryBlock {
  id: string;
  type: BlockType;
  label: string;
  config: Record<string, string>;
  position: { x: number; y: number };
}

export interface QueryConnection {
  id: string;
  fromId: string;
  toId: string;
}

export interface SavedQuery {
  id: string;
  name: string;
  description: string;
  blocks: QueryBlock[];
  connections: QueryConnection[];
  generatedSql: string;
  createdBy: string;
  createdAt: string;
  lastRunAt: string;
  resultPreview: Record<string, unknown>[];
}

// ── Motor de Regras ──────────────────────────────────────────────────────────

export type RuleCategory = 'QUALITY' | 'ALERT' | 'ROUTING' | 'TRANSFORMATION' | 'VALIDATION';

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  condition: string;
  action: string;
  severity: SeverityLevel;
  layer: DataLayer;
  enabled: boolean;
  schedule: string;
  triggerCount: number;
  lastTriggeredAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  notifyChannels: string[];
  autoBlocking: boolean;
}

export interface RuleExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  executedAt: string;
  result: 'TRIGGERED' | 'PASSED' | 'ERROR';
  affectedRecords: number;
  executionTimeMs: number;
  details: string;
}

// ── Conectores e Credenciais ─────────────────────────────────────────────────

export type ConnectorType = 'POSTGRESQL' | 'MYSQL' | 'ORACLE' | 'SQLSERVER' | 'BIGQUERY' | 'GCS' | 'KAFKA' | 'REST_API' | 'SDK';
export type ConnectorStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'TESTING';
export type CredentialType = 'USERNAME_PASSWORD' | 'SERVICE_ACCOUNT' | 'API_KEY' | 'OAUTH2' | 'CERTIFICATE';
export type CredentialStatus = 'VALID' | 'EXPIRED' | 'REVOKED';

export interface Connector {
  id: string;
  name: string;
  type: ConnectorType;
  host: string;
  port: number;
  database: string;
  status: ConnectorStatus;
  lastHealthCheck: string;
  latencyMs: number;
  poolSize: number;
  activeConnections: number;
  credentialId: string;
  autoReconnect: boolean;
  createdAt: string;
  layer: DataLayer;
}

export interface Credential {
  id: string;
  name: string;
  type: CredentialType;
  connectorId: string;
  createdAt: string;
  lastRotated: string;
  expiresAt: string | null;
  status: CredentialStatus;
}

// ── SLA & ROI ────────────────────────────────────────────────────────────────

export interface SlaMetric {
  layer: DataLayer;
  target: number;
  actual: number;
  trend: TrendDirection;
}

export interface RoiMetric {
  label: string;
  value: number;
  unit: string;
  trend: TrendDirection;
}

// ── Lineage Análise ──────────────────────────────────────────────────────────

export interface BottleneckAnalysis {
  nodeId: string;
  nodeName: string;
  layer: DataLayer;
  avgLatencyMs: number;
  volumePerHour: number;
  severity: SeverityLevel;
  suggestion: string;
}

export interface RedundancyReport {
  id: string;
  type: 'REDUNDANT_FLOW' | 'DEPRECATED_SOURCE' | 'MISSING_FLOW';
  description: string;
  affectedNodes: string[];
  impact: SeverityLevel;
  recommendation: string;
}

// ── API Response wrapper ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}
