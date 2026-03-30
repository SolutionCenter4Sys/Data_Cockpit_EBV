import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DiscoveryResult, TreeCategory } from "../../domain/entities";

export type SortMode = "relevance" | "popularity" | "name";
export type SortDirection = "asc" | "desc";

export interface DiscoveryFilters {
  domain: string;
  owner: string;
  tier: string;
  tag: string;
  certification: string;
  service: string;
  serviceType: string;
}

interface DiscoveryState {
  results: DiscoveryResult[];
  loading: boolean;
  searchTerm: string;
  error: string | null;
  selectedId: string | null;
  treeFilter: string;
  sortMode: SortMode;
  sortDirection: SortDirection;
  filters: DiscoveryFilters;
}

const allArtifacts: DiscoveryResult[] = [
  {
    id: "d-01", type: "TABLE", name: "dim_customers",
    description: "Dimensionale tabel met data over klanten zoals demografische gegevens en service gegevens. This is a sample dataset.",
    source: "Corporate System CRM", relevance: 100,
    metadata: { layer: "Governança", owner: "Diego", columns: "customer_id, name, cpf, score, email" },
    path: "acme_nexus_analytics / ANALYTICS / MARTS / dim_customers",
    owners: [{ name: "Diego", avatarColor: "#1565C0" }, { name: "Ana Silva", avatarColor: "#AD1457" }],
    tier: "Tier1", healthStatus: "healthy",
    tags: ["Engineering", "Marketing", "Bronze"],
    glossaryTerms: ["Customer", "Sales", "Acosta McL"],
    stats: { queries: 0, columns: 12, incidents: 0, tests: 1, rows: 45200 },
    lineage: { upstreamCount: 1, downstreamCount: 1 },
    domain: "Retail", certification: "certified", service: "Snowflake",
  },
  {
    id: "d-02", type: "TABLE", name: "products",
    description: "Products catalog with pricing and availability information",
    source: "acme_raw / catalog", relevance: 88,
    metadata: { layer: "Ingestão", owner: "Caio", columns: "product_id, name, price, category" },
    path: "acme_nexus_raw_data / acme_raw / catalog / products",
    owners: [{ name: "Caio", avatarColor: "#00695C" }],
    tier: "Tier2", healthStatus: "healthy",
    tags: ["Catalog", "Retail"],
    glossaryTerms: ["Product"],
    stats: { queries: 5, columns: 8, incidents: 0, tests: 0, rows: 12500 },
    lineage: { upstreamCount: 0, downstreamCount: 2 },
    domain: "Retail", certification: "none", service: "PostgreSQL",
  },
  {
    id: "d-03", type: "TABLE", name: "customer_360",
    description: "Production customer 360 view — tabela consolidada com visão completa do cliente",
    source: "Governança — Golden Record", relevance: 95,
    metadata: { layer: "Governança", owner: "Diego", columns: "customer_id, name, cpf, score, email" },
    path: "sample_snowflake / ANALYTICS_DB / prod / customer_360",
    owners: [{ name: "Diego", avatarColor: "#1565C0" }, { name: "Shimada", avatarColor: "#E65100" }],
    tier: "Tier1", healthStatus: "warning",
    tags: ["Sales", "Golden Record"],
    glossaryTerms: ["Customer", "Golden Record"],
    stats: { queries: 12, columns: 18, incidents: 1, tests: 5, rows: 89300 },
    lineage: { upstreamCount: 3, downstreamCount: 4 },
    domain: "Retail", certification: "certified", service: "Snowflake",
  },
  {
    id: "d-04", type: "TABLE", name: "raw_products",
    description: "This is the raw description??? — dados brutos de produtos sem transformação",
    source: "sample_athena / default / raw", relevance: 60,
    metadata: { layer: "Ingestão", owner: "Caio", columns: "product_id, name, raw_price" },
    path: "sample_athena / default / raw / raw_products",
    owners: [{ name: "Caio", avatarColor: "#00695C" }],
    tier: "Tier3", healthStatus: "error",
    tags: ["Raw", "Ingestion"],
    glossaryTerms: ["Product"],
    stats: { queries: 0, columns: 6, incidents: 2, tests: 0, rows: 5600 },
    lineage: { upstreamCount: 1, downstreamCount: 1 },
    domain: "Retail", certification: "none", service: "Athena",
  },
  {
    id: "d-05", type: "TABLE", name: "executive_sales_summary",
    description: "Executive sales dashboard — Daily aggregated sales metrics",
    source: "enterprise_dw / public", relevance: 82,
    metadata: { layer: "Analytics", owner: "Shimada", columns: "date, total_sales, region, growth_pct" },
    path: "acme_nexus_nextdp / enterprise_dw / public / executive_sales_summary",
    owners: [{ name: "Shimada", avatarColor: "#E65100" }],
    tier: "Tier2", healthStatus: "healthy",
    tags: ["Executive", "Sales", "Analytics"],
    glossaryTerms: ["Revenue", "Sales"],
    stats: { queries: 25, columns: 10, incidents: 0, tests: 3, rows: 365 },
    lineage: { upstreamCount: 2, downstreamCount: 0 },
    domain: "Finance", certification: "certified", service: "PostgreSQL",
  },
  {
    id: "d-06", type: "TABLE", name: "score_credito_pf",
    description: "Score de crédito pessoa física — modelo preditivo com features de risco",
    source: "Analytics — Shimada", relevance: 92,
    metadata: { layer: "Analytics", owner: "Shimada", columns: "cpf, score, data_ref, modelo_versao" },
    path: "acme_nexus_analytics / ANALYTICS_MART5 / score_credito_pf",
    owners: [{ name: "Shimada", avatarColor: "#E65100" }],
    tier: "Tier1", healthStatus: "healthy",
    tags: ["Credit", "Score", "PF"],
    glossaryTerms: ["Credit Score", "Risk"],
    stats: { queries: 45, columns: 8, incidents: 0, tests: 4, rows: 2500000 },
    lineage: { upstreamCount: 2, downstreamCount: 3 },
    domain: "Risk", certification: "certified", service: "Snowflake",
  },
  {
    id: "d-07", type: "TABLE", name: "score_fraude",
    description: "Score de fraude por transação — modelo de detecção de anomalias",
    source: "Analytics — Shimada", relevance: 90,
    metadata: { layer: "Analytics", owner: "Shimada", columns: "cpf, score, data_ref, risk_level" },
    path: "acme_nexus_analytics / ANALYTICS_MART5 / score_fraude",
    owners: [{ name: "Shimada", avatarColor: "#E65100" }, { name: "Ana Silva", avatarColor: "#AD1457" }],
    tier: "Tier1", healthStatus: "error",
    tags: ["Fraud", "Score", "Risk"],
    glossaryTerms: ["Fraud Detection", "Risk"],
    stats: { queries: 30, columns: 9, incidents: 3, tests: 6, rows: 1800000 },
    lineage: { upstreamCount: 2, downstreamCount: 2 },
    domain: "Risk", certification: "certified", service: "Snowflake",
  },
  {
    id: "d-08", type: "TABLE", name: "fact_orders",
    description: "Fato de pedidos com receita e métricas de venda por região",
    source: "DW — Shimada", relevance: 80,
    metadata: { layer: "DW", owner: "Shimada", columns: "order_id, customer_key, revenue, date" },
    path: "acme_nexus_analytics / ANALYTICS_MART5 / fact_orders",
    owners: [{ name: "Shimada", avatarColor: "#E65100" }],
    tier: "Tier2", healthStatus: "healthy",
    tags: ["Orders", "Revenue", "DW"],
    glossaryTerms: ["Revenue", "Order"],
    stats: { queries: 18, columns: 14, incidents: 0, tests: 2, rows: 450000 },
    lineage: { upstreamCount: 1, downstreamCount: 2 },
    domain: "Finance", certification: "none", service: "Snowflake",
  },
  {
    id: "d-09", type: "TABLE", name: "TB_CLIENTE_HIST",
    description: "Tabela histórica de clientes — legado Oracle com dados desde 2008",
    source: "Ingestão — Legado", relevance: 55,
    metadata: { layer: "Ingestão", owner: "Caio", columns: "NM_CLIENTE, CPF, DT_CADASTRO" },
    path: "oracle_legacy / EBV_PROD / public / TB_CLIENTE_HIST",
    owners: [{ name: "Caio", avatarColor: "#00695C" }],
    tier: "Tier3", healthStatus: "warning",
    tags: ["Legacy", "Oracle", "Historical"],
    glossaryTerms: ["Customer"],
    stats: { queries: 2, columns: 22, incidents: 1, tests: 0, rows: 3200000 },
    lineage: { upstreamCount: 0, downstreamCount: 1 },
    domain: "Retail", certification: "none", service: "Oracle",
  },
  {
    id: "d-10", type: "PIPELINE", name: "Pipeline Ingestão Core",
    description: "Pipeline principal de ingestão de dados dos sistemas fonte com validação",
    source: "Observabilidade", relevance: 78,
    metadata: { status: "SUCCESS", successRate: "96.4%", layer: "Ingestão" },
    path: "airflow / dags / ingestao_core",
    owners: [{ name: "Caio", avatarColor: "#00695C" }],
    tier: "Tier1", healthStatus: "healthy",
    tags: ["Ingestion", "Core", "ETL"],
    glossaryTerms: ["Data Pipeline"],
    stats: { queries: 0, columns: 0, incidents: 0, tests: 12, rows: 0 },
    lineage: { upstreamCount: 5, downstreamCount: 3 },
    domain: "Engineering", certification: "certified", service: "Airflow",
  },
  {
    id: "d-11", type: "PIPELINE", name: "Pipeline Trusted Sync",
    description: "Sincronização da camada trusted com golden record e validação de schema",
    source: "Observabilidade", relevance: 76,
    metadata: { status: "SUCCESS", successRate: "95.4%", layer: "Governança" },
    path: "airflow / dags / trusted_sync",
    owners: [{ name: "Diego", avatarColor: "#1565C0" }],
    tier: "Tier1", healthStatus: "healthy",
    tags: ["Trusted", "Sync", "Golden Record"],
    glossaryTerms: ["Data Pipeline", "Golden Record"],
    stats: { queries: 0, columns: 0, incidents: 0, tests: 8, rows: 0 },
    lineage: { upstreamCount: 3, downstreamCount: 4 },
    domain: "Engineering", certification: "certified", service: "Airflow",
  },
  {
    id: "d-12", type: "PIPELINE", name: "Pipeline Analytics Score",
    description: "Pipeline de cálculo de scores preditivos — crédito e fraude",
    source: "Analytics", relevance: 85,
    metadata: { status: "WARNING", successRate: "93.3%", layer: "Analytics" },
    path: "airflow / dags / analytics_score",
    owners: [{ name: "Shimada", avatarColor: "#E65100" }],
    tier: "Tier1", healthStatus: "warning",
    tags: ["Analytics", "Score", "ML"],
    glossaryTerms: ["ML Pipeline", "Credit Score"],
    stats: { queries: 0, columns: 0, incidents: 1, tests: 15, rows: 0 },
    lineage: { upstreamCount: 4, downstreamCount: 2 },
    domain: "Risk", certification: "draft", service: "Airflow",
  },
  {
    id: "d-13", type: "CONNECTOR", name: "EBV Core Database",
    description: "Conector principal PostgreSQL — base de governança e golden record",
    source: "Conectores", relevance: 75,
    metadata: { type: "POSTGRESQL", status: "CONNECTED", layer: "Governança" },
    path: "connectors / postgresql / ebv_core",
    owners: [{ name: "Diego", avatarColor: "#1565C0" }],
    tier: "Tier1", healthStatus: "healthy",
    tags: ["PostgreSQL", "Core"],
    glossaryTerms: [],
    stats: { queries: 0, columns: 0, incidents: 0, tests: 0 },
    lineage: { upstreamCount: 0, downstreamCount: 8 },
    domain: "Engineering", certification: "certified", service: "PostgreSQL",
  },
  {
    id: "d-14", type: "CONNECTOR", name: "BigQuery Analytics",
    description: "Conector BigQuery para camada analítica e modelos preditivos",
    source: "Conectores", relevance: 70,
    metadata: { type: "BIGQUERY", status: "CONNECTED", layer: "Analytics" },
    path: "connectors / bigquery / analytics",
    owners: [{ name: "Shimada", avatarColor: "#E65100" }],
    tier: "Tier2", healthStatus: "healthy",
    tags: ["BigQuery", "Analytics", "GCP"],
    glossaryTerms: [],
    stats: { queries: 0, columns: 0, incidents: 0, tests: 0 },
    lineage: { upstreamCount: 0, downstreamCount: 5 },
    domain: "Engineering", certification: "none", service: "BigQuery",
  },
  {
    id: "d-15", type: "QUALITY_RULE", name: "check_name_not_null",
    description: "Valida que nome do cliente nunca é nulo na customer_360",
    source: "Qualidade de Dados", relevance: 85,
    metadata: { status: "FAIL", table: "customer_360", severity: "CRITICAL" },
    path: "quality / customer_360 / check_name_not_null",
    owners: [{ name: "Ana Silva", avatarColor: "#AD1457" }],
    tier: "Tier1", healthStatus: "error",
    tags: ["Quality", "Null Check", "Critical"],
    glossaryTerms: ["Data Quality"],
    stats: { queries: 0, columns: 1, incidents: 1, tests: 1 },
    lineage: { upstreamCount: 1, downstreamCount: 0 },
    domain: "Retail", certification: "none", service: "OpenMetadata",
  },
  {
    id: "d-16", type: "QUALITY_RULE", name: "Revenue Must Be Positive",
    description: "Garante que receita é sempre positiva em fact_orders",
    source: "Qualidade de Dados", relevance: 72,
    metadata: { status: "PENDING", table: "fact_orders", severity: "HIGH" },
    path: "quality / fact_orders / revenue_positive",
    owners: [{ name: "Shimada", avatarColor: "#E65100" }],
    tier: "Tier2", healthStatus: "warning",
    tags: ["Quality", "Revenue", "Validation"],
    glossaryTerms: ["Data Quality", "Revenue"],
    stats: { queries: 0, columns: 1, incidents: 0, tests: 1 },
    lineage: { upstreamCount: 1, downstreamCount: 0 },
    domain: "Finance", certification: "none", service: "OpenMetadata",
  },
  {
    id: "d-17", type: "ALERT", name: "Score Zerado",
    description: "Alerta quando score de modelo retorna zero — indica falha no pipeline analítico",
    source: "Central de Alertas", relevance: 92,
    metadata: { severity: "CRITICAL", layer: "Analytics", triggers: "7" },
    path: "alerts / analytics / score_zerado",
    owners: [{ name: "Shimada", avatarColor: "#E65100" }],
    tier: "Tier1", healthStatus: "error",
    tags: ["Alert", "Critical", "Score"],
    glossaryTerms: ["Incident"],
    stats: { queries: 0, columns: 0, incidents: 7, tests: 0 },
    lineage: { upstreamCount: 2, downstreamCount: 1 },
    domain: "Risk", certification: "none", service: "Cockpit EBV",
  },
  {
    id: "d-18", type: "ALERT", name: "Batch com Atraso > 30min",
    description: "Processo batch ultrapassou janela de execução permitida",
    source: "Central de Alertas", relevance: 65,
    metadata: { severity: "HIGH", layer: "Delivery", triggers: "4" },
    path: "alerts / delivery / batch_atraso",
    owners: [{ name: "Caio", avatarColor: "#00695C" }],
    tier: "Tier2", healthStatus: "warning",
    tags: ["Alert", "Batch", "Delay"],
    glossaryTerms: ["Incident", "SLA"],
    stats: { queries: 0, columns: 0, incidents: 4, tests: 0 },
    lineage: { upstreamCount: 1, downstreamCount: 1 },
    domain: "Engineering", certification: "none", service: "Cockpit EBV",
  },
];

