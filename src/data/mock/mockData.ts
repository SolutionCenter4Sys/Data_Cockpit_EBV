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
  activeAlerts: 23,
  criticalAlerts: 3,
  lastRefreshed: new Date().toISOString(),
  kpis: [
    { label: 'Score Zerado', value: 7.4, unit: '%', trend: 'DOWN', trendValue: '-2.1%', severity: 'HIGH', icon: 'TrendingDown' },
    { label: 'Falhas Batch', value: 5, unit: '', trend: 'UP', trendValue: '+2', severity: 'CRITICAL', icon: 'Error' },
    { label: 'Modelos Monitorados', value: 98, unit: '', trend: 'STABLE', trendValue: '0', severity: 'HEALTHY', icon: 'Analytics' },
    { label: 'Quality Rate', value: 79, unit: '%', trend: 'STABLE', trendValue: '-1.2%', severity: 'MEDIUM', icon: 'CloudDone' },
  ],
  layerHealth: [
    { layer: 'INGESTION', healthScore: 94, activeAlerts: 2, successRate: 89, lastUpdated: '2026-03-29T10:15:00Z' },
    { layer: 'TRUSTED', healthScore: 95, activeAlerts: 17, successRate: 50, lastUpdated: '2026-03-29T10:10:00Z' },
    { layer: 'ANALYTICS', healthScore: 88, activeAlerts: 4, successRate: 80, lastUpdated: '2026-03-29T10:08:00Z' },
  ],
};

// ── Score ─────────────────────────────────────────────────────────────────────

export const MOCK_SCORE_METRICS: ScoreMetric[] = [
  { modelId: 'MDL-001', modelName: 'Score Crédito PF Principal', currentScore: 612, previousScore: 648, deviation: -5.6, zeratedCount: 182400, zeratedPercent: 7.1, status: 'HIGH', lastUpdated: '2026-03-29T10:08:00Z', layer: 'ANALYTICS' },
  { modelId: 'MDL-002', modelName: 'Score Risco PJ Porte Grande', currentScore: 754, previousScore: 751, deviation: 0.4, zeratedCount: 4320, zeratedPercent: 0.8, status: 'HEALTHY', lastUpdated: '2026-03-29T10:08:00Z', layer: 'ANALYTICS' },
  { modelId: 'MDL-003', modelName: 'Score Fraude Transacional', currentScore: 433, previousScore: 587, deviation: -26.2, zeratedCount: 92100, zeratedPercent: 10.3, status: 'CRITICAL', lastUpdated: '2026-03-29T10:08:00Z', layer: 'ANALYTICS' },
  { modelId: 'MDL-004', modelName: 'Score Comportamental PF', currentScore: 698, previousScore: 702, deviation: -0.6, zeratedCount: 8640, zeratedPercent: 1.2, status: 'HEALTHY', lastUpdated: '2026-03-29T10:08:00Z', layer: 'ANALYTICS' },
  { modelId: 'MDL-005', modelName: 'Score Crédito PF Regional', currentScore: 541, previousScore: 556, deviation: -2.7, zeratedCount: 51840, zeratedPercent: 4.8, status: 'MEDIUM', lastUpdated: '2026-03-29T10:08:00Z', layer: 'ANALYTICS' },
  { modelId: 'MDL-006', modelName: 'Score Recuperação Crédito', currentScore: 489, previousScore: 503, deviation: -2.8, zeratedCount: 32400, zeratedPercent: 3.6, status: 'MEDIUM', lastUpdated: '2026-03-29T10:08:00Z', layer: 'ANALYTICS' },
];

