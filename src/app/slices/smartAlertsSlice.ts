import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type AlertMethod = "ai_baseline" | "ai_drift" | "rule_based" | "ai_correlation";
export type AlertStatus = "new" | "acknowledged" | "resolved" | "suppressed";

export interface SmartAlert {
  id: string;
  title: string;
  description: string;
  method: AlertMethod;
  confidence: number;
  severity: "critical" | "high" | "medium" | "low";
  status: AlertStatus;
  layer: string;
  detectedAt: string;
  baselineValue: number | null;
  currentValue: number | null;
  deviationPct: number | null;
  relatedAlertIds: string[];
  aiExplanation: string;
}

export interface SmartAlertsStats {
  totalToday: number;
  aiDetected: number;
  ruleDetected: number;
  falsePositiveRate: number;
  avgConfidence: number;
  noiseReductionPct: number;
}

export interface SmartAlertsState {
  alerts: SmartAlert[];
  stats: SmartAlertsStats | null;
  loading: boolean;
  error: string | null;
}

const mockAlerts: SmartAlert[] = [
  { id:"sa-01", title:"Desvio estatistico severo — Validacao de Identidade", description:"Queda abrupta de 100% na taxa de validacao de identidade em 3 desvios padrao abaixo do baseline dos ultimos 30 dias", method:"ai_baseline", confidence:98, severity:"critical", status:"acknowledged", layer:"ingestion", detectedAt:"2026-03-19T16:00:00Z", baselineValue:98.5, currentValue:0.0, deviationPct:-100.0, relatedAlertIds:["sa-03","sa-04"], aiExplanation:"Modelo Z-score detectou queda de 100% em janela de 15 minutos. Baseline construido com 720 janelas historicas. Probabilidade de falso positivo: 0.02%. Correlacionado com sa-03 e sa-04." },
  { id:"sa-02", title:"Drift de distribuicao — Score Cluster B (alta confianca)", description:"Distribuicao do Score Cluster B divergiu do padrao historico — KL-divergence = 0.34 (threshold: 0.15)", method:"ai_drift", confidence:91, severity:"high", status:"new", layer:"analytics", detectedAt:"2026-03-19T18:00:00Z", baselineValue:0.08, currentValue:0.34, deviationPct:325.0, relatedAlertIds:["sa-01"], aiExplanation:"Algoritmo de deteccao de drift (KL-divergence) identificou mudanca de distribuicao significativa. Causa provavel: dado de entrada corrompido no batch das 15h (correlacionado com sa-01)." },
  { id:"sa-03", title:"Correlacao de anomalias — Cluster Fraude e Identidade", description:"Anomalia simultanea detectada em 2 streams independentes com correlacao temporal de 0.94 — evento sistemico provavel", method:"ai_correlation", confidence:94, severity:"critical", status:"acknowledged", layer:"ingestion", detectedAt:"2026-03-19T16:05:00Z", baselineValue:null, currentValue:null, deviationPct:null, relatedAlertIds:["sa-01","sa-04"], aiExplanation:"Motor de correlacao entre streams detectou padrao temporal entre Identidade e Fraude ocorrendo no mesmo batch. Probabilidade de evento sistemico: 94%." },
  { id:"sa-04", title:"Score zerado detectado — Modelo Anti-Fraude Identidade Sintetica", description:"100% de scores zerados em 5.400 predicoes — modelo sem dados de entrada validos", method:"rule_based", confidence:100, severity:"critical", status:"acknowledged", layer:"analytics", detectedAt:"2026-03-19T16:00:00Z", baselineValue:82.0, currentValue:0.0, deviationPct:-100.0, relatedAlertIds:["sa-01","sa-03"], aiExplanation:"Regra de threshold detectou score zerado. IA correlacionou com falha de identidade (sa-01) como causa provavel com 95% de confianca. Bloqueio automatico ativado pela Governanca." },
  { id:"sa-05", title:"Anomalia de latencia — Processamento FFT", description:"Latencia de processamento FFT 340% acima do P95 historico — possivel gargalo de I/O", method:"ai_baseline", confidence:87, severity:"medium", status:"new", layer:"trusted", detectedAt:"2026-03-19T17:45:00Z", baselineValue:1200, currentValue:5280, deviationPct:340.0, relatedAlertIds:[], aiExplanation:"Baseline de latencia construido com 1440 janelas (30 dias). Janela atual em 5.28s vs P95 historico de 1.2s. Provavel causa: corrompimento do arquivo FFT gerando re-processamento." },
  { id:"sa-06", title:"Suprimir: oscilacao diaria esperada — Score Cluster D", description:"Variacao dentro do padrao sazonal identificado — ruido suprimido", method:"ai_baseline", confidence:92, severity:"low", status:"suppressed", layer:"analytics", detectedAt:"2026-03-19T08:00:00Z", baselineValue:88.0, currentValue:85.5, deviationPct:-2.8, relatedAlertIds:[], aiExplanation:"Modelo de sazonalidade identificou que esta variacao ocorre em 89% das segundas-feiras. Alertas similares anteriores foram marcados como falso positivo 87 vezes. Suprimido automaticamente." },
];

const mockStats: SmartAlertsStats = {
  totalToday:48, aiDetected:39, ruleDetected:9, falsePositiveRate:3.2,
  avgConfidence:91, noiseReductionPct:87,
};

export const fetchSmartAlerts = createAsyncThunk("smartAlerts/fetch", async () => {
  await new Promise((r) => setTimeout(r, 600));
  return { alerts: mockAlerts, stats: mockStats };
});

const smartAlertsSlice = createSlice({
  name: "smartAlerts",
  initialState: { alerts:[], stats:null, loading:false, error:null } as SmartAlertsState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchSmartAlerts.pending, (s) => { s.loading = true; })
     .addCase(fetchSmartAlerts.fulfilled, (s, { payload }) => {
       s.loading = false; s.alerts = payload.alerts; s.stats = payload.stats;
     })
     .addCase(fetchSmartAlerts.rejected, (s, { error }) => {
       s.loading = false; s.error = error.message ?? "Erro SmartAlerts";
     });
  },
});

export default smartAlertsSlice.reducer;
