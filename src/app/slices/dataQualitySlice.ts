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
}

const mockTests: QualityTest[] = [
  {
    id: "qt-01", name: "check_name_not_null", sourceId: "ds-01", sourceName: "EBV Core Database",
    query: "SELECT COUNT(*) FROM clientes WHERE name IS NULL", expectedResult: "0",
    lastResult: "FAIL", lastRunAt: "2025-12-23T13:15:00Z", schedule: "*/30 * * * *",
    createdBy: "Ana Silva", severity: "CRITICAL",
    description: "Garante que nenhum registro de cliente tenha nome nulo",
    tableName: "sample_snowflake.ANALYTICS_DB.prod.customer_360",
    columnName: "name", failureReason: "Found 17 failed rows (1.79%)",
    incidentStatus: "RESOLVED",
  },
  {
    id: "qt-02", name: "check_total_orders_range", sourceId: "ds-02", sourceName: "BigQuery Analytics",
    query: "SELECT COUNT(*) FROM orders WHERE total_orders < 0 OR total_orders > 100000", expectedResult: "0",
    lastResult: "FAIL", lastRunAt: "2025-12-23T13:15:00Z", schedule: "0 * * * *",
    createdBy: "Carlos Mendes", severity: "HIGH",
    description: "Valida que total de pedidos está dentro do range esperado",
    tableName: "sample_snowflake.ANALYTICS_DB.prod.customer_360",
    columnName: "total_orders", failureReason: "Found 5 failed rows (0.52%)",
    incidentStatus: "RESOLVED",
  },
  {
    id: "qt-03", name: "Customer Key Uniqueness", sourceId: "ds-01", sourceName: "EBV Core Database",
    query: "SELECT customer_key, COUNT(*) c FROM dim_customers GROUP BY customer_key HAVING c > 1", expectedResult: "0",
    lastResult: "ERROR", lastRunAt: "2026-03-28T21:01:00Z", schedule: "0 */2 * * *",
    createdBy: "Ana Silva", severity: "HIGH",
    description: "Verifica unicidade da chave de cliente na dimensão",
    tableName: "acme_nexus_analytics.ANALYTICS_MART5.dim_customers",
    columnName: "customer_key",
    failureReason: "Error executing columnValuesToBeUnique → (snowflake.connection.errors.ProgrammingError) 251008...",
    incidentStatus: "NONE",
  },
  {
    id: "qt-04", name: "check_customer_id_unique", sourceId: "ds-02", sourceName: "BigQuery Analytics",
    query: "SELECT customer_id, COUNT(*) c FROM customer_360 GROUP BY customer_id HAVING c > 1", expectedResult: "0",
    lastResult: "PASS", lastRunAt: "2025-12-23T13:21:00Z", schedule: "0 8 * * *",
    createdBy: "Carlos Mendes", severity: "CRITICAL",
    description: "Detecta registros duplicados por customer_id",
    tableName: "sample_snowflake.ANALYTICS_DB.prod.customer_360",
    columnName: "customer_id", failureReason: "--",
    incidentStatus: "NONE",
  },
  {
    id: "qt-05", name: "check_null_customer_id", sourceId: "ds-01", sourceName: "EBV Core Database",
    query: "SELECT COUNT(*) FROM customer_360 WHERE customer_id IS NULL", expectedResult: "0",
    lastResult: "PASS", lastRunAt: "2025-12-23T13:11:00Z", schedule: "0 6 * * *",
    createdBy: "Rafael Costa", severity: "MEDIUM",
    description: "Verifica que customer_id nunca é nulo",
    tableName: "sample_snowflake.ANALYTICS_DB.prod.customer_360",
    columnName: "customer_id", failureReason: "--",
    incidentStatus: "NONE",
  },
  {
    id: "qt-06", name: "check_table_row_count", sourceId: "ds-05", sourceName: "Kafka Events Stream",
    query: "SELECT CASE WHEN COUNT(*) > 1000 THEN 'OK' ELSE 'LOW' END FROM customer_360", expectedResult: "OK",
    lastResult: "PASS", lastRunAt: "2025-12-23T13:31:00Z", schedule: "0 */4 * * *",
    createdBy: "Lucia Ferreira", severity: "MEDIUM",
    description: "Garante volume mínimo de registros na tabela",
    tableName: "sample_snowflake.ANALYTICS_DB.prod.customer_360",
    columnName: "--", failureReason: "--",
    incidentStatus: "NONE",
  },
  {
    id: "qt-07", name: "Customer ID Uniqueness", sourceId: "ds-04", sourceName: "Oracle Legado",
    query: "SELECT customer_id, COUNT(*) c FROM raw_crm_customers GROUP BY customer_id HAVING c > 1", expectedResult: "0",
    lastResult: "PENDING", lastRunAt: "", schedule: "0 1 * * *",
    createdBy: "Rafael Costa", severity: "LOW",
    description: "Verifica unicidade de customer_id em dados raw CRM",
    tableName: "acme_nexus_raw_data.acme_raw_crm.customers",
    columnName: "customer_id", failureReason: "--",
    incidentStatus: "NONE",
  },
  {
    id: "qt-08", name: "Email Not Null", sourceId: "ds-04", sourceName: "Oracle Legado",
    query: "SELECT COUNT(*) FROM raw_crm_customers WHERE email IS NULL", expectedResult: "0",
    lastResult: "PENDING", lastRunAt: "", schedule: "0 2 * * *",
    createdBy: "Lucia Ferreira", severity: "MEDIUM",
    description: "Garante que email nunca é nulo em dados CRM",
    tableName: "acme_nexus_raw_data.acme_raw_crm.customers",
    columnName: "email", failureReason: "--",
    incidentStatus: "NONE",
  },
  {
    id: "qt-09", name: "Revenue Must Be Positive", sourceId: "ds-02", sourceName: "BigQuery Analytics",
    query: "SELECT COUNT(*) FROM fact_orders WHERE revenue < 0", expectedResult: "0",
    lastResult: "PENDING", lastRunAt: "", schedule: "0 3 * * *",
    createdBy: "Carlos Mendes", severity: "HIGH",
    description: "Garante que receita é sempre positiva",
    tableName: "acme_nexus_analytics.ANALYTICS_MART5.fact_orders",
    columnName: "revenue", failureReason: "--",
    incidentStatus: "NONE",
  },
];

