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
} from '../../domain/entities';

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  overallHealth: 74,
  activeAlerts: 12,
  criticalAlerts: 3,
  lastRefreshed: new Date().toISOString(),
  kpis: [
    { label: 'Score Zerado', value: 7.4, unit: '%', trend: 'DOWN', trendValue: '-2.1%', severity: 'HIGH', icon: 'TrendingDown' },
    { label: 'Falhas Batch', value: 5, unit: '', trend: 'UP', trendValue: '+2', severity: 'CRITICAL', icon: 'Error' },
    { label: 'Modelos Monitorados', value: 98, unit: '', trend: 'STABLE', trendValue: '0', severity: 'HEALTHY', icon: 'Analytics' },
    { label: 'Ingestão OK', value: 94.2, unit: '%', trend: 'STABLE', trendValue: '-0.3%', severity: 'MEDIUM', icon: 'CloudDone' },
  ],
  layerHealth: [
    { layer: 'INGESTION', healthScore: 89, activeAlerts: 2, successRate: 94.2, lastUpdated: '2026-03-19T10:30:00Z' },
    { layer: 'TRUSTED', healthScore: 72, activeAlerts: 5, successRate: 87.6, lastUpdated: '2026-03-19T10:28:00Z' },
    { layer: 'ANALYTICS', healthScore: 61, activeAlerts: 5, successRate: 79.4, lastUpdated: '2026-03-19T10:25:00Z' },
  ],
};

// ── Score ─────────────────────────────────────────────────────────────────────

export const MOCK_SCORE_METRICS: ScoreMetric[] = [
  { modelId: 'MDL-001', modelName: 'Score Crédito PF Principal', currentScore: 612, previousScore: 648, deviation: -5.6, zeratedCount: 182400, zeratedPercent: 7.1, status: 'HIGH', lastUpdated: '2026-03-19T10:25:00Z', layer: 'ANALYTICS' },
  { modelId: 'MDL-002', modelName: 'Score Risco PJ Porte Grande', currentScore: 754, previousScore: 751, deviation: 0.4, zeratedCount: 4320, zeratedPercent: 0.8, status: 'HEALTHY', lastUpdated: '2026-03-19T10:24:00Z', layer: 'ANALYTICS' },
  { modelId: 'MDL-003', modelName: 'Score Fraude Transacional', currentScore: 433, previousScore: 587, deviation: -26.2, zeratedCount: 92100, zeratedPercent: 10.3, status: 'CRITICAL', lastUpdated: '2026-03-19T10:22:00Z', layer: 'ANALYTICS' },
  { modelId: 'MDL-004', modelName: 'Score Comportamental PF', currentScore: 698, previousScore: 702, deviation: -0.6, zeratedCount: 8640, zeratedPercent: 1.2, status: 'HEALTHY', lastUpdated: '2026-03-19T10:21:00Z', layer: 'ANALYTICS' },
  { modelId: 'MDL-005', modelName: 'Score Crédito PF Regional', currentScore: 541, previousScore: 556, deviation: -2.7, zeratedCount: 51840, zeratedPercent: 4.8, status: 'MEDIUM', lastUpdated: '2026-03-19T10:20:00Z', layer: 'ANALYTICS' },
  { modelId: 'MDL-006', modelName: 'Score Recuperação Crédito', currentScore: 489, previousScore: 503, deviation: -2.8, zeratedCount: 32400, zeratedPercent: 3.6, status: 'MEDIUM', lastUpdated: '2026-03-19T10:19:00Z', layer: 'ANALYTICS' },
];