export const TREE_CATEGORIES: TreeCategory[] = [
  {
    id: "databases", label: "Bases de Dados", icon: "storage",
    children: [
      { id: "snowflake", label: "Snowflake", count: 4, children: [
        { id: "sf-analytics", label: "ANALYTICS_DB", count: 2 },
        { id: "sf-mart", label: "ANALYTICS_MART5", count: 2 },
      ]},
      { id: "postgresql", label: "PostgreSQL", count: 2, children: [
        { id: "pg-enterprise", label: "enterprise_dw", count: 1 },
        { id: "pg-catalog", label: "catalog", count: 1 },
      ]},
      { id: "oracle", label: "Oracle", count: 1, children: [
        { id: "or-legacy", label: "EBV_PROD", count: 1 },
      ]},
      { id: "athena", label: "Athena", count: 1, children: [
        { id: "at-raw", label: "raw", count: 1 },
      ]},
    ],
  },
  {
    id: "pipelines", label: "Pipelines", icon: "account_tree",
    children: [
      { id: "airflow", label: "Airflow", count: 3 },
    ],
  },
  {
    id: "connectors", label: "Conectores", icon: "cable",
    children: [
      { id: "conn-pg", label: "PostgreSQL", count: 1 },
      { id: "conn-bq", label: "BigQuery", count: 1 },
    ],
  },
  {
    id: "quality", label: "Qualidade", icon: "fact_check",
    children: [
      { id: "q-rules", label: "Regras de Qualidade", count: 2 },
    ],
  },
  {
    id: "alerts", label: "Alertas", icon: "notifications",
    children: [
      { id: "a-active", label: "Alertas Ativos", count: 2 },
    ],
  },
];

