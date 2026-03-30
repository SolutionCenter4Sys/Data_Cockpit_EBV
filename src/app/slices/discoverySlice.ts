import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DiscoveryResult } from "../../domain/entities";

interface DiscoveryState {
  results: DiscoveryResult[];
  loading: boolean;
  searchTerm: string;
  error: string | null;
}

const allArtifacts: DiscoveryResult[] = [
  { id: "d-01", type: "TABLE", name: "customer_360", description: "Tabela consolidada de clientes com 360 graus de visão", source: "Governança — Golden Record", relevance: 100, metadata: { layer: "Governança", owner: "Diego", columns: "customer_id, name, cpf, score, email" } },
  { id: "d-02", type: "TABLE", name: "score_credito_pf", description: "Score de crédito pessoa física — modelo preditivo", source: "Analytics — Shimada", relevance: 95, metadata: { layer: "Analytics", owner: "Shimada", columns: "cpf, score, data_ref, modelo_versao" } },
  { id: "d-03", type: "TABLE", name: "score_fraude", description: "Score de fraude por transação", source: "Analytics — Shimada", relevance: 90, metadata: { layer: "Analytics", owner: "Shimada", columns: "cpf, score, data_ref, risk_level" } },
  { id: "d-04", type: "COLUMN", name: "score", description: "Coluna score presente em múltiplas tabelas analíticas", source: "score_credito_pf, score_fraude, customer_360", relevance: 98, metadata: { tables: "3", type: "NUMERIC", pii: "false" } },
  { id: "d-05", type: "QUALITY_RULE", name: "check_name_not_null", description: "Valida que nome do cliente nunca é nulo na customer_360", source: "Qualidade de Dados", relevance: 85, metadata: { status: "FAIL", table: "customer_360", severity: "CRITICAL" } },
  { id: "d-06", type: "QUALITY_RULE", name: "Score dentro do range 0-1000", description: "Valida que scores estão dentro do range esperado", source: "Qualidade de Dados", relevance: 88, metadata: { status: "PASS", table: "score_credito_pf", severity: "HIGH" } },
  { id: "d-07", type: "ALERT", name: "Score Zerado", description: "Alerta quando score de modelo retorna zero — indica falha no pipeline", source: "Central de Alertas", relevance: 92, metadata: { severity: "CRITICAL", layer: "Analytics", triggers: "7" } },
  { id: "d-08", type: "ALERT", name: "Arquivo FFT Invalido", description: "Falha na validação de formato do arquivo de ingestão FFT", source: "Central de Alertas", relevance: 80, metadata: { severity: "CRITICAL", layer: "Ingestão", triggers: "2" } },
  { id: "d-09", type: "CONNECTOR", name: "EBV Core Database", description: "Conector principal PostgreSQL — base de governança", source: "Conectores", relevance: 75, metadata: { type: "POSTGRESQL", status: "CONNECTED", layer: "Governança" } },
  { id: "d-10", type: "CONNECTOR", name: "BigQuery Analytics", description: "Conector BigQuery para camada analítica", source: "Conectores", relevance: 70, metadata: { type: "BIGQUERY", status: "CONNECTED", layer: "Analytics" } },
  { id: "d-11", type: "PIPELINE", name: "Pipeline Ingestão Core", description: "Pipeline principal de ingestão de dados dos sistemas fonte", source: "Observabilidade", relevance: 78, metadata: { status: "SUCCESS", successRate: "96.4%", layer: "Ingestão" } },
  { id: "d-12", type: "PIPELINE", name: "Pipeline Trusted Sync", description: "Sincronização da camada trusted com golden record", source: "Observabilidade", relevance: 76, metadata: { status: "SUCCESS", successRate: "95.4%", layer: "Governança" } },
  { id: "d-13", type: "TABLE", name: "dim_customers", description: "Dimensão de clientes no DW — camada gold", source: "DW — Shimada", relevance: 82, metadata: { layer: "DW", owner: "Shimada", columns: "customer_key, name, segment, region" } },
  { id: "d-14", type: "TABLE", name: "fact_orders", description: "Fato de pedidos com receita e métricas de venda", source: "DW — Shimada", relevance: 80, metadata: { layer: "DW", owner: "Shimada", columns: "order_id, customer_key, revenue, date" } },
  { id: "d-15", type: "QUALITY_RULE", name: "Revenue Must Be Positive", description: "Garante que receita é sempre positiva em fact_orders", source: "Qualidade de Dados", relevance: 72, metadata: { status: "PENDING", table: "fact_orders", severity: "HIGH" } },
  { id: "d-16", type: "TABLE", name: "TB_CLIENTE_HIST", description: "Tabela histórica de clientes — legado Oracle", source: "Ingestão — Legado", relevance: 60, metadata: { layer: "Ingestão", owner: "Caio", columns: "NM_CLIENTE, CPF, DT_CADASTRO" } },
  { id: "d-17", type: "PIPELINE", name: "Pipeline Analytics Score", description: "Pipeline de cálculo de scores preditivos", source: "Analytics", relevance: 85, metadata: { status: "WARNING", successRate: "93.3%", layer: "Analytics" } },
  { id: "d-18", type: "ALERT", name: "Batch com Atraso > 30min", description: "Processo batch ultrapassou janela de execução", source: "Central de Alertas", relevance: 65, metadata: { severity: "HIGH", layer: "Delivery", triggers: "4" } },
];

export const searchArtifacts = createAsyncThunk("discovery/search", async (term: string) => {
  await new Promise((r) => setTimeout(r, 400));
  if (!term.trim()) return allArtifacts;
  const lower = term.toLowerCase();
  return allArtifacts
    .filter((a) =>
      a.name.toLowerCase().includes(lower) ||
      a.description.toLowerCase().includes(lower) ||
      a.source.toLowerCase().includes(lower) ||
      Object.values(a.metadata).some((v) => v.toLowerCase().includes(lower))
    )
    .sort((a, b) => b.relevance - a.relevance);
});

const discoverySlice = createSlice({
  name: "discovery",
  initialState: { results: [], loading: false, searchTerm: "", error: null } as DiscoveryState,
  reducers: {
    setDiscoverySearch(state, { payload }: PayloadAction<string>) {
      state.searchTerm = payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(searchArtifacts.pending, (s) => { s.loading = true; })
     .addCase(searchArtifacts.fulfilled, (s, { payload }) => { s.loading = false; s.results = payload; })
     .addCase(searchArtifacts.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? "Erro"; });
  },
});

export const { setDiscoverySearch } = discoverySlice.actions;
export default discoverySlice.reducer;
