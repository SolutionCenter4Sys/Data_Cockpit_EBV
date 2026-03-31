import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { QualityTest, QualityIndicator, TestResult, TestSuite } from "../../domain/entities";

interface DataQualityFilters {
  table: string;
  type: string;
  status: string;
  tags: string;
}

interface DataQualityState {
  tests: QualityTest[];
  indicators: QualityIndicator[];
  testSuites: TestSuite[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filters: DataQualityFilters;
  suiteSearchTerm: string;
  suiteOwnerFilter: string;
}

const mockTests: QualityTest[] = [
  {
    id: "qt-01", name: "check_name_not_null", sourceId: "ds-01", sourceName: "EBV Core Database",
    query: "SELECT COUNT(*) FROM clientes WHERE name IS NULL", expectedResult: "0",
    lastResult: "FAIL", lastRunAt: "2026-03-29T10:15:00Z", schedule: "*/30 * * * *",
    createdBy: "Ana Silva", severity: "CRITICAL",
    description: "Garante que nenhum registro de cliente tenha nome nulo",
    tableName: "sample_snowflake.ANALYTICS_DB.prod.customer_360",
    columnName: "name", failureReason: "Found 17 failed rows (1.79%)",
    incidentStatus: "RESOLVED",
  },
  {
    id: "qt-02", name: "check_total_orders_range", sourceId: "ds-02", sourceName: "BigQuery Analytics",
    query: "SELECT COUNT(*) FROM orders WHERE total_orders < 0 OR total_orders > 100000", expectedResult: "0",
    lastResult: "FAIL", lastRunAt: "2026-03-29T10:15:00Z", schedule: "0 * * * *",
    createdBy: "Carlos Mendes", severity: "HIGH",
    description: "Valida que total de pedidos está dentro do range esperado",
    tableName: "sample_snowflake.ANALYTICS_DB.prod.customer_360",
    columnName: "total_orders", failureReason: "Found 5 failed rows (0.52%)",
    incidentStatus: "RESOLVED",
  },
  {
    id: "qt-03", name: "Customer Key Uniqueness", sourceId: "ds-01", sourceName: "EBV Core Database",
    query: "SELECT customer_key, COUNT(*) c FROM dim_customers GROUP BY customer_key HAVING c > 1", expectedResult: "0",
    lastResult: "FAIL", lastRunAt: "2026-03-29T10:10:00Z", schedule: "0 */2 * * *",
    createdBy: "Ana Silva", severity: "HIGH",
    description: "Verifica unicidade da chave de cliente na dimensão",
    tableName: "acme_nexus_analytics.ANALYTICS_MART5.dim_customers",
    columnName: "customer_key",
    failureReason: "Found 1247 duplicated keys in dim_customers",
    incidentStatus: "NONE",
  },
  {
    id: "qt-04", name: "check_customer_id_unique", sourceId: "ds-02", sourceName: "BigQuery Analytics",
    query: "SELECT customer_id, COUNT(*) c FROM customer_360 GROUP BY customer_id HAVING c > 1", expectedResult: "0",
    lastResult: "PASS", lastRunAt: "2026-03-29T10:12:00Z", schedule: "0 8 * * *",
    createdBy: "Carlos Mendes", severity: "CRITICAL",
    description: "Detecta registros duplicados por customer_id",
    tableName: "sample_snowflake.ANALYTICS_DB.prod.customer_360",
    columnName: "customer_id", failureReason: "--",
    incidentStatus: "NONE",
  },
  {
    id: "qt-05", name: "check_null_customer_id", sourceId: "ds-01", sourceName: "EBV Core Database",
    query: "SELECT COUNT(*) FROM customer_360 WHERE customer_id IS NULL", expectedResult: "0",
    lastResult: "PASS", lastRunAt: "2026-03-29T10:12:00Z", schedule: "0 6 * * *",
    createdBy: "Rafael Costa", severity: "MEDIUM",
    description: "Verifica que customer_id nunca é nulo",
    tableName: "sample_snowflake.ANALYTICS_DB.prod.customer_360",
    columnName: "customer_id", failureReason: "--",
    incidentStatus: "NONE",
  },
  {
    id: "qt-06", name: "check_table_row_count", sourceId: "ds-05", sourceName: "Kafka Events Stream",
    query: "SELECT CASE WHEN COUNT(*) > 1000 THEN 'OK' ELSE 'LOW' END FROM customer_360", expectedResult: "OK",
    lastResult: "PASS", lastRunAt: "2026-03-29T10:14:00Z", schedule: "0 */4 * * *",
    createdBy: "Lucia Ferreira", severity: "MEDIUM",
    description: "Garante volume mínimo de registros na tabela",
    tableName: "sample_snowflake.ANALYTICS_DB.prod.customer_360",
    columnName: "--", failureReason: "--",
    incidentStatus: "NONE",
  },
  {
    id: "qt-07", name: "Customer ID Uniqueness Raw", sourceId: "ds-04", sourceName: "Oracle Legado",
    query: "SELECT customer_id, COUNT(*) c FROM raw_crm_customers GROUP BY customer_id HAVING c > 1", expectedResult: "0",
    lastResult: "PASS", lastRunAt: "2026-03-29T10:08:00Z", schedule: "0 1 * * *",
    createdBy: "Rafael Costa", severity: "LOW",
    description: "Verifica unicidade de customer_id em dados raw CRM",
    tableName: "acme_nexus_raw_data.acme_raw_crm.customers",
    columnName: "customer_id", failureReason: "--",
    incidentStatus: "NONE",
  },
  {
    id: "qt-08", name: "Email Not Null", sourceId: "ds-04", sourceName: "Oracle Legado",
    query: "SELECT COUNT(*) FROM raw_crm_customers WHERE email IS NULL", expectedResult: "0",
    lastResult: "PASS", lastRunAt: "2026-03-29T10:08:00Z", schedule: "0 2 * * *",
    createdBy: "Lucia Ferreira", severity: "MEDIUM",
    description: "Garante que email nunca é nulo em dados CRM",
    tableName: "acme_nexus_raw_data.acme_raw_crm.customers",
    columnName: "email", failureReason: "--",
    incidentStatus: "NONE",
  },
  {
    id: "qt-09", name: "Revenue Must Be Positive", sourceId: "ds-02", sourceName: "BigQuery Analytics",
    query: "SELECT COUNT(*) FROM fact_orders WHERE revenue < 0", expectedResult: "0",
    lastResult: "PASS", lastRunAt: "2026-03-29T10:10:00Z", schedule: "0 3 * * *",
    createdBy: "Carlos Mendes", severity: "HIGH",
    description: "Garante que receita é sempre positiva",
    tableName: "acme_nexus_analytics.ANALYTICS_MART5.fact_orders",
    columnName: "revenue", failureReason: "--",
    incidentStatus: "NONE",
  },
  {
    id: "qt-10", name: "Completeness fact_financeiro", sourceId: "ds-01", sourceName: "EBV Core Database",
    query: "SELECT ROUND(100.0 * COUNT(valor) / COUNT(*), 1) FROM fact_financeiro", expectedResult: ">95",
    lastResult: "FAIL", lastRunAt: "2026-03-29T10:10:00Z", schedule: "0 */2 * * *",
    createdBy: "Ana Silva", severity: "CRITICAL",
    description: "Verifica completude da coluna valor em fact_financeiro (DW)",
    tableName: "dw.public.fact_financeiro",
    columnName: "valor", failureReason: "Completeness at 72% — below 95% threshold",
    incidentStatus: "NONE",
  },
  {
    id: "qt-11", name: "CPF Not Null dim_cliente", sourceId: "ds-01", sourceName: "EBV Core Database",
    query: "SELECT COUNT(*) FROM dim_cliente WHERE cpf IS NULL", expectedResult: "0",
    lastResult: "FAIL", lastRunAt: "2026-03-29T10:10:00Z", schedule: "0 */4 * * *",
    createdBy: "Rafael Costa", severity: "HIGH",
    description: "Garante que CPF nunca é nulo na dimensão cliente do DW",
    tableName: "dw.public.dim_cliente",
    columnName: "cpf", failureReason: "Found 12% null CPFs (106,308 rows)",
    incidentStatus: "NONE",
  },
  {
    id: "qt-12", name: "Freshness dim_produto", sourceId: "ds-01", sourceName: "EBV Core Database",
    query: "SELECT EXTRACT(EPOCH FROM NOW() - MAX(updated_at))/3600 FROM dim_produto", expectedResult: "<1",
    lastResult: "FAIL", lastRunAt: "2026-03-29T10:10:00Z", schedule: "0 * * * *",
    createdBy: "Lucia Ferreira", severity: "HIGH",
    description: "Verifica que dim_produto foi atualizada na última hora",
    tableName: "dw.public.dim_produto",
    columnName: "updated_at", failureReason: "Last update was 4.2 hours ago — SLA is 1h",
    incidentStatus: "NONE",
  },
  {
    id: "qt-13", name: "Schema check stg_vendas", sourceId: "ds-01", sourceName: "EBV Core Database",
    query: "SELECT data_type FROM information_schema.columns WHERE table_name='stg_vendas' AND column_name='valor_bruto'", expectedResult: "numeric",
    lastResult: "FAIL", lastRunAt: "2026-03-29T10:10:00Z", schedule: "0 6 * * *",
    createdBy: "Ana Silva", severity: "HIGH",
    description: "Verifica que tipo da coluna valor_bruto continua DECIMAL",
    tableName: "dw.staging.stg_vendas",
    columnName: "valor_bruto", failureReason: "Expected numeric, got character varying — schema drift detected",
    incidentStatus: "NONE",
  },
  {
    id: "qt-14", name: "Accuracy checksum fact_transacoes", sourceId: "ds-01", sourceName: "EBV Core Database",
    query: "SELECT ABS(1.0 - (SUM(valor_dw) / NULLIF(SUM(valor_origem), 0))) * 100 FROM v_accuracy_transacoes", expectedResult: "<0.5",
    lastResult: "FAIL", lastRunAt: "2026-03-29T10:10:00Z", schedule: "0 8 * * *",
    createdBy: "Carlos Mendes", severity: "HIGH",
    description: "Verifica acurácia via checksum entre DW e origem",
    tableName: "dw.public.fact_transacoes",
    columnName: "valor", failureReason: "Divergence of 3.2% — threshold is 0.5%",
    incidentStatus: "NONE",
  },
  {
    id: "qt-15", name: "Volume anomaly fact_vendas", sourceId: "ds-01", sourceName: "EBV Core Database",
    query: "SELECT CASE WHEN ABS(1.0 - cnt_today::float/cnt_yesterday) > 0.3 THEN 'ANOMALY' ELSE 'OK' END FROM v_volume_vendas", expectedResult: "OK",
    lastResult: "FAIL", lastRunAt: "2026-03-29T10:10:00Z", schedule: "0 9 * * *",
    createdBy: "Lucia Ferreira", severity: "MEDIUM",
    description: "Detecta anomalia de volume (±30%) vs dia anterior",
    tableName: "dw.public.fact_vendas",
    columnName: "--", failureReason: "Volume 40% lower than D-1",
    incidentStatus: "NONE",
  },
  {
    id: "qt-16", name: "FK integrity fact_pedidos → dim_cliente", sourceId: "ds-01", sourceName: "EBV Core Database",
    query: "SELECT COUNT(*) FROM fact_pedidos p LEFT JOIN dim_cliente c ON p.cliente_id=c.id WHERE c.id IS NULL", expectedResult: "0",
    lastResult: "FAIL", lastRunAt: "2026-03-29T10:10:00Z", schedule: "0 */4 * * *",
    createdBy: "Rafael Costa", severity: "MEDIUM",
    description: "Verifica integridade referencial entre pedidos e clientes",
    tableName: "dw.public.fact_pedidos",
    columnName: "cliente_id", failureReason: "Found 89 orphan rows — no matching dim_cliente",
    incidentStatus: "NONE",
  },
  {
    id: "qt-17", name: "Dedup fact_pagamentos", sourceId: "ds-01", sourceName: "EBV Core Database",
    query: "SELECT COUNT(*) FROM (SELECT id, COUNT(*) c FROM fact_pagamentos GROUP BY id HAVING c > 1) sub", expectedResult: "0",
    lastResult: "FAIL", lastRunAt: "2026-03-29T10:10:00Z", schedule: "0 7 * * *",
    createdBy: "Carlos Mendes", severity: "MEDIUM",
    description: "Detecta duplicatas em fact_pagamentos",
    tableName: "dw.public.fact_pagamentos",
    columnName: "id", failureReason: "Found 1,247 duplicated rows",
    incidentStatus: "NONE",
  },
  {
    id: "qt-18", name: "Feature drift renda_mensal", sourceId: "ds-02", sourceName: "BigQuery Analytics",
    query: "SELECT CASE WHEN ABS(avg_current - avg_baseline)/stddev_baseline > 1.5 THEN 'DRIFT' ELSE 'OK' END FROM v_feature_stats WHERE feature='renda_mensal'", expectedResult: "OK",
    lastResult: "FAIL", lastRunAt: "2026-03-29T10:08:00Z", schedule: "0 */6 * * *",
    createdBy: "Ana Silva", severity: "HIGH",
    description: "Detecta drift na feature renda_mensal para modelos Analytics",
    tableName: "analytics.features.renda_mensal",
    columnName: "renda_mensal", failureReason: "Drift detected: 1.8 sigma shift from baseline",
    incidentStatus: "NONE",
  },
  {
    id: "qt-19", name: "Score output freshness PJ", sourceId: "ds-02", sourceName: "BigQuery Analytics",
    query: "SELECT EXTRACT(EPOCH FROM NOW() - MAX(generated_at))/3600 FROM score_output_pj", expectedResult: "<2",
    lastResult: "PASS", lastRunAt: "2026-03-29T10:14:00Z", schedule: "0 */2 * * *",
    createdBy: "Lucia Ferreira", severity: "MEDIUM",
    description: "Verifica freshness do output Score PJ (Delivery)",
    tableName: "delivery.public.score_output_pj",
    columnName: "generated_at", failureReason: "--",
    incidentStatus: "NONE",
  },
  {
    id: "qt-20", name: "Produto Score PF completeness", sourceId: "ds-02", sourceName: "BigQuery Analytics",
    query: "SELECT ROUND(100.0 * COUNT(score) / COUNT(*), 1) FROM produto_score_pf", expectedResult: ">98",
    lastResult: "PASS", lastRunAt: "2026-03-29T10:13:00Z", schedule: "0 */4 * * *",
    createdBy: "Carlos Mendes", severity: "MEDIUM",
    description: "Verifica completude do produto Score PF",
    tableName: "produtos.public.produto_score_pf",
    columnName: "score", failureReason: "--",
    incidentStatus: "NONE",
  },
];

const mockIndicators: QualityIndicator[] = [
  { pipeline: "Pipeline Ingestão Core", layer: "INGESTION", completeness: 97.2, accuracy: 95.8, freshness: 99.1, consistency: 93.5, overallScore: 94.2, testsTotal: 18, testsPassing: 16, lastChecked: "2026-03-29T10:15:00Z" },
  { pipeline: "Pipeline Governança", layer: "TRUSTED", completeness: 98.5, accuracy: 98.2, freshness: 97.0, consistency: 97.5, overallScore: 97.8, testsTotal: 24, testsPassing: 23, lastChecked: "2026-03-29T10:12:00Z" },
  { pipeline: "Pipeline DW Sync", layer: "TRUSTED", completeness: 72.0, accuracy: 65.5, freshness: 58.0, consistency: 54.5, overallScore: 91.5, testsTotal: 32, testsPassing: 16, lastChecked: "2026-03-29T10:10:00Z" },
  { pipeline: "Pipeline Analytics Score", layer: "ANALYTICS", completeness: 92.0, accuracy: 88.5, freshness: 85.3, consistency: 89.2, overallScore: 88.3, testsTotal: 15, testsPassing: 12, lastChecked: "2026-03-29T10:08:00Z" },
  { pipeline: "Pipeline Delivery", layer: "ANALYTICS", completeness: 99.8, accuracy: 99.5, freshness: 99.9, consistency: 99.2, overallScore: 99.1, testsTotal: 8, testsPassing: 8, lastChecked: "2026-03-29T10:14:00Z" },
  { pipeline: "Pipeline Produtos", layer: "ANALYTICS", completeness: 97.0, accuracy: 96.5, freshness: 95.8, consistency: 96.7, overallScore: 96.5, testsTotal: 12, testsPassing: 11, lastChecked: "2026-03-29T10:13:00Z" },
];

const mockTestSuites: TestSuite[] = [
  { id: "ts-01", name: "dim_customers", description: "Testes de qualidade para a dimensão de clientes", tests: ["qt-01", "qt-04", "qt-05"], owner: "Ana Silva", ownerAvatarColor: "#AD1457", lastRun: "2025-12-23T13:31:00Z", passRate: 0, totalTests: 1, passingTests: 0, fullPath: "acme_nexus_analytics.ANALYTICS.MARTS.dim_customers", suiteType: "table" },
  { id: "ts-02", name: "fact_orders", description: "Integridade de pedidos no mart analítico", tests: ["qt-09"], owner: "Carlos Mendes", ownerAvatarColor: "#1565C0", lastRun: "2026-03-28T21:01:00Z", passRate: 0, totalTests: 0, passingTests: 0, fullPath: "acme_nexus_analytics.ANALYTICS.MARTS.fact_orders", suiteType: "table" },
  { id: "ts-03", name: "stg_customers", description: "Validação de staging de clientes", tests: [], owner: "test", ownerAvatarColor: "#00695C", lastRun: "", passRate: 0, totalTests: 0, passingTests: 0, fullPath: "acme_nexus_analytics.ANALYTICS.STAGING.stg_customers", suiteType: "table" },
  { id: "ts-04", name: "customers", description: "Dados CRM raw de clientes", tests: ["qt-07", "qt-08"], owner: "Rafael Costa", ownerAvatarColor: "#E65100", lastRun: "2026-03-28T21:01:00Z", passRate: 0, totalTests: 0, passingTests: 0, fullPath: "acme_nexus_raw_data.acme_raw.crm.customers", suiteType: "table" },
  { id: "ts-05", name: "raw_sales_orders", description: "Pedidos de venda brutos", tests: [], owner: "Carlos Mendes", ownerAvatarColor: "#1565C0", lastRun: "", passRate: 0, totalTests: 0, passingTests: 0, fullPath: "acme_nexus_raw_data.acme_raw.sales.orders", suiteType: "table" },
  { id: "ts-06", name: "customer_360", description: "Visão 360 consolidada do cliente", tests: ["qt-01", "qt-02", "qt-04", "qt-05", "qt-06"], owner: "Ana Silva", ownerAvatarColor: "#AD1457", lastRun: "2025-12-23T13:31:00Z", passRate: 0, totalTests: 0, passingTests: 0, fullPath: "db_mind_treo.6a2663ad.database_well_successfu...96bc6110.schema_yeah_plck_d4Cce301.tato_e_behind_increase_506571cd", suiteType: "table" },
  { id: "ts-07", name: "anything_table", description: "Tabela genérica de testes diversos", tests: [], owner: "Lucia Ferreira", ownerAvatarColor: "#7B1FA2", lastRun: "", passRate: 0, totalTests: 0, passingTests: 0, fullPath: "db_mind_treo.6a2663ad.database_well_successfu...96bc6110.schema_yeah_plck_d4Cce301.tato_e_bell_anything_e9b0971a", suiteType: "table" },
  { id: "ts-08", name: "pattern_null_check", description: "Padrão para verificar nulos em todas as colunas obrigatórias", tests: ["qt-01", "qt-05", "qt-08"], owner: "Ana Silva", ownerAvatarColor: "#AD1457", lastRun: "2026-03-29T10:00:00Z", passRate: 33, totalTests: 3, passingTests: 1, fullPath: "pattern://null_check_all_required_columns", suiteType: "pattern" },
  { id: "ts-09", name: "pattern_uniqueness", description: "Padrão para validar unicidade de chaves primárias", tests: ["qt-03", "qt-04", "qt-07"], owner: "Carlos Mendes", ownerAvatarColor: "#1565C0", lastRun: "2026-03-29T10:00:00Z", passRate: 33, totalTests: 3, passingTests: 1, fullPath: "pattern://uniqueness_primary_keys", suiteType: "pattern" },
];

export const fetchTests = createAsyncThunk("dataQuality/fetchTests", async () => {
  await new Promise((r) => setTimeout(r, 500));
  return mockTests;
});

export const fetchIndicators = createAsyncThunk("dataQuality/fetchIndicators", async () => {
  await new Promise((r) => setTimeout(r, 400));
  return mockIndicators;
});

export const fetchTestSuites = createAsyncThunk("dataQuality/fetchTestSuites", async () => {
  await new Promise((r) => setTimeout(r, 350));
  return mockTestSuites;
});

export const runTest = createAsyncThunk("dataQuality/runTest", async (testId: string) => {
  await new Promise((r) => setTimeout(r, 1500));
  const results: TestResult[] = ["PASS", "PASS", "PASS", "FAIL"];
  return { testId, result: results[Math.floor(Math.random() * results.length)] as TestResult };
});

let testCounter = 20;

const initialState: DataQualityState = {
  tests: [],
  indicators: [],
  testSuites: [],
  loading: false,
  error: null,
  searchTerm: "",
  filters: { table: "", type: "", status: "", tags: "" },
  suiteSearchTerm: "",
  suiteOwnerFilter: "",
};

const dataQualitySlice = createSlice({
  name: "dataQuality",
  initialState,
  reducers: {
    createTest(state, { payload }: PayloadAction<Omit<QualityTest, "id" | "lastResult" | "lastRunAt" | "incidentStatus">>) {
      testCounter++;
      state.tests.push({ ...payload, id: `qt-${testCounter}`, lastResult: "PENDING", lastRunAt: "", incidentStatus: "NONE" });
    },
    updateTest(state, { payload }: PayloadAction<QualityTest>) {
      const idx = state.tests.findIndex((t) => t.id === payload.id);
      if (idx >= 0) state.tests[idx] = payload;
    },
    setSearchTerm(state, { payload }: PayloadAction<string>) {
      state.searchTerm = payload;
    },
    setFilter(state, { payload }: PayloadAction<{ key: keyof DataQualityFilters; value: string }>) {
      state.filters[payload.key] = payload.value;
    },
    clearFilters(state) {
      state.searchTerm = "";
      state.filters = { table: "", type: "", status: "", tags: "" };
    },
    setSuiteSearchTerm(state, { payload }: PayloadAction<string>) {
      state.suiteSearchTerm = payload;
    },
    setSuiteOwnerFilter(state, { payload }: PayloadAction<string>) {
      state.suiteOwnerFilter = payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchTests.pending, (s) => { s.loading = true; })
     .addCase(fetchTests.fulfilled, (s, { payload }) => { s.loading = false; s.tests = payload; })
     .addCase(fetchTests.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? "Erro"; })
     .addCase(fetchIndicators.fulfilled, (s, { payload }) => { s.indicators = payload; })
     .addCase(fetchTestSuites.fulfilled, (s, { payload }) => { s.testSuites = payload; })
     .addCase(runTest.fulfilled, (s, { payload }) => {
       const t = s.tests.find((t) => t.id === payload.testId);
       if (t) {
         t.lastResult = payload.result;
         t.lastRunAt = new Date().toISOString();
         t.failureReason = payload.result === "FAIL" ? "Found validation errors" : "--";
       }
     });
  },
});

export const { createTest, updateTest, setSearchTerm, setFilter, clearFilters, setSuiteSearchTerm, setSuiteOwnerFilter } = dataQualitySlice.actions;
export default dataQualitySlice.reducer;