export const searchArtifacts = createAsyncThunk("discovery/search", async (term: string) => {
  await new Promise((r) => setTimeout(r, 300));
  if (!term.trim()) return allArtifacts;
  const lower = term.toLowerCase();
  return allArtifacts
    .filter((a) =>
      a.name.toLowerCase().includes(lower) ||
      a.description.toLowerCase().includes(lower) ||
      a.source.toLowerCase().includes(lower) ||
      a.path.toLowerCase().includes(lower) ||
      a.tags.some((t) => t.toLowerCase().includes(lower)) ||
      a.glossaryTerms.some((g) => g.toLowerCase().includes(lower)) ||
      a.domain.toLowerCase().includes(lower) ||
      a.service.toLowerCase().includes(lower) ||
      Object.values(a.metadata).some((v) => v.toLowerCase().includes(lower))
    )
    .sort((a, b) => b.relevance - a.relevance);
});

const emptyFilters: DiscoveryFilters = { domain: "", owner: "", tier: "", tag: "", certification: "", service: "", serviceType: "" };

const discoverySlice = createSlice({
  name: "discovery",
  initialState: {
    results: [], loading: false, searchTerm: "", error: null,
    selectedId: null, treeFilter: "", sortMode: "relevance", sortDirection: "desc",
    filters: emptyFilters,
  } as DiscoveryState,
  reducers: {
    setDiscoverySearch(state, { payload }: PayloadAction<string>) { state.searchTerm = payload; },
    selectAsset(state, { payload }: PayloadAction<string | null>) { state.selectedId = payload; },
    setTreeFilter(state, { payload }: PayloadAction<string>) { state.treeFilter = payload; },
    setSortMode(state, { payload }: PayloadAction<SortMode>) { state.sortMode = payload; },
    setSortDirection(state, { payload }: PayloadAction<SortDirection>) { state.sortDirection = payload; },
    setDiscoveryFilter(state, { payload }: PayloadAction<{ key: keyof DiscoveryFilters; value: string }>) {
      state.filters[payload.key] = payload.value;
    },
    clearDiscoveryFilters(state) { state.filters = emptyFilters; state.treeFilter = ""; },
  },
  extraReducers: (b) => {
    b.addCase(searchArtifacts.pending, (s) => { s.loading = true; })
     .addCase(searchArtifacts.fulfilled, (s, { payload }) => { s.loading = false; s.results = payload; })
     .addCase(searchArtifacts.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? "Erro"; });
  },
});

export const {
  setDiscoverySearch, selectAsset, setTreeFilter, setSortMode,
  setSortDirection, setDiscoveryFilter, clearDiscoveryFilters,
} = discoverySlice.actions;
export default discoverySlice.reducer;