export const MOCK_SCORE_ANOMALIES: ScoreAnomalyEvent[] = [
  { id: 'EVT-001', modelId: 'MDL-003', eventType: 'ZERADO', description: 'Score zerado detectado em 10,3% da base do modelo de Fraude Transacional', affectedRecords: 92100, detectedAt: '2026-03-19T08:14:00Z', severity: 'CRITICAL', rootCause: 'Falha na cópia do arquivo FFT na camada Ingestion (processo batch ETL-047)' },
  { id: 'EVT-002', modelId: 'MDL-001', eventType: 'ANOMALIA', description: 'Oscilação anômala de -5.6% no Score Crédito PF Principal fora do intervalo esperado', affectedRecords: 182400, detectedAt: '2026-03-19T09:02:00Z', severity: 'HIGH', rootCause: 'Variável de enriquecimento de endereço com dados inconsistentes (Ingestion)' },
  { id: 'EVT-003', modelId: 'MDL-005', eventType: 'OSCILACAO', description: 'Variação de -2.7% detectada no Score Crédito PF Regional', affectedRecords: 51840, detectedAt: '2026-03-19T09:45:00Z', severity: 'MEDIUM' },
];

export const generateScoreTimeSeries = (modelId: string): ScoreTimeSeries[] => {
  const base = modelId === 'MDL-003' ? 580 : modelId === 'MDL-001' ? 640 : 700;
  return Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
    scoreAvg: base + (Math.random() - 0.5) * 40,
    zeratedCount: Math.floor(Math.random() * 15000),
    modelId,
  }));
};

// ── Alerts ────────────────────────────────────────────────────────────────────

export const MOCK_ALERTS: Alert[] = [
  { id: 'ALT-001', title: 'Score Zerado — Modelo MDL-003 (10.3%)', description: 'Percentual de score zerado atingiu o limiar crítico de 10% na base do modelo de Fraude Transacional.', severity: 'CRITICAL', layer: 'ANALYTICS', area: 'Risk', triggeredAt: '2026-03-19T08:14:22Z', status: 'OPEN', triggerType: 'SCORE_ZERO', affectedProcess: 'MDL-003 Score Engine', suggestedAction: 'Verificar processo ETL-047 e reprocessar arquivo FFT corrompido.', autoAction: 'Processo de alertas enviados para equipe de dados via mensageria.' },
  { id: 'ALT-002', title: 'Falha Crítica — Job ETL-047 (Ingestion)', description: 'Job de ingestão ETL-047 falhou após 3 tentativas. Arquivo FFT não foi copiado corretamente.', severity: 'CRITICAL', layer: 'INGESTION', area: 'Engineering', triggeredAt: '2026-03-19T07:58:10Z', status: 'ACKNOWLEDGED', triggerType: 'BATCH_FAILURE', affectedProcess: 'ETL-047 FFT Copy Job', suggestedAction: 'Reexecutar manualmente o job ETL-047 com validação de checksum.', acknowledgedAt: '2026-03-19T08:30:00Z' },
  { id: 'ALT-003', title: 'Latência Elevada — Trusted Layer (340ms)', description: 'Latência da camada Trusted atingiu 340ms, ultrapassando o limiar de 300ms definido.', severity: 'HIGH', layer: 'TRUSTED', area: 'Engineering', triggeredAt: '2026-03-19T09:12:00Z', status: 'OPEN', triggerType: 'LATENCY', affectedProcess: 'Trusted Data Validation Service', suggestedAction: 'Escalar capacidade do serviço de validação. Verificar queries lentas.' },
  { id: 'ALT-004', title: 'Inconsistência — Variável Endereço (Enriquecimento)', description: 'Taxa de inconsistência na variável de endereço atingiu 8.2% na camada de Ingestion.', severity: 'HIGH', layer: 'INGESTION', area: 'Retail', triggeredAt: '2026-03-19T08:45:00Z', status: 'OPEN', triggerType: 'THRESHOLD', affectedProcess: 'Enrichment Service — Endereço', suggestedAction: 'Investigar fonte de dados de enriquecimento de endereço. Validar API externa.' },
  { id: 'ALT-005', title: 'Modelos sem Métricas — Analytics (900+)', description: 'Detectados 912 modelos analíticos sem métricas de monitoramento configuradas.', severity: 'MEDIUM', layer: 'ANALYTICS', area: 'Risk', triggeredAt: '2026-03-19T06:00:00Z', status: 'OPEN', triggerType: 'THRESHOLD', affectedProcess: 'Model Metrics Registry', suggestedAction: 'Mapear e configurar métricas para os 912 modelos não monitorados.' },
  { id: 'ALT-006', title: 'Job Atrasado — BATCH-092 (Trusted)', description: 'Job BATCH-092 está com 45 minutos de atraso em relação ao SLA definido.', severity: 'MEDIUM', layer: 'TRUSTED', area: 'Engineering', triggeredAt: '2026-03-19T05:15:00Z', status: 'ACKNOWLEDGED', triggerType: 'BATCH_FAILURE', affectedProcess: 'BATCH-092 Trusted Sync', suggestedAction: 'Verificar dependências do job BATCH-092. Avaliar impacto no SLA downstream.', acknowledgedAt: '2026-03-19T05:30:00Z' },
  { id: 'ALT-007', title: 'Anomalia — Score PF Região Sul', description: 'Desvio padrão do Score PF detectado 2.3x acima do normal para a Região Sul.', severity: 'MEDIUM', layer: 'ANALYTICS', area: 'Finance', triggeredAt: '2026-03-19T10:01:00Z', status: 'RESOLVED', triggerType: 'ANOMALY', affectedProcess: 'MDL-005 Regional Score Engine', suggestedAction: 'Monitorar por 2h. Se persistir, acionar equipe de Data Science.', resolvedAt: '2026-03-19T10:10:00Z' },
];

