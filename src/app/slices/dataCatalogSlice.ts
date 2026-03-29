import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { DataSource, DataAsset } from "../../domain/entities";

interface DataCatalogState {
  sources: DataSource[];
  assets: DataAsset[];
  searchQuery: string;
  loading: boolean;
  assetsLoading: boolean;
  error: string | null;
}

const mockSources: DataSource[] = [
  { id:"ds-01", name:"EBV Core Database", type:"POSTGRESQL", layer:"INGESTION", owner:"Squad Dados", description:"Base principal de dados operacionais EBV com transações e cadastros", tags:["core","transacional","pii"], tablesCount:142, recordsTotal:28500000, lastSync:"2026-03-29T08:15:00Z", status:"RUNNING", qualityScore:94, hasAlerts:false, connectorId:"cn-01" },
  { id:"ds-02", name:"BigQuery Analytics", type:"BIGQUERY", layer:"ANALYTICS", owner:"Squad Analytics", description:"Data warehouse analítico com modelos de score e métricas agregadas", tags:["analytics","score","ml"], tablesCount:67, recordsTotal:152000000, lastSync:"2026-03-29T07:30:00Z", status:"SUCCESS", qualityScore:91, hasAlerts:false, connectorId:"cn-02" },
  { id:"ds-03", name:"GCS Data Lake", type:"GCS", layer:"TRUSTED", owner:"Squad Engenharia", description:"Armazenamento de dados brutos e arquivos FFT para processamento batch", tags:["datalake","fft","raw"], tablesCount:0, recordsTotal:45000000, lastSync:"2026-03-29T06:00:00Z", status:"SUCCESS", qualityScore:87, hasAlerts:true, connectorId:"cn-03" },
  { id:"ds-04", name:"Oracle Legado", type:"ORACLE", layer:"INGESTION", owner:"Squad Legado", description:"Sistema legado com dados históricos de clientes e contratos", tags:["legado","migração","pii"], tablesCount:312, recordsTotal:95000000, lastSync:"2026-03-28T23:00:00Z", status:"WARNING", qualityScore:72, hasAlerts:true, connectorId:"cn-04" },
  { id:"ds-05", name:"Kafka Events Stream", type:"KAFKA", layer:"INGESTION", owner:"Squad Real-time", description:"Stream de eventos em tempo real de transações e alertas", tags:["streaming","eventos","real-time"], tablesCount:0, recordsTotal:0, lastSync:"2026-03-29T09:00:00Z", status:"RUNNING", qualityScore:96, hasAlerts:false, connectorId:"cn-05" },
  { id:"ds-06", name:"MySQL CRM", type:"MYSQL", layer:"INGESTION", owner:"Squad CRM", description:"Base de dados do CRM com informações de clientes e interações", tags:["crm","clientes","pii"], tablesCount:58, recordsTotal:12300000, lastSync:"2026-03-29T08:45:00Z", status:"SUCCESS", qualityScore:89, hasAlerts:false, connectorId:"cn-06" },
  { id:"ds-07", name:"API Parceiros", type:"REST_API", layer:"INGESTION", owner:"Squad Integrações", description:"API REST de integração com parceiros para dados de mercado", tags:["api","parceiros","externo"], tablesCount:0, recordsTotal:0, lastSync:"2026-03-29T09:10:00Z", status:"RUNNING", qualityScore:82, hasAlerts:false, connectorId:"cn-07" },
];

