import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type RiskLevel = "critical" | "high" | "medium" | "low";
export type PredictionHorizon = "2h" | "6h" | "12h" | "24h" | "48h";

export interface Prediction {
  id: string;
  title: string;
  type: "batch_failure" | "score_zero" | "model_drift" | "capacity" | "cascade";
  riskLevel: RiskLevel;
  probability: number; // 0-100
  horizon: PredictionHorizon;
  affectedComponent: string;
  layer: string;
  predictedAt: string;
  description: string;
  triggerSignals: string[];
  suggestedAction: string;
  status: "active" | "prevented" | "occurred" | "monitoring";
  confidenceInterval: [number, number];
}

export interface PredictivoStats {
  activePredictions: number;
  highRiskNext24h: number;
  preventedToday: number;
  accuracyRate: number;
  avgLeadTime: string;
}

export interface PredictivoState {
  predictions: Prediction[];
  stats: PredictivoStats | null;
  loading: boolean;
  error: string | null;
}

const mockPredictions: Prediction[] = [
  {
    id:"pr-01", title:"Risco de estouro da janela batch de madrugada",
    type:"capacity", riskLevel:"critical", probability:78, horizon:"12h",
    affectedComponent:"Pipeline Batch 22h-06h", layer:"ingestion",
    predictedAt:"2026-03-19T19:00:00Z",
    description:"Com o backlog acumulado pelos incidentes de hoje (identidade + FFT), o volume pendente para reprocessamento excede a capacidade estimada da janela batch. Probabilidade de estouro: 78%.",
    triggerSignals:["Backlog acumulado 18h", "Volume +12% vs. media mensal", "Incidentes nao resolvidos: 2 criticos"],
    suggestedAction:"Reagendar jobs nao-criticos para janela 08h-12h; priorizar reprocessamento de identidade e FFT.",
    status:"active", confidenceInterval:[65, 89],
  },
  {
    id:"pr-02", title:"Novo score zerado previsto — Modelo Cluster C (amanha 06h)",
    type:"score_zero", riskLevel:"high", probability:62, horizon:"12h",
    affectedComponent:"Score Cluster C", layer:"analytics",
    predictedAt:"2026-03-19T18:30:00Z",
    description:"Modelo Cluster C usa 4 variaveis do mesmo pipeline de identidade afetado. Se o reprocessamento nao ocorrer ate 06h, a predicao de amanha sera executada com dados corrompidos.",
    triggerSignals:["Dependencia de Identidade", "Drift de 52% em variaveis criticas", "Janela de predicao: 06h"],
    suggestedAction:"Bloquear execucao do Cluster C ate normalizacao de identidade ou executar com dados do dia anterior como fallback.",
    status:"active", confidenceInterval:[48, 74],
  },
  {
    id:"pr-03", title:"Degradacao progressiva — Modelo Score Historico Financeiro",
    type:"model_drift", riskLevel:"high", probability:89, horizon:"48h",
    affectedComponent:"Score Historico Financeiro — Alta Renda", layer:"analytics",
    predictedAt:"2026-03-19T14:00:00Z",
    description:"Tendencia de degradacao continua detectada nos ultimos 5 dias. Modelo perdera precisao abaixo de 40% em 48h se nao re-treinado.",
    triggerSignals:["Acuracia caindo 2.5% por dia", "Concept drift no SCR confirmado", "Target drift 2.3 desvios padrao"],
    suggestedAction:"Iniciar re-treinamento com dados de 2025-2026 urgente. Auditor AG-07 ja registrou recomendacao.",
    status:"monitoring", confidenceInterval:[81, 95],
  },
  {
    id:"pr-04", title:"Falha em cascata — Pipeline Trusted-Analytics amanha",
    type:"cascade", riskLevel:"critical", probability:71, horizon:"12h",
    affectedComponent:"Pipeline Trusted para Analytics", layer:"trusted",
    predictedAt:"2026-03-19T18:00:00Z",
    description:"Se o arquivo FFT nao for corrigido e o bloqueio do Guardiao permanecer, 5 modelos analiticos ficarao sem dado de entrada no ciclo das 06h.",
    triggerSignals:["Gate FFT falhando", "Bloqueio Guardiao ativo", "5 modelos dependentes identificados"],
    suggestedAction:"Corrigir arquivo FFT (Caso dc-02) e re-executar validacao do Guardiao antes das 22h.",
    status:"active", confidenceInterval:[58, 82],
  },
  {
    id:"pr-05", title:"Estouro de capacidade I/O — Servidor de Ingestion (semana que vem)",
    type:"capacity", riskLevel:"medium", probability:54, horizon:"48h",
    affectedComponent:"Servidor Ingestion-01", layer:"ingestion",
    predictedAt:"2026-03-19T12:00:00Z",
    description:"Crescimento de 12% no volume mensal, tendencia projetada para as proximas 4 semanas indica estouro de capacidade de disco em ~7 dias.",
    triggerSignals:["Crescimento volume: +12% MoM", "Capacidade atual: 78% utilizada", "Tendencia linear 30 dias"],
    suggestedAction:"Solicitar expansao de 20% de capacidade de disco. Prazo: 5 dias uteis.",
    status:"monitoring", confidenceInterval:[40, 67],
  },
  {
    id:"pr-06", title:"Risco de batch falhar — Cluster PJ (prevencao aplicada ontem)",
    type:"batch_failure", riskLevel:"medium", probability:34, horizon:"24h",
    affectedComponent:"Batch Score PJ", layer:"analytics",
    predictedAt:"2026-03-18T16:00:00Z",
    description:"Predicao de ontem foi aplicada: Conselheiro reagendou job para janela fora do pico. Falha prevista nao ocorreu.",
    triggerSignals:["Volume pico detectado", "Janela batch sobreposta", "Reagendamento aplicado"],
    suggestedAction:"Reagendamento ja aplicado com sucesso. Monitorar proximo ciclo.",
    status:"prevented", confidenceInterval:[22, 45],
  },
];

const mockStats: PredictivoStats = {
  activePredictions:4, highRiskNext24h:3, preventedToday:1, accuracyRate:83,
  avgLeadTime:"9.2h antes",
};

export const fetchPredictivoData = createAsyncThunk("preditivoIA/fetch", async () => {
  await new Promise((r) => setTimeout(r, 700));
  return { predictions: mockPredictions, stats: mockStats };
});

const predictivoSlice = createSlice({
  name: "preditivoIA",
  initialState: { predictions:[], stats:null, loading:false, error:null } as PredictivoState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchPredictivoData.pending, (s) => { s.loading = true; })
     .addCase(fetchPredictivoData.fulfilled, (s, { payload }) => {
       s.loading = false; s.predictions = payload.predictions; s.stats = payload.stats;
     })
     .addCase(fetchPredictivoData.rejected, (s, { error }) => {
       s.loading = false; s.error = error.message ?? "Erro Preditivio";
     });
  },
});

export default predictivoSlice.reducer;
