import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { QualityTest, QualityIndicator, TestResult } from "../../domain/entities";

interface DataQualityState {
  tests: QualityTest[];
  indicators: QualityIndicator[];
  loading: boolean;
  error: string | null;
}

const mockTests: QualityTest[] = [
  { id:"qt-01", name:"Validar CPF não nulo", sourceId:"ds-01", sourceName:"EBV Core Database", query:"SELECT COUNT(*) FROM clientes WHERE cpf IS NULL", expectedResult:"0", lastResult:"PASS", lastRunAt:"2026-03-29T08:00:00Z", schedule:"*/30 * * * *", createdBy:"Ana Silva", severity:"CRITICAL", description:"Garante que nenhum registro de cliente tenha CPF nulo" },
  { id:"qt-02", name:"Score dentro do range 0-1000", sourceId:"ds-02", sourceName:"BigQuery Analytics", query:"SELECT COUNT(*) FROM score_credito_pf WHERE score < 0 OR score > 1000", expectedResult:"0", lastResult:"PASS", lastRunAt:"2026-03-29T07:45:00Z", schedule:"0 * * * *", createdBy:"Carlos Mendes", severity:"HIGH", description:"Valida que scores estão dentro do range esperado" },
  { id:"qt-03", name:"Freshness tabela transações", sourceId:"ds-01", sourceName:"EBV Core Database", query:"SELECT CASE WHEN MAX(created_at) > NOW() - INTERVAL '2 hours' THEN 'OK' ELSE 'STALE' END FROM transacoes", expectedResult:"OK", lastResult:"PASS", lastRunAt:"2026-03-29T09:00:00Z", schedule:"0 */2 * * *", createdBy:"Ana Silva", severity:"HIGH", description:"Verifica se a tabela de transações foi atualizada nas últimas 2h" },
  { id:"qt-04", name:"Duplicatas score_fraude", sourceId:"ds-02", sourceName:"BigQuery Analytics", query:"SELECT COUNT(*) FROM (SELECT cpf, data_ref, COUNT(*) c FROM score_fraude GROUP BY cpf, data_ref HAVING c > 1)", expectedResult:"0", lastResult:"FAIL", lastRunAt:"2026-03-29T07:30:00Z", schedule:"0 8 * * *", createdBy:"Carlos Mendes", severity:"CRITICAL", description:"Detecta registros duplicados na tabela de score de fraude" },
  { id:"qt-05", name:"Integridade FK contratos", sourceId:"ds-01", sourceName:"EBV Core Database", query:"SELECT COUNT(*) FROM contratos c LEFT JOIN clientes cl ON c.cpf = cl.cpf WHERE cl.cpf IS NULL", expectedResult:"0", lastResult:"PASS", lastRunAt:"2026-03-29T06:00:00Z", schedule:"0 6 * * *", createdBy:"Rafael Costa", severity:"MEDIUM", description:"Verifica integridade referencial entre contratos e clientes" },
  { id:"qt-06", name:"Volume mínimo ingestão diária", sourceId:"ds-05", sourceName:"Kafka Events Stream", query:"SELECT CASE WHEN COUNT(*) > 1000 THEN 'OK' ELSE 'LOW' END FROM events WHERE date = CURRENT_DATE", expectedResult:"OK", lastResult:"PASS", lastRunAt:"2026-03-29T09:15:00Z", schedule:"0 */4 * * *", createdBy:"Lucia Ferreira", severity:"MEDIUM", description:"Garante volume mínimo de eventos ingeridos por dia" },
  { id:"qt-07", name:"Dados legado encoding", sourceId:"ds-04", sourceName:"Oracle Legado", query:"SELECT COUNT(*) FROM TB_CLIENTE_HIST WHERE NM_CLIENTE LIKE '%\\?%'", expectedResult:"0", lastResult:"ERROR", lastRunAt:"2026-03-29T00:30:00Z", schedule:"0 1 * * *", createdBy:"Rafael Costa", severity:"LOW", description:"Verifica problemas de encoding nos dados migrados do legado" },
];

const mockIndicators: QualityIndicator[] = [
  { pipeline:"Pipeline Ingestão Core", layer:"INGESTION", completeness:97.2, accuracy:95.8, freshness:99.1, consistency:93.5, overallScore:96.4, testsTotal:12, testsPassing:11, lastChecked:"2026-03-29T09:00:00Z" },
  { pipeline:"Pipeline Trusted Sync", layer:"TRUSTED", completeness:94.5, accuracy:98.2, freshness:92.0, consistency:96.8, overallScore:95.4, testsTotal:8, testsPassing:7, lastChecked:"2026-03-29T08:30:00Z" },
  { pipeline:"Pipeline Analytics Score", layer:"ANALYTICS", completeness:99.0, accuracy:91.5, freshness:88.3, consistency:94.2, overallScore:93.3, testsTotal:15, testsPassing:13, lastChecked:"2026-03-29T07:45:00Z" },
  { pipeline:"Pipeline Legado Migration", layer:"INGESTION", completeness:82.1, accuracy:78.5, freshness:65.0, consistency:70.3, overallScore:73.9, testsTotal:6, testsPassing:3, lastChecked:"2026-03-29T01:00:00Z" },
];

export const fetchTests = createAsyncThunk("dataQuality/fetchTests", async () => {
  await new Promise((r) => setTimeout(r, 500));
  return mockTests;
});

export const fetchIndicators = createAsyncThunk("dataQuality/fetchIndicators", async () => {
  await new Promise((r) => setTimeout(r, 400));
  return mockIndicators;
});

export const runTest = createAsyncThunk("dataQuality/runTest", async (testId: string) => {
  await new Promise((r) => setTimeout(r, 1500));
  const results: TestResult[] = ["PASS", "PASS", "PASS", "FAIL"];
  return { testId, result: results[Math.floor(Math.random() * results.length)] as TestResult };
});

let testCounter = 10;

const dataQualitySlice = createSlice({
  name: "dataQuality",
  initialState: { tests: [], indicators: [], loading: false, error: null } as DataQualityState,
  reducers: {
    createTest(state, { payload }: PayloadAction<Omit<QualityTest, "id" | "lastResult" | "lastRunAt">>) {
      testCounter++;
      state.tests.push({ ...payload, id: `qt-${testCounter}`, lastResult: "PENDING", lastRunAt: "" });
    },
    updateTest(state, { payload }: PayloadAction<QualityTest>) {
      const idx = state.tests.findIndex((t) => t.id === payload.id);
      if (idx >= 0) state.tests[idx] = payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchTests.pending, (s) => { s.loading = true; })
     .addCase(fetchTests.fulfilled, (s, { payload }) => { s.loading = false; s.tests = payload; })
     .addCase(fetchTests.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? "Erro"; })
     .addCase(fetchIndicators.fulfilled, (s, { payload }) => { s.indicators = payload; })
     .addCase(runTest.fulfilled, (s, { payload }) => {
       const t = s.tests.find((t) => t.id === payload.testId);
       if (t) { t.lastResult = payload.result; t.lastRunAt = new Date().toISOString(); }
     });
  },
});

export const { createTest, updateTest } = dataQualitySlice.actions;
export default dataQualitySlice.reducer;