const mockAssets: Record<string, DataAsset[]> = {
  "ds-01": [
    { id:"da-01", sourceId:"ds-01", name:"clientes", type:"TABLE", schema:"public", columns:24, rows:1250000, owner:"Squad Dados", tags:["pii","core"], qualityScore:96, lastUpdated:"2026-03-29T08:15:00Z", description:"Tabela principal de clientes PF e PJ", hasTests:true, piiFields:["cpf","nome","email","telefone"] },
    { id:"da-02", sourceId:"ds-01", name:"transacoes", type:"TABLE", schema:"public", columns:18, rows:15200000, owner:"Squad Dados", tags:["financeiro","core"], qualityScore:93, lastUpdated:"2026-03-29T08:15:00Z", description:"Registro de transações financeiras", hasTests:true, piiFields:["cpf_titular"] },
    { id:"da-03", sourceId:"ds-01", name:"contratos", type:"TABLE", schema:"public", columns:32, rows:890000, owner:"Squad Dados", tags:["jurídico","pii"], qualityScore:91, lastUpdated:"2026-03-29T07:00:00Z", description:"Contratos ativos e históricos", hasTests:false, piiFields:["cpf","nome_contratante"] },
    { id:"da-04", sourceId:"ds-01", name:"vw_clientes_ativos", type:"VIEW", schema:"public", columns:12, rows:980000, owner:"Squad Dados", tags:["view","relatório"], qualityScore:95, lastUpdated:"2026-03-29T08:15:00Z", description:"View materializada de clientes ativos", hasTests:true, piiFields:[] },
  ],
  "ds-02": [
    { id:"da-05", sourceId:"ds-02", name:"score_credito_pf", type:"TABLE", schema:"analytics", columns:15, rows:42000000, owner:"Squad Analytics", tags:["score","ml"], qualityScore:94, lastUpdated:"2026-03-29T07:30:00Z", description:"Scores de crédito PF calculados por modelo ML", hasTests:true, piiFields:["cpf"] },
    { id:"da-06", sourceId:"ds-02", name:"score_fraude", type:"TABLE", schema:"analytics", columns:20, rows:38000000, owner:"Squad Analytics", tags:["score","fraude","ml"], qualityScore:90, lastUpdated:"2026-03-29T07:30:00Z", description:"Scores de detecção de fraude", hasTests:true, piiFields:["cpf"] },
    { id:"da-07", sourceId:"ds-02", name:"metricas_diarias", type:"TABLE", schema:"analytics", columns:28, rows:5400000, owner:"Squad Analytics", tags:["kpi","agregado"], qualityScore:97, lastUpdated:"2026-03-29T07:30:00Z", description:"Métricas agregadas por dia", hasTests:false, piiFields:[] },
  ],
  "ds-04": [
    { id:"da-08", sourceId:"ds-04", name:"TB_CLIENTE_HIST", type:"TABLE", schema:"EBVPROD", columns:45, rows:35000000, owner:"Squad Legado", tags:["legado","histórico"], qualityScore:68, lastUpdated:"2026-03-28T23:00:00Z", description:"Histórico de clientes do sistema legado", hasTests:false, piiFields:["NR_CPF","NM_CLIENTE","DS_EMAIL"] },
  ],
};

export const fetchSources = createAsyncThunk("dataCatalog/fetchSources", async () => {
  await new Promise((r) => setTimeout(r, 600));
  return mockSources;
});

export const fetchAssets = createAsyncThunk("dataCatalog/fetchAssets", async (sourceId: string) => {
  await new Promise((r) => setTimeout(r, 400));
  return { sourceId, assets: mockAssets[sourceId] ?? [] };
});

export const searchCatalog = createAsyncThunk("dataCatalog/search", async (query: string) => {
  await new Promise((r) => setTimeout(r, 300));
  const q = query.toLowerCase();
  return mockSources.filter(
    (s) => s.name.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q)) || s.description.toLowerCase().includes(q)
  );
});

const dataCatalogSlice = createSlice({
  name: "dataCatalog",
  initialState: { sources: [], assets: [], searchQuery: "", loading: false, assetsLoading: false, error: null } as DataCatalogState,
  reducers: {
    setSearchQuery(state, { payload }: { payload: string }) { state.searchQuery = payload; },
  },
  extraReducers: (b) => {
    b.addCase(fetchSources.pending, (s) => { s.loading = true; })
     .addCase(fetchSources.fulfilled, (s, { payload }) => { s.loading = false; s.sources = payload; })
     .addCase(fetchSources.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? "Erro"; })
     .addCase(fetchAssets.pending, (s) => { s.assetsLoading = true; })
     .addCase(fetchAssets.fulfilled, (s, { payload }) => { s.assetsLoading = false; s.assets = payload.assets; })
     .addCase(fetchAssets.rejected, (s) => { s.assetsLoading = false; })
     .addCase(searchCatalog.pending, (s) => { s.loading = true; })
     .addCase(searchCatalog.fulfilled, (s, { payload }) => { s.loading = false; s.sources = payload; })
     .addCase(searchCatalog.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? "Erro"; });
  },
});

export const { setSearchQuery } = dataCatalogSlice.actions;
export default dataCatalogSlice.reducer;