export const MOCK_ALERT_RULES: AlertRule[] = [
  { id: 'RUL-001', name: 'Score Zerado > 5%', condition: 'zeratedPercent > 5', threshold: 5, severity: 'CRITICAL', layer: 'ANALYTICS', enabled: true, triggerCount: 4, lastTriggered: '2026-03-19T08:14:22Z' },
  { id: 'RUL-002', name: 'Score Zerado > 2%', condition: 'zeratedPercent > 2', threshold: 2, severity: 'HIGH', layer: 'ANALYTICS', enabled: true, triggerCount: 12, lastTriggered: '2026-03-19T09:02:00Z' },
  { id: 'RUL-003', name: 'Falha de Job Batch', condition: 'batchStatus == FAILED', threshold: 0, severity: 'CRITICAL', layer: 'INGESTION', enabled: true, triggerCount: 8, lastTriggered: '2026-03-19T07:58:10Z' },
  { id: 'RUL-004', name: 'Latência > 300ms', condition: 'responseTime > 300', threshold: 300, severity: 'HIGH', layer: 'TRUSTED', enabled: true, triggerCount: 3 },
  { id: 'RUL-005', name: 'Desvio Score > 10%', condition: 'scoreDeviation > 10', threshold: 10, severity: 'HIGH', layer: 'ANALYTICS', enabled: true, triggerCount: 2 },
  { id: 'RUL-006', name: 'Inconsistência Dados > 5%', condition: 'inconsistencyRate > 5', threshold: 5, severity: 'MEDIUM', layer: 'INGESTION', enabled: true, triggerCount: 6 },
];

// ── Batch ─────────────────────────────────────────────────────────────────────

