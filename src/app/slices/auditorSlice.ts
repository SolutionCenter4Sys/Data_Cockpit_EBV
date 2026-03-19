import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type ModelHealth = "healthy" | "degraded" | "critical" | "zero_score" | "unknown";
export type DriftType = "feature_drift" | "target_drift" | "concept_drift" | "data_quality";

export interface ModelAlert {
  modelId: string;
  driftType: DriftType;
  severity: "critical" | "high" | "medium";
  detectedAt: string;
  description: string;
  affectedVariables: string[];
  recommendation: string;
}

export interface ModelSummary {
  id: string;
  name: string;
  cluster: string;
  health: ModelHealth;
  accuracyScore: number; // 0-100
  driftScore: number;    // 0-100 (higher = more drift)
  lastUpdated: string;
  scoreZeroCount: number;
  totalPredictions: number;
  alerts: ModelAlert[];
}

export interface AuditorStats {
  totalModels: number;
  healthyModels: number;
  degradedModels: number;
  criticalModels: number;
  zeroScoreModels: number;
  avgAccuracy: number;
  modelsWithDrift: number;
  coveragePercent: number; // % of 1000+ models monitored
}

export interface AuditorState {
  models: ModelSummary[];
  stats: AuditorStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const mockStats: AuditorStats = {
  totalModels: 1247, healthyModels: 1089, degradedModels: 143, criticalModels: 12,
  zeroScoreModels: 3, avgAccuracy: 87.4, modelsWithDrift: 156, coveragePercent: 100,
};

const mockModels: ModelSummary[] = [
  {
    id:"mod-01", name:"Score Credito Pessoa Fisica — Cluster A", cluster:"Cluster A",
    health:"healthy", accuracyScore:92, driftScore:8, lastUpdated:"2026-03-19T17:00:00Z",
    scoreZeroCount:0, totalPredictions:48320,
    alerts:[],
  },
  {
    id:"mod-02", name:"Score Credito Pessoa Fisica — Cluster B", cluster:"Cluster B",
    health:"degraded", accuracyScore:74, driftScore:52, lastUpdated:"2026-03-19T18:00:00Z",
    scoreZeroCount:0, totalPredictions:38100,
    alerts:[
      { modelId:"mod-02", driftType:"data_quality", severity:"high", detectedAt:"2026-03-19T18:00:00Z", description:"Dado de identidade ausente impacta 6 variaveis principais do modelo", affectedVariables:["v_cpf_score","v_historico_id","v_renda_estimada"], recommendation:"Aguardar normalizacao da fonte de identidade e reprocessar" }
    ],
  },
  {
    id:"mod-03", name:"Score Credito PJ Medio Porte", cluster:"Cluster PJ",
    health:"healthy", accuracyScore:89, driftScore:15, lastUpdated:"2026-03-19T16:00:00Z",
    scoreZeroCount:0, totalPredictions:9820, alerts:[],
  },
  {
    id:"mod-04", name:"Score Comportamental Digital", cluster:"Cluster Digital",
    health:"degraded", accuracyScore:68, driftScore:67, lastUpdated:"2026-03-19T17:00:00Z",
    scoreZeroCount:0, totalPredictions:61200,
    alerts:[
      { modelId:"mod-04", driftType:"feature_drift", severity:"high", detectedAt:"2026-03-19T15:00:00Z", description:"Distribuicao da variavel v_session_time mudou 34% em relacao ao baseline do ultimo mes", affectedVariables:["v_session_time","v_click_rate","v_device_score"], recommendation:"Recalibrar baseline de variaveis comportamentais digitais" }
    ],
  },
  {
    id:"mod-05", name:"Score Historico Financeiro — Alta Renda", cluster:"Cluster HF",
    health:"critical", accuracyScore:41, driftScore:88, lastUpdated:"2026-03-19T14:00:00Z",
    scoreZeroCount:0, totalPredictions:22110,
    alerts:[
      { modelId:"mod-05", driftType:"concept_drift", severity:"critical", detectedAt:"2026-03-19T14:00:00Z", description:"Conceito de 'alta renda' mudou apos nova segmentacao do SCR — modelo desatualizado", affectedVariables:["v_renda_scr","v_patrimonio_declarado","v_limite_atual"], recommendation:"Re-treinar modelo com novo threshold de segmentacao de renda — urgente" },
      { modelId:"mod-05", driftType:"target_drift", severity:"high", detectedAt:"2026-03-19T14:00:00Z", description:"Taxa de inadimplencia real divergindo do target de treino em 2.3 desvios padrao", affectedVariables:["target_default_90d"], recommendation:"Atualizar target com inadimplencias recentes — dados de 2025-2026" }
    ],
  },
  {
    id:"mod-06", name:"Score Anti-Fraude — Identidade Sintetica", cluster:"Cluster Fraude",
    health:"zero_score", accuracyScore:0, driftScore:100, lastUpdated:"2026-03-19T16:00:00Z",
    scoreZeroCount:5400, totalPredictions:5400,
    alerts:[
      { modelId:"mod-06", driftType:"data_quality", severity:"critical", detectedAt:"2026-03-19T16:00:00Z", description:"100% de scores zerados — servico de identidade indisponivel, todas as variaveis de entrada ausentes", affectedVariables:["v_cpf_valido","v_biometria","v_docs_ocr"], recommendation:"Aguardar normalizacao do servico de identidade — bloqueio automatico ativado" }
    ],
  },
  {
    id:"mod-07", name:"Score Propensao Investimento", cluster:"Cluster Propensao",
    health:"healthy", accuracyScore:91, driftScore:12, lastUpdated:"2026-03-19T17:30:00Z",
    scoreZeroCount:0, totalPredictions:15600, alerts:[],
  },
];

export const fetchAuditorData = createAsyncThunk("auditor/fetchData", async () => {
  await new Promise((r) => setTimeout(r, 700));
  return { models: mockModels, stats: mockStats };
});

const auditorSlice = createSlice({
  name: "auditor",
  initialState: { models:[], stats:null, loading:false, error:null, lastUpdated:null } as AuditorState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchAuditorData.pending, (s) => { s.loading = true; })
     .addCase(fetchAuditorData.fulfilled, (s, { payload }) => {
       s.loading = false; s.models = payload.models; s.stats = payload.stats;
       s.lastUpdated = new Date().toISOString();
     })
     .addCase(fetchAuditorData.rejected, (s, { error }) => {
       s.loading = false; s.error = error.message ?? "Erro Auditor";
     });
  },
});

export default auditorSlice.reducer;