export const MOCK_SCORE_ANOMALIES: ScoreAnomalyEvent[] = [
  { id: 'EVT-001', modelId: 'MDL-003', eventType: 'ZERADO', description: 'Score zerado detectado em 10,3% da base do modelo de Fraude Transacional', affectedRecords: 92100, detectedAt: '2026-03-29T08:14:00Z', severity: 'CRITICAL', rootCause: 'Falha na cópia do arquivo FFT na camada Ingestion (processo batch ETL-047)' },
  { id: 'EVT-002', modelId: 'MDL-001', eventType: 'ANOMALIA', description: 'Oscilação anômala de -5.6% no Score Crédito PF Principal fora do intervalo esperado', affectedRecords: 182400, detectedAt: '2026-03-29T09:02:00Z', severity: 'HIGH', rootCause: 'Variável de enriquecimento de endereço com dados inconsistentes (Ingestion)' },
  { id: 'EVT-003', modelId: 'MDL-005', eventType: 'OSCILACAO', description: 'Variação de -2.7% detectada no Score Crédito PF Regional', affectedRecords: 51840, detectedAt: '2026-03-29T09:45:00Z', severity: 'MEDIUM' },
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
  // ── Ingestão (2 alertas OPEN — bate com StageHealth INGESTAO activeAlerts:2) ──
  { id: 'ALT-001', title: 'Falha Crítica — Job ETL-047 (Ingestion)', description: 'Job de ingestão ETL-047 falhou após 3 tentativas. Arquivo FFT não foi copiado corretamente.', severity: 'CRITICAL', layer: 'INGESTION', area: 'Engineering', triggeredAt: '2026-03-29T07:58:10Z', status: 'ACKNOWLEDGED', triggerType: 'BATCH_FAILURE', affectedProcess: 'ETL-047 FFT Copy Job', suggestedAction: 'Reexecutar manualmente o job ETL-047 com validação de checksum.', acknowledgedAt: '2026-03-29T08:30:00Z' },
  { id: 'ALT-002', title: 'Inconsistência — Variável Endereço (Enriquecimento)', description: 'Taxa de inconsistência na variável de endereço atingiu 8.2% na camada de Ingestion.', severity: 'HIGH', layer: 'INGESTION', area: 'Retail', triggeredAt: '2026-03-29T08:45:00Z', status: 'OPEN', triggerType: 'THRESHOLD', affectedProcess: 'Enrichment Service — Endereço', suggestedAction: 'Investigar fonte de dados de enriquecimento de endereço. Validar API externa.' },

  // ── Governança (1 alerta OPEN — bate com StageHealth GOVERNANCA activeAlerts:1) ──
  { id: 'ALT-023', title: 'Regra de governança violada — classificação PII', description: 'Coluna email detectada sem tag PII obrigatória em 3 tabelas da camada Governança.', severity: 'MEDIUM', layer: 'TRUSTED', area: 'Compliance', triggeredAt: '2026-03-29T08:20:00Z', status: 'OPEN', triggerType: 'THRESHOLD', affectedProcess: 'Governance Tag Validator', suggestedAction: 'Aplicar tags PII faltantes e revisar política de classificação.' },

  // ── DW / Trusted (16 alertas OPEN — bate com StageHealth DW activeAlerts:16) ──
  { id: 'ALT-003', title: 'Latência Elevada — Trusted Layer (340ms)', description: 'Latência da camada Trusted atingiu 340ms, ultrapassando o limiar de 300ms definido.', severity: 'HIGH', layer: 'TRUSTED', area: 'Engineering', triggeredAt: '2026-03-29T09:12:00Z', status: 'OPEN', triggerType: 'LATENCY', affectedProcess: 'Trusted Data Validation Service', suggestedAction: 'Escalar capacidade do serviço de validação.' },
  { id: 'ALT-004', title: 'Job Atrasado — BATCH-092 (Trusted)', description: 'Job BATCH-092 está com 45 minutos de atraso em relação ao SLA definido.', severity: 'MEDIUM', layer: 'TRUSTED', area: 'Engineering', triggeredAt: '2026-03-29T05:15:00Z', status: 'OPEN', triggerType: 'BATCH_FAILURE', affectedProcess: 'BATCH-092 Trusted Sync', suggestedAction: 'Verificar dependências do job BATCH-092.' },
  { id: 'ALT-005', title: 'Completeness Check falhou — DW tabela financeiro', description: 'Teste de completude retornou 72% (limiar 95%) na tabela fact_financeiro.', severity: 'CRITICAL', layer: 'TRUSTED', area: 'Finance', triggeredAt: '2026-03-29T06:10:00Z', status: 'OPEN', triggerType: 'THRESHOLD', affectedProcess: 'DW Completeness Gate', suggestedAction: 'Verificar job de carga da tabela fact_financeiro.' },
  { id: 'ALT-006', title: 'Freshness SLA violado — dim_produto', description: 'Dados da dimensão produto estão 4h defasados. SLA é 1h.', severity: 'HIGH', layer: 'TRUSTED', area: 'Engineering', triggeredAt: '2026-03-29T07:20:00Z', status: 'OPEN', triggerType: 'LATENCY', affectedProcess: 'DW dim_produto Refresh', suggestedAction: 'Reprocessar carga da dim_produto.' },
  { id: 'ALT-007', title: 'Accuracy falhou — fact_transacoes checksum', description: 'Checksum de fact_transacoes diverge da origem em 3.2%.', severity: 'HIGH', layer: 'TRUSTED', area: 'Risk', triggeredAt: '2026-03-29T07:45:00Z', status: 'OPEN', triggerType: 'THRESHOLD', affectedProcess: 'DW Accuracy Validation', suggestedAction: 'Investigar transformação ETL de fact_transacoes.' },
  { id: 'ALT-008', title: 'Null ratio alto — dim_cliente.cpf', description: 'Coluna CPF com 12% de nulos na dimensão cliente (limiar 0%).', severity: 'HIGH', layer: 'TRUSTED', area: 'Engineering', triggeredAt: '2026-03-29T08:00:00Z', status: 'OPEN', triggerType: 'THRESHOLD', affectedProcess: 'DW dim_cliente Quality', suggestedAction: 'Verificar fonte de dados CRM.' },
  { id: 'ALT-009', title: 'Duplicatas detectadas — fact_pagamentos', description: 'Encontradas 1.247 linhas duplicadas no carregamento mais recente.', severity: 'MEDIUM', layer: 'TRUSTED', area: 'Finance', triggeredAt: '2026-03-29T08:15:00Z', status: 'OPEN', triggerType: 'THRESHOLD', affectedProcess: 'DW Dedup Gate', suggestedAction: 'Rodar deduplicação e investigar origem do reprocessamento.' },
  { id: 'ALT-010', title: 'Schema drift detectado — stg_vendas', description: 'Coluna valor_bruto mudou de DECIMAL(10,2) para VARCHAR.', severity: 'HIGH', layer: 'TRUSTED', area: 'Engineering', triggeredAt: '2026-03-29T08:30:00Z', status: 'OPEN', triggerType: 'ANOMALY', affectedProcess: 'DW Schema Validator', suggestedAction: 'Reverter schema e alinhar com time de ingestão.' },
  { id: 'ALT-011', title: 'Volume anomaly — fact_vendas -40% vs D-1', description: 'Volume de registros 40% menor que o dia anterior.', severity: 'MEDIUM', layer: 'TRUSTED', area: 'Engineering', triggeredAt: '2026-03-29T09:00:00Z', status: 'OPEN', triggerType: 'ANOMALY', affectedProcess: 'DW Volume Monitor', suggestedAction: 'Confirmar com equipe de ingestão se todas as fontes rodaram.' },
  { id: 'ALT-012', title: 'Referential integrity — FK cliente quebrada', description: '89 registros em fact_pedidos sem correspondência em dim_cliente.', severity: 'MEDIUM', layer: 'TRUSTED', area: 'Engineering', triggeredAt: '2026-03-29T09:15:00Z', status: 'OPEN', triggerType: 'THRESHOLD', affectedProcess: 'DW FK Checker', suggestedAction: 'Verificar carga de dim_cliente e reprocessar pedidos órfãos.' },
  { id: 'ALT-013', title: 'Quality gate barrada — camada DW', description: 'Gate de qualidade bloqueou promoção de 3 tabelas para Analytics por falha acumulada.', severity: 'MEDIUM', layer: 'TRUSTED', area: 'Engineering', triggeredAt: '2026-03-29T09:30:00Z', status: 'OPEN', triggerType: 'THRESHOLD', affectedProcess: 'DW Quality Gate', suggestedAction: 'Corrigir os 11 checks falhados e re-executar gate.' },
  { id: 'ALT-014', title: 'Partition missing — fact_financeiro 2026-03-28', description: 'Partição do dia 28/03 não encontrada na tabela fact_financeiro.', severity: 'HIGH', layer: 'TRUSTED', area: 'Finance', triggeredAt: '2026-03-29T09:45:00Z', status: 'OPEN', triggerType: 'THRESHOLD', affectedProcess: 'DW Partition Monitor', suggestedAction: 'Verificar job de carga da partição e reprocessar.' },
  { id: 'ALT-024', title: 'Timeliness SLA — dim_canal 3h atrasado', description: 'Dimensão canal não foi atualizada nas últimas 3h. SLA é 1h.', severity: 'HIGH', layer: 'TRUSTED', area: 'Engineering', triggeredAt: '2026-03-29T10:00:00Z', status: 'OPEN', triggerType: 'LATENCY', affectedProcess: 'DW dim_canal Refresh', suggestedAction: 'Verificar job de carga da dim_canal.' },
  { id: 'ALT-025', title: 'Row count anomaly — stg_clientes -60%', description: 'Volume de staging de clientes 60% abaixo do esperado.', severity: 'MEDIUM', layer: 'TRUSTED', area: 'Engineering', triggeredAt: '2026-03-29T10:10:00Z', status: 'OPEN', triggerType: 'ANOMALY', affectedProcess: 'DW Volume Monitor stg_clientes', suggestedAction: 'Verificar fonte CRM e job de extração.' },
  { id: 'ALT-026', title: 'Null spike — fact_vendas.valor_liquido', description: 'Coluna valor_liquido com 8% de nulos no último batch (baseline < 0.1%).', severity: 'HIGH', layer: 'TRUSTED', area: 'Finance', triggeredAt: '2026-03-29T10:15:00Z', status: 'OPEN', triggerType: 'THRESHOLD', affectedProcess: 'DW Null Monitor', suggestedAction: 'Investigar transformação de valor_liquido no ETL.' },
  { id: 'ALT-027', title: 'Constraint violation — dim_agencia.codigo duplicado', description: 'Encontrados 23 códigos de agência duplicados após merge incremental.', severity: 'MEDIUM', layer: 'TRUSTED', area: 'Engineering', triggeredAt: '2026-03-29T10:20:00Z', status: 'OPEN', triggerType: 'THRESHOLD', affectedProcess: 'DW Uniqueness Gate', suggestedAction: 'Executar dedup na dim_agencia e revisar regra de merge.' },

  // ── Analytics (3 alertas OPEN — bate com StageHealth ANALYTICS activeAlerts:3) ──
  { id: 'ALT-015', title: 'Score Zerado — Modelo MDL-003 (10.3%)', description: 'Percentual de score zerado atingiu o limiar crítico de 10% na base do modelo de Fraude Transacional.', severity: 'CRITICAL', layer: 'ANALYTICS', area: 'Risk', triggeredAt: '2026-03-29T08:14:22Z', status: 'OPEN', triggerType: 'SCORE_ZERO', affectedProcess: 'MDL-003 Score Engine', suggestedAction: 'Verificar processo ETL-047 e reprocessar arquivo FFT corrompido.', autoAction: 'Processo de alertas enviados para equipe de dados via mensageria.' },
  { id: 'ALT-016', title: 'Modelos sem Métricas — Analytics (900+)', description: 'Detectados 912 modelos analíticos sem métricas de monitoramento configuradas.', severity: 'MEDIUM', layer: 'ANALYTICS', area: 'Risk', triggeredAt: '2026-03-29T06:00:00Z', status: 'OPEN', triggerType: 'THRESHOLD', affectedProcess: 'Model Metrics Registry', suggestedAction: 'Mapear e configurar métricas para os 912 modelos não monitorados.' },
  { id: 'ALT-017', title: 'Feature drift — modelo MDL-001', description: 'Drift detectado na feature renda_mensal: distribuição deslocou 1.8 sigma.', severity: 'HIGH', layer: 'ANALYTICS', area: 'Risk', triggeredAt: '2026-03-29T09:02:00Z', status: 'OPEN', triggerType: 'ANOMALY', affectedProcess: 'MDL-001 Feature Monitor', suggestedAction: 'Acionar Data Science para avaliar retreino do modelo.' },

  // ── Delivery (0 alertas OPEN) ──

  // ── Produtos (1 alerta OPEN — bate com StageHealth PRODUTOS activeAlerts:1) ──
  { id: 'ALT-019', title: 'Produto Score PJ — output atrasado', description: 'Output do produto Score PJ está 2h atrasado em relação ao SLA de entrega.', severity: 'MEDIUM', layer: 'ANALYTICS', area: 'Risk', triggeredAt: '2026-03-29T10:05:00Z', status: 'OPEN', triggerType: 'LATENCY', affectedProcess: 'Produto Score PJ Delivery', suggestedAction: 'Verificar dependências upstream da camada Analytics.' },

  // ── Resolvidos (histórico) ──
  { id: 'ALT-020', title: 'Latência normalizada — Trusted Layer', description: 'Latência voltou ao normal após scaling.', severity: 'MEDIUM', layer: 'TRUSTED', area: 'Engineering', triggeredAt: '2026-03-28T14:00:00Z', status: 'RESOLVED', triggerType: 'LATENCY', affectedProcess: 'Trusted Data Validation Service', suggestedAction: 'Monitorar.', resolvedAt: '2026-03-28T16:00:00Z' },
  { id: 'ALT-021', title: 'Job ETL-023 recuperado', description: 'Enriquecimento de endereço normalizado após correção na API.', severity: 'HIGH', layer: 'INGESTION', area: 'Retail', triggeredAt: '2026-03-28T09:00:00Z', status: 'RESOLVED', triggerType: 'BATCH_FAILURE', affectedProcess: 'ETL-023 Enrichment', suggestedAction: 'OK.', resolvedAt: '2026-03-28T11:30:00Z' },
  { id: 'ALT-022', title: 'Quality gate passou — DW batch noturno', description: 'Gate de qualidade do batch noturno passou com 100%.', severity: 'LOW', layer: 'TRUSTED', area: 'Engineering', triggeredAt: '2026-03-28T04:00:00Z', status: 'RESOLVED', triggerType: 'THRESHOLD', affectedProcess: 'DW Quality Gate', suggestedAction: 'Nenhuma.', resolvedAt: '2026-03-28T04:05:00Z' },
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
  { jobId: 'ETL-047', jobName: 'FFT File Copy — Ingestion', layer: 'INGESTION', status: 'FAILED', startTime: '2026-03-29T07:45:00Z', endTime: '2026-03-29T07:58:10Z', durationMinutes: 13, recordsProcessed: 0, recordsFailed: 1, errorMessage: 'Arquivo FFT corrompido. Checksum inválido. Falha após 3 tentativas.', successRate: 0, nextScheduled: '2026-03-29T11:00:00Z' },
  { jobId: 'BATCH-092', jobName: 'Trusted Layer Sync', layer: 'TRUSTED', status: 'WARNING', startTime: '2026-03-29T04:30:00Z', durationMinutes: 98, recordsProcessed: 1243000, recordsFailed: 2100, errorMessage: 'Execução acima do SLA (45min de atraso)', successRate: 99.83, nextScheduled: '2026-03-29T12:00:00Z' },
  { jobId: 'BATCH-031', jobName: 'Score Engine — Crédito PF', layer: 'ANALYTICS', status: 'SUCCESS', startTime: '2026-03-29T06:00:00Z', endTime: '2026-03-29T07:12:00Z', durationMinutes: 72, recordsProcessed: 2568000, recordsFailed: 0, successRate: 100, nextScheduled: '2026-03-29T18:00:00Z' },
  { jobId: 'ETL-023', jobName: 'Enrichment — Endereço PF', layer: 'INGESTION', status: 'WARNING', startTime: '2026-03-29T08:00:00Z', endTime: '2026-03-29T08:28:00Z', durationMinutes: 28, recordsProcessed: 890000, recordsFailed: 73000, errorMessage: 'Taxa de inconsistência de 8.2% na variável endereço', successRate: 91.8, nextScheduled: '2026-03-29T14:00:00Z' },
  { jobId: 'BATCH-055', jobName: 'Analytics Aggregation — PJ', layer: 'ANALYTICS', status: 'SUCCESS', startTime: '2026-03-29T05:00:00Z', endTime: '2026-03-29T05:45:00Z', durationMinutes: 45, recordsProcessed: 340000, recordsFailed: 0, successRate: 100, nextScheduled: '2026-03-30T05:00:00Z' },
  { jobId: 'BATCH-078', jobName: 'Model Feature Refresh', layer: 'ANALYTICS', status: 'RUNNING', startTime: '2026-03-29T10:00:00Z', recordsProcessed: 820000, successRate: 98.7, nextScheduled: '2026-03-29T22:00:00Z' },
  { jobId: 'ETL-061', jobName: 'Histórico Financeiro — Ingestion', layer: 'INGESTION', status: 'PENDING', startTime: '', nextScheduled: '2026-03-29T11:30:00Z' },
];