export const MOCK_BATCH_JOBS: BatchJob[] = [
  { jobId: 'ETL-047', jobName: 'FFT File Copy — Ingestion', layer: 'INGESTION', status: 'FAILED', startTime: '2026-03-19T07:45:00Z', endTime: '2026-03-19T07:58:10Z', durationMinutes: 13, recordsProcessed: 0, recordsFailed: 1, errorMessage: 'Arquivo FFT corrompido. Checksum inválido. Falha após 3 tentativas.', successRate: 0, nextScheduled: '2026-03-19T11:00:00Z' },
  { jobId: 'BATCH-092', jobName: 'Trusted Layer Sync', layer: 'TRUSTED', status: 'WARNING', startTime: '2026-03-19T04:30:00Z', durationMinutes: 98, recordsProcessed: 1243000, recordsFailed: 2100, errorMessage: 'Execução acima do SLA (45min de atraso)', successRate: 99.83, nextScheduled: '2026-03-19T12:00:00Z' },
  { jobId: 'BATCH-031', jobName: 'Score Engine — Crédito PF', layer: 'ANALYTICS', status: 'SUCCESS', startTime: '2026-03-19T06:00:00Z', endTime: '2026-03-19T07:12:00Z', durationMinutes: 72, recordsProcessed: 2568000, recordsFailed: 0, successRate: 100, nextScheduled: '2026-03-19T18:00:00Z' },
  { jobId: 'ETL-023', jobName: 'Enrichment — Endereço PF', layer: 'INGESTION', status: 'WARNING', startTime: '2026-03-19T08:00:00Z', endTime: '2026-03-19T08:28:00Z', durationMinutes: 28, recordsProcessed: 890000, recordsFailed: 73000, errorMessage: 'Taxa de inconsistência de 8.2% na variável endereço', successRate: 91.8, nextScheduled: '2026-03-19T14:00:00Z' },
  { jobId: 'BATCH-055', jobName: 'Analytics Aggregation — PJ', layer: 'ANALYTICS', status: 'SUCCESS', startTime: '2026-03-19T05:00:00Z', endTime: '2026-03-19T05:45:00Z', durationMinutes: 45, recordsProcessed: 340000, recordsFailed: 0, successRate: 100, nextScheduled: '2026-03-20T05:00:00Z' },
  { jobId: 'BATCH-078', jobName: 'Model Feature Refresh', layer: 'ANALYTICS', status: 'RUNNING', startTime: '2026-03-19T10:00:00Z', recordsProcessed: 820000, successRate: 98.7, nextScheduled: '2026-03-19T22:00:00Z' },
  { jobId: 'ETL-061', jobName: 'Histórico Financeiro — Ingestion', layer: 'INGESTION', status: 'PENDING', startTime: '', nextScheduled: '2026-03-19T11:30:00Z' },
];

export const MOCK_BATCH_METRICS: BatchMetrics = {
  totalJobs: 7,
  successRate: 71.4,
  avgDurationMinutes: 52,
  failedToday: 1,
  pendingJobs: 1,
  lastSuccessful: '2026-03-19T07:12:00Z',
};

// ── Lineage ───────────────────────────────────────────────────────────────────

