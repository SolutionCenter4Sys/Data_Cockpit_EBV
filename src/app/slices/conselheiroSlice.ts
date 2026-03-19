import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type JobPriority = "critical" | "high" | "normal" | "low";
export type WindowStatus = "ok" | "at_risk" | "overloaded";
export type RecommendationType = "reschedule" | "scale_up" | "pause" | "split";

export interface BatchWindow {
  id: string;
  name: string;
  start: string;
  end: string;
  status: WindowStatus;
  utilizationPct: number;
  jobCount: number;
  criticalJobs: number;
  projectedOverflowMinutes: number;
}

export interface CapacityRec {
  id: string;
  jobName: string;
  currentWindow: string;
  suggestedWindow: string;
  priority: JobPriority;
  type: RecommendationType;
  reason: string;
  estimatedImpactMinutes: number;
  applied: boolean;
}

export interface BatchForecast {
  windowId: string;
  windowName: string;
  hours: string[];
  utilizations: number[];
}

export interface ConselheiroState {
  windows: BatchWindow[];
  recommendations: CapacityRec[];
  forecast: BatchForecast | null;
  loading: boolean;
  error: string | null;
}

const mockWindows: BatchWindow[] = [
  { id:"bw-01", name:"Batch Diurno 08h-12h",   start:"08:00", end:"12:00", status:"ok",          utilizationPct:62, jobCount:48,  criticalJobs:8,  projectedOverflowMinutes:0 },
  { id:"bw-02", name:"Batch Tarde 14h-18h",     start:"14:00", end:"18:00", status:"at_risk",     utilizationPct:81, jobCount:73,  criticalJobs:12, projectedOverflowMinutes:0 },
  { id:"bw-03", name:"Batch Critico 15h-20h",   start:"15:00", end:"20:00", status:"overloaded",  utilizationPct:97, jobCount:89,  criticalJobs:21, projectedOverflowMinutes:45 },
  { id:"bw-04", name:"Batch Noturno 22h-06h",   start:"22:00", end:"06:00", status:"at_risk",     utilizationPct:88, jobCount:156, criticalJobs:34, projectedOverflowMinutes:0 },
  { id:"bw-05", name:"Batch Madrugada 03h-07h", start:"03:00", end:"07:00", status:"ok",          utilizationPct:41, jobCount:32,  criticalJobs:4,  projectedOverflowMinutes:0 },
];

const mockRecs: CapacityRec[] = [
  { id:"cr-01", jobName:"Score Cluster C — Predicao Diaria", currentWindow:"Batch Critico 15h-20h", suggestedWindow:"Batch Noturno 22h-06h", priority:"high", type:"reschedule", reason:"Janela critica sobrecarregada. Cluster C nao e de latencia-critica — pode aguardar ate 22h sem impacto ao negocio.", estimatedImpactMinutes:-25, applied:false },
  { id:"cr-02", jobName:"Reprocessamento Ingestion Identity", currentWindow:"Batch Noturno 22h-06h", suggestedWindow:"Batch Critico 15h-20h (urgente)", priority:"critical", type:"reschedule", reason:"Reprocessamento de identidade e pre-requisito para 3 modelos na janela de 06h. Deve ocorrer ate 22h.", estimatedImpactMinutes:0, applied:false },
  { id:"cr-03", jobName:"Relatorio Compliance Mensal", currentWindow:"Batch Tarde 14h-18h", suggestedWindow:"Batch Diurno 08h-12h", priority:"low", type:"reschedule", reason:"Job de baixa criticidade contribuindo para sobrecarga da janela da tarde. Pode ser adiantado.", estimatedImpactMinutes:-12, applied:true },
  { id:"cr-04", jobName:"Enriquecimento Endereco — Volume Alto", currentWindow:"Batch Critico 15h-20h", suggestedWindow:"Split: 50% Diurno + 50% Noturno", priority:"normal", type:"split", reason:"Volume excede capacidade da janela critica. Dividir em dois lotes reduz pressao em 30%.", estimatedImpactMinutes:-18, applied:false },
];

const mockForecast: BatchForecast = {
  windowId:"bw-04",
  windowName:"Batch Noturno 22h-06h (previsao de hoje)",
  hours:["22h","23h","00h","01h","02h","03h","04h","05h","06h"],
  utilizations:[45, 67, 89, 97, 91, 78, 62, 45, 28],
};

export const fetchConselheiroData = createAsyncThunk("conselheiro/fetch", async () => {
  await new Promise((r) => setTimeout(r, 600));
  return { windows: mockWindows, recommendations: mockRecs, forecast: mockForecast };
});

const conselheiroSlice = createSlice({
  name: "conselheiro",
  initialState: { windows:[], recommendations:[], forecast:null, loading:false, error:null } as ConselheiroState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchConselheiroData.pending, (s) => { s.loading = true; })
     .addCase(fetchConselheiroData.fulfilled, (s, { payload }) => {
       s.loading = false;
       s.windows = payload.windows;
       s.recommendations = payload.recommendations;
       s.forecast = payload.forecast;
     })
     .addCase(fetchConselheiroData.rejected, (s, { error }) => {
       s.loading = false; s.error = error.message ?? "Erro Conselheiro";
     });
  },
});

export default conselheiroSlice.reducer;