export const MOCK_BATCH_METRICS: BatchMetrics = {
  totalJobs: 7,
  successRate: 71.4,
  avgDurationMinutes: 52,
  failedToday: 1,
  pendingJobs: 1,
  lastSuccessful: '2026-03-29T07:12:00Z',
};

// ── Lineage ───────────────────────────────────────────────────────────────────

export const MOCK_PIPELINE_RUNS: PipelineRun[] = [
  {
    runId: 'RUN-20260329-001',
    pipelineName: 'Score Crédito PF — Pipeline Completo',
    layer: 'ANALYTICS',
    startTime: '2026-03-29T06:00:00Z',
    endTime: '2026-03-29T07:12:00Z',
    status: 'SUCCESS',
    stepsTotal: 7,
    stepsCompleted: 7,
    stepsFailled: 0,
    nodes: [
      { id: 'n1', name: 'Fonte Histórico Financeiro', type: 'SOURCE', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T06:05:00Z', recordCount: 2800000 },
      { id: 'n2', name: 'ETL Enriquecimento Endereço', type: 'PROCESS', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T06:20:00Z', recordCount: 2800000 },
      { id: 'n3', name: 'Trusted — Tabela PF Enriquecida', type: 'TABLE', layer: 'TRUSTED', status: 'SUCCESS', lastUpdated: '2026-03-29T06:45:00Z', recordCount: 2794000 },
      { id: 'n4', name: 'Validação Qualidade Trusted', type: 'PROCESS', layer: 'TRUSTED', status: 'SUCCESS', lastUpdated: '2026-03-29T06:50:00Z', recordCount: 2794000 },
      { id: 'n5', name: 'Feature Engineering PF', type: 'PROCESS', layer: 'ANALYTICS', status: 'SUCCESS', lastUpdated: '2026-03-29T07:00:00Z', recordCount: 2794000 },
      { id: 'n6', name: 'MDL-001 Score Crédito PF', type: 'MODEL', layer: 'ANALYTICS', status: 'SUCCESS', lastUpdated: '2026-03-29T07:08:00Z', recordCount: 2568000 },
      { id: 'n7', name: 'Score Output — Crédito PF', type: 'OUTPUT', layer: 'ANALYTICS', status: 'SUCCESS', lastUpdated: '2026-03-29T07:12:00Z', recordCount: 2568000 },
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
    runId: 'RUN-20260329-002',
    pipelineName: 'Score Fraude Transacional — Pipeline',
    layer: 'ANALYTICS',
    startTime: '2026-03-29T07:45:00Z',
    endTime: '2026-03-29T07:58:10Z',
    status: 'FAILED',
    stepsTotal: 6,
    stepsCompleted: 1,
    stepsFailled: 1,
    nodes: [
      { id: 'n1', name: 'Fonte FFT — Transações', type: 'SOURCE', layer: 'INGESTION', status: 'FAILED', lastUpdated: '2026-03-29T07:58:10Z', recordCount: 0 },
      { id: 'n2', name: 'ETL FFT Copy', type: 'PROCESS', layer: 'INGESTION', status: 'FAILED', lastUpdated: '2026-03-29T07:58:10Z', recordCount: 0 },
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
  {
    runId: 'RUN-20260329-003',
    pipelineName: 'Ingestão Core — Dados Financeiros',
    layer: 'INGESTION',
    startTime: '2026-03-29T05:00:00Z',
    endTime: '2026-03-29T05:42:00Z',
    status: 'SUCCESS',
    stepsTotal: 4,
    stepsCompleted: 4,
    stepsFailled: 0,
    nodes: [
      { id: 'n1', name: 'Fonte Financeiro Legacy', type: 'SOURCE', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T05:05:00Z', recordCount: 1200000 },
      { id: 'n2', name: 'ETL Financeiro Extract', type: 'PROCESS', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T05:20:00Z', recordCount: 1200000 },
      { id: 'n3', name: 'Validação Schema', type: 'PROCESS', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T05:35:00Z', recordCount: 1198500 },
      { id: 'n4', name: 'Raw — Financeiro Landing', type: 'TABLE', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T05:42:00Z', recordCount: 1198500 },
    ],
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2', transformationType: 'ETL', dataVolume: 1200000, status: 'SUCCESS' },
      { id: 'e2', sourceId: 'n2', targetId: 'n3', transformationType: 'VALIDATION', dataVolume: 1200000, status: 'SUCCESS' },
      { id: 'e3', sourceId: 'n3', targetId: 'n4', transformationType: 'LOAD', dataVolume: 1198500, status: 'SUCCESS' },
    ],
  },
  {
    runId: 'RUN-20260329-004',
    pipelineName: 'Ingestão CRM — Clientes PF',
    layer: 'INGESTION',
    startTime: '2026-03-29T05:30:00Z',
    endTime: '2026-03-29T06:08:00Z',
    status: 'SUCCESS',
    stepsTotal: 4,
    stepsCompleted: 4,
    stepsFailled: 0,
    nodes: [
      { id: 'n1', name: 'Fonte CRM Oracle', type: 'SOURCE', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T05:35:00Z', recordCount: 890000 },
      { id: 'n2', name: 'ETL CRM Extract', type: 'PROCESS', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T05:50:00Z', recordCount: 890000 },
      { id: 'n3', name: 'Validação & Dedup', type: 'PROCESS', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T06:02:00Z', recordCount: 887200 },
      { id: 'n4', name: 'Raw — CRM Clientes Landing', type: 'TABLE', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T06:08:00Z', recordCount: 887200 },
    ],
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2', transformationType: 'ETL', dataVolume: 890000, status: 'SUCCESS' },
      { id: 'e2', sourceId: 'n2', targetId: 'n3', transformationType: 'VALIDATION', dataVolume: 890000, status: 'SUCCESS' },
      { id: 'e3', sourceId: 'n3', targetId: 'n4', transformationType: 'LOAD', dataVolume: 887200, status: 'SUCCESS' },
    ],
  },
  {
    runId: 'RUN-20260329-005',
    pipelineName: 'DW — Carga Dimensão Cliente',
    layer: 'TRUSTED',
    startTime: '2026-03-29T06:30:00Z',
    endTime: '2026-03-29T07:15:00Z',
    status: 'SUCCESS',
    stepsTotal: 5,
    stepsCompleted: 5,
    stepsFailled: 0,
    nodes: [
      { id: 'n1', name: 'Raw CRM Clientes', type: 'SOURCE', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T06:35:00Z', recordCount: 887200 },
      { id: 'n2', name: 'Transform dim_cliente', type: 'PROCESS', layer: 'TRUSTED', status: 'SUCCESS', lastUpdated: '2026-03-29T06:50:00Z', recordCount: 887200 },
      { id: 'n3', name: 'Quality Gate DW', type: 'PROCESS', layer: 'TRUSTED', status: 'SUCCESS', lastUpdated: '2026-03-29T07:00:00Z', recordCount: 885900 },
      { id: 'n4', name: 'dim_cliente', type: 'TABLE', layer: 'TRUSTED', status: 'SUCCESS', lastUpdated: '2026-03-29T07:10:00Z', recordCount: 885900 },
      { id: 'n5', name: 'Publish dim_cliente', type: 'OUTPUT', layer: 'TRUSTED', status: 'SUCCESS', lastUpdated: '2026-03-29T07:15:00Z', recordCount: 885900 },
    ],
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2', transformationType: 'ETL', dataVolume: 887200, status: 'SUCCESS' },
      { id: 'e2', sourceId: 'n2', targetId: 'n3', transformationType: 'VALIDATION', dataVolume: 887200, status: 'SUCCESS' },
      { id: 'e3', sourceId: 'n3', targetId: 'n4', transformationType: 'LOAD', dataVolume: 885900, status: 'SUCCESS' },
      { id: 'e4', sourceId: 'n4', targetId: 'n5', transformationType: 'OUTPUT', dataVolume: 885900, status: 'SUCCESS' },
    ],
  },
  {
    runId: 'RUN-20260329-006',
    pipelineName: 'DW — Carga fact_financeiro',
    layer: 'TRUSTED',
    startTime: '2026-03-29T06:00:00Z',
    endTime: '2026-03-29T06:55:00Z',
    status: 'FAILED',
    stepsTotal: 5,
    stepsCompleted: 3,
    stepsFailled: 1,
    nodes: [
      { id: 'n1', name: 'Raw Financeiro Landing', type: 'SOURCE', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T06:05:00Z', recordCount: 1198500 },
      { id: 'n2', name: 'Transform fact_financeiro', type: 'PROCESS', layer: 'TRUSTED', status: 'SUCCESS', lastUpdated: '2026-03-29T06:25:00Z', recordCount: 1198500 },
      { id: 'n3', name: 'Quality Gate DW', type: 'PROCESS', layer: 'TRUSTED', status: 'FAILED', lastUpdated: '2026-03-29T06:40:00Z', recordCount: 862920 },
      { id: 'n4', name: 'fact_financeiro', type: 'TABLE', layer: 'TRUSTED', status: 'PENDING', lastUpdated: '', recordCount: 0 },
      { id: 'n5', name: 'Publish fact_financeiro', type: 'OUTPUT', layer: 'TRUSTED', status: 'PENDING', lastUpdated: '', recordCount: 0 },
    ],
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2', transformationType: 'ETL', dataVolume: 1198500, status: 'SUCCESS' },
      { id: 'e2', sourceId: 'n2', targetId: 'n3', transformationType: 'VALIDATION', dataVolume: 1198500, status: 'FAILED' },
      { id: 'e3', sourceId: 'n3', targetId: 'n4', transformationType: 'LOAD', dataVolume: 0, status: 'PENDING' },
      { id: 'e4', sourceId: 'n4', targetId: 'n5', transformationType: 'OUTPUT', dataVolume: 0, status: 'PENDING' },
    ],
  },
  {
    runId: 'RUN-20260329-007',
    pipelineName: 'DW — Carga fact_transacoes',
    layer: 'TRUSTED',
    startTime: '2026-03-29T07:00:00Z',
    endTime: '2026-03-29T07:48:00Z',
    status: 'FAILED',
    stepsTotal: 4,
    stepsCompleted: 2,
    stepsFailled: 1,
    nodes: [
      { id: 'n1', name: 'Raw Transações', type: 'SOURCE', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T07:05:00Z', recordCount: 2100000 },
      { id: 'n2', name: 'Transform fact_transacoes', type: 'PROCESS', layer: 'TRUSTED', status: 'SUCCESS', lastUpdated: '2026-03-29T07:30:00Z', recordCount: 2100000 },
      { id: 'n3', name: 'Accuracy Checksum', type: 'PROCESS', layer: 'TRUSTED', status: 'FAILED', lastUpdated: '2026-03-29T07:48:00Z', recordCount: 2032800 },
      { id: 'n4', name: 'fact_transacoes', type: 'TABLE', layer: 'TRUSTED', status: 'PENDING', lastUpdated: '', recordCount: 0 },
    ],
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2', transformationType: 'ETL', dataVolume: 2100000, status: 'SUCCESS' },
      { id: 'e2', sourceId: 'n2', targetId: 'n3', transformationType: 'VALIDATION', dataVolume: 2100000, status: 'FAILED' },
      { id: 'e3', sourceId: 'n3', targetId: 'n4', transformationType: 'LOAD', dataVolume: 0, status: 'PENDING' },
    ],
  },
  {
    runId: 'RUN-20260329-008',
    pipelineName: 'Analytics — Score Comportamental PF',
    layer: 'ANALYTICS',
    startTime: '2026-03-29T08:00:00Z',
    endTime: '2026-03-29T08:52:00Z',
    status: 'SUCCESS',
    stepsTotal: 4,
    stepsCompleted: 4,
    stepsFailled: 0,
    nodes: [
      { id: 'n1', name: 'dim_cliente + fact_transacoes', type: 'SOURCE', layer: 'TRUSTED', status: 'SUCCESS', lastUpdated: '2026-03-29T08:05:00Z', recordCount: 885900 },
      { id: 'n2', name: 'Feature Engineering Comportamental', type: 'PROCESS', layer: 'ANALYTICS', status: 'SUCCESS', lastUpdated: '2026-03-29T08:25:00Z', recordCount: 885900 },
      { id: 'n3', name: 'MDL-004 Score Comportamental', type: 'MODEL', layer: 'ANALYTICS', status: 'SUCCESS', lastUpdated: '2026-03-29T08:45:00Z', recordCount: 885900 },
      { id: 'n4', name: 'Score Output — Comportamental', type: 'OUTPUT', layer: 'ANALYTICS', status: 'SUCCESS', lastUpdated: '2026-03-29T08:52:00Z', recordCount: 885900 },
    ],
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2', transformationType: 'FEATURE_ENG', dataVolume: 885900, status: 'SUCCESS' },
      { id: 'e2', sourceId: 'n2', targetId: 'n3', transformationType: 'SCORING', dataVolume: 885900, status: 'SUCCESS' },
      { id: 'e3', sourceId: 'n3', targetId: 'n4', transformationType: 'OUTPUT', dataVolume: 885900, status: 'SUCCESS' },
    ],
  },
  {
    runId: 'RUN-20260329-009',
    pipelineName: 'Delivery — Entrega Score PJ Banco Parceiro',
    layer: 'ANALYTICS',
    startTime: '2026-03-29T09:00:00Z',
    endTime: '2026-03-29T09:18:00Z',
    status: 'SUCCESS',
    stepsTotal: 3,
    stepsCompleted: 3,
    stepsFailled: 0,
    nodes: [
      { id: 'n1', name: 'Score Output PJ', type: 'SOURCE', layer: 'ANALYTICS', status: 'SUCCESS', lastUpdated: '2026-03-29T09:02:00Z', recordCount: 340000 },
      { id: 'n2', name: 'Format & Encrypt', type: 'PROCESS', layer: 'ANALYTICS', status: 'SUCCESS', lastUpdated: '2026-03-29T09:10:00Z', recordCount: 340000 },
      { id: 'n3', name: 'SFTP Delivery Parceiro X', type: 'OUTPUT', layer: 'ANALYTICS', status: 'SUCCESS', lastUpdated: '2026-03-29T09:18:00Z', recordCount: 340000 },
    ],
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2', transformationType: 'ETL', dataVolume: 340000, status: 'SUCCESS' },
      { id: 'e2', sourceId: 'n2', targetId: 'n3', transformationType: 'OUTPUT', dataVolume: 340000, status: 'SUCCESS' },
    ],
  },
  {
    runId: 'RUN-20260329-010',
    pipelineName: 'Ingestão Kafka — Eventos Transacionais',
    layer: 'INGESTION',
    startTime: '2026-03-29T04:00:00Z',
    endTime: '2026-03-29T04:35:00Z',
    status: 'SUCCESS',
    stepsTotal: 3,
    stepsCompleted: 3,
    stepsFailled: 0,
    nodes: [
      { id: 'n1', name: 'Kafka Topic transacoes', type: 'SOURCE', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T04:05:00Z', recordCount: 3500000 },
      { id: 'n2', name: 'Stream Processing', type: 'PROCESS', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T04:25:00Z', recordCount: 3498200 },
      { id: 'n3', name: 'Raw — Transações Landing', type: 'TABLE', layer: 'INGESTION', status: 'SUCCESS', lastUpdated: '2026-03-29T04:35:00Z', recordCount: 3498200 },
    ],
    edges: [
      { id: 'e1', sourceId: 'n1', targetId: 'n2', transformationType: 'ETL', dataVolume: 3500000, status: 'SUCCESS' },
      { id: 'e2', sourceId: 'n2', targetId: 'n3', transformationType: 'LOAD', dataVolume: 3498200, status: 'SUCCESS' },
    ],
  },
];