export const MOCK_PIPELINE_RUNS: PipelineRun[] = [
  {
    runId: 'RUN-20260319-001',
    pipelineName: 'Score Crédito PF — Pipeline Completo',
    layer: 'ANALYTICS',
    startTime: '2026-03-19T06:00:00Z',
    endTime: '2026-03-19T07:12:00Z',
    status: 'SUCCESS',
    stepsTotal: 7,
    stepsCompleted: 7,
    stepsFailled: 0,
    nodes: [
      { id: 'n1', name: 'Fonte Histórico Financeiro', type: 'SOURCE', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-19T06:05:00Z', recordCount: 2800000 },
      { id: 'n2', name: 'ETL Enriquecimento Endereço', type: 'PROCESS', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-19T06:20:00Z', recordCount: 2800000 },
      { id: 'n3', name: 'Trusted — Tabela PF Enriquecida', type: 'TABLE', layer: 'TRUSTED', status: 'SUCCESS', lastUpdated: '2026-03-19T06:45:00Z', recordCount: 2794000 },
      { id: 'n4', name: 'Validação Qualidade Trusted', type: 'PROCESS', layer: 'TRUSTED', status: 'SUCCESS', lastUpdated: '2026-03-19T06:50:00Z', recordCount: 2794000 },
      { id: 'n5', name: 'Feature Engineering PF', type: 'PROCESS', layer: 'ANALYTICS', status: 'SUCCESS', lastUpdated: '2026-03-19T07:00:00Z', recordCount: 2794000 },
      { id: 'n6', name: 'MDL-001 Score Crédito PF', type: 'MODEL', layer: 'ANALYTICS', status: 'SUCCESS', lastUpdated: '2026-03-19T07:08:00Z', recordCount: 2568000 },
      { id: 'n7', name: 'Score Output — Crédito PF', type: 'OUTPUT', layer: 'ANALYTICS', status: 'SUCCESS', lastUpdated: '2026-03-19T07:12:00Z', recordCount: 2568000 },
    ],
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2', transformationType: 'ETL', dataVolume: 2800000, status: 'SUCCESS' },
      { id: 'e2', sourceId: 'n2', targetId: 'n3', transformationType: 'LOAD', dataVolume: 2800000, status: 'SUCCESS' },
      { id: 'e3', sourceId: 'n3', targetId: 'n4', transformationType: 'VALIDATION', dataVolume: 2794000, status: 'SUCCESS' },
      { id: 'e4', sourceId: 'n4', targetId: 'n5', transformationType: 'FEATURE_ENG', dataVolume: 2794000, status: 'SUCCESS' },
      { id: 'e5', sourceId: 'n5', targetId: 'n6', transformationType: 'SCORING', dataVolume: 2794000, status: 'SUCCESS' },
      { id: 'e6', sourceId: 'n6', targetId: 'n7', transformationType: 'OUTPUT', dataVolume: 2568000, status: 'SUCCESS' },
    ],
  },
  {
    runId: 'RUN-20260319-002',
    pipelineName: 'Score Fraude Transacional — Pipeline',
    layer: 'ANALYTICS',
    startTime: '2026-03-19T07:45:00Z',
    endTime: '2026-03-19T07:58:10Z',
    status: 'FAILED',
    stepsTotal: 6,
    stepsCompleted: 1,
    stepsFailled: 1,
    nodes: [
      { id: 'n1', name: 'Fonte FFT — Transações', type: 'SOURCE', layer: 'INGESTION', status: 'FAILED', lastUpdated: '2026-03-19T07:58:10Z', recordCount: 0 },
      { id: 'n2', name: 'ETL FFT Copy', type: 'PROCESS', layer: 'INGESTION', status: 'FAILED', lastUpdated: '2026-03-19T07:58:10Z', recordCount: 0 },
      { id: 'n3', name: 'Trusted — Tabela Transações', type: 'TABLE', layer: 'TRUSTED', status: 'PENDING', lastUpdated: '', recordCount: 0 },
      { id: 'n4', name: 'Feature Engineering Fraude', type: 'PROCESS', layer: 'ANALYTICS', status: 'PENDING', lastUpdated: '', recordCount: 0 },
      { id: 'n5', name: 'MDL-003 Score Fraude', type: 'MODEL', layer: 'ANALYTICS', status: 'PENDING', lastUpdated: '', recordCount: 0 },
      { id: 'n6', name: 'Score Output — Fraude', type: 'OUTPUT', layer: 'ANALYTICS', status: 'PENDING', lastUpdated: '', recordCount: 0 },
    ],
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2', transformationType: 'ETL', dataVolume: 0, status: 'FAILED' },
      { id: 'e2', sourceId: 'n2', targetId: 'n3', transformationType: 'LOAD', dataVolume: 0, status: 'PENDING' },
      { id: 'e3', sourceId: 'n3', targetId: 'n4', transformationType: 'FEATURE_ENG', dataVolume: 0, status: 'PENDING' },
      { id: 'e4', sourceId: 'n4', targetId: 'n5', transformationType: 'SCORING', dataVolume: 0, status: 'PENDING' },
      { id: 'e5', sourceId: 'n5', targetId: 'n6', transformationType: 'OUTPUT', dataVolume: 0, status: 'PENDING' },
    ],
  },
];