const mockIndicators: QualityIndicator[] = [
  { pipeline: "Pipeline Ingestão Core", layer: "INGESTION", completeness: 97.2, accuracy: 95.8, freshness: 99.1, consistency: 93.5, overallScore: 96.4, testsTotal: 12, testsPassing: 11, lastChecked: "2026-03-29T09:00:00Z" },
  { pipeline: "Pipeline Trusted Sync", layer: "TRUSTED", completeness: 94.5, accuracy: 98.2, freshness: 92.0, consistency: 96.8, overallScore: 95.4, testsTotal: 8, testsPassing: 7, lastChecked: "2026-03-29T08:30:00Z" },
  { pipeline: "Pipeline Analytics Score", layer: "ANALYTICS", completeness: 99.0, accuracy: 91.5, freshness: 88.3, consistency: 94.2, overallScore: 93.3, testsTotal: 15, testsPassing: 13, lastChecked: "2026-03-29T07:45:00Z" },
  { pipeline: "Pipeline Legado Migration", layer: "INGESTION", completeness: 82.1, accuracy: 78.5, freshness: 65.0, consistency: 70.3, overallScore: 73.9, testsTotal: 6, testsPassing: 3, lastChecked: "2026-03-29T01:00:00Z" },
];

const mockTestSuites: TestSuite[] = [
  { id: "ts-01", name: "Customer 360 Quality", description: "Testes de qualidade para a tabela customer_360", tests: ["qt-01", "qt-02", "qt-04", "qt-05", "qt-06"], owner: "Ana Silva", lastRun: "2025-12-23T13:31:00Z", passRate: 60, totalTests: 5, passingTests: 3 },
  { id: "ts-02", name: "CRM Raw Data Validation", description: "Validação de dados brutos do CRM", tests: ["qt-07", "qt-08"], owner: "Rafael Costa", lastRun: "2026-03-28T21:01:00Z", passRate: 0, totalTests: 2, passingTests: 0 },
  { id: "ts-03", name: "Analytics Mart Integrity", description: "Integridade dos dados no mart analítico", tests: ["qt-03", "qt-09"], owner: "Carlos Mendes", lastRun: "2026-03-28T21:01:00Z", passRate: 0, totalTests: 2, passingTests: 0 },
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

export const { createTest, updateTest, setSearchTerm, setFilter, clearFilters } = dataQualitySlice.actions;
export default dataQualitySlice.reducer;
