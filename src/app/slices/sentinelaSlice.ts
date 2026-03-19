import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface Signal {
  id: string; source: string; layer: string; timestamp: string;
  value: number; baseline: number; deviation: number;
  isAnomaly: boolean; quality: "high" | "medium" | "low";
}

export interface SentinelaState {
  signals: Signal[]; noiseReduction: number; anomalyCount: number;
  baselineLearned: boolean; monitoredSources: number; signalQuality: number;
  loading: boolean; error: string | null; lastUpdated: string | null;
}

const mockSignals: Signal[] = [
  { id:"sig-01", source:"Historico Financeiro", layer:"ingestion", timestamp:"2026-03-19T18:00:00Z", value:22110, baseline:21800, deviation:1.4, isAnomaly:false, quality:"high" },
  { id:"sig-02", source:"Validacao de E-mail", layer:"ingestion", timestamp:"2026-03-19T18:00:00Z", value:38100, baseline:36000, deviation:5.8, isAnomaly:true, quality:"medium" },
  { id:"sig-03", source:"Enriquecimento de Endereco", layer:"ingestion", timestamp:"2026-03-19T18:00:00Z", value:48320, baseline:47900, deviation:0.9, isAnomaly:false, quality:"high" },
  { id:"sig-04", source:"Validacao de Identidade", layer:"ingestion", timestamp:"2026-03-19T18:00:00Z", value:0, baseline:5400, deviation:-100, isAnomaly:true, quality:"low" },
  { id:"sig-05", source:"FFT Pipeline", layer:"trusted", timestamp:"2026-03-19T18:00:00Z", value:0, baseline:12000, deviation:-100, isAnomaly:true, quality:"low" },
  { id:"sig-06", source:"Score Model Cluster A", layer:"analytics", timestamp:"2026-03-19T18:00:00Z", value:742, baseline:748, deviation:-0.8, isAnomaly:false, quality:"high" },
  { id:"sig-07", source:"Score Model Cluster B", layer:"analytics", timestamp:"2026-03-19T18:00:00Z", value:621, baseline:680, deviation:-8.7, isAnomaly:true, quality:"medium" },
  { id:"sig-08", source:"Batch Principal", layer:"batch", timestamp:"2026-03-19T18:00:00Z", value:97, baseline:98, deviation:-1.0, isAnomaly:false, quality:"high" },
];

export const fetchSentinelaData = createAsyncThunk("sentinela/fetchData", async () => {
  await new Promise((r) => setTimeout(r, 500));
  return {
    signals: mockSignals, noiseReduction: 94.7,
    anomalyCount: mockSignals.filter(s => s.isAnomaly).length,
    baselineLearned: true, monitoredSources: mockSignals.length, signalQuality: 78,
  };
});

const sentinelaSlice = createSlice({
  name: "sentinela",
  initialState: { signals:[], noiseReduction:0, anomalyCount:0, baselineLearned:false, monitoredSources:0, signalQuality:0, loading:false, error:null, lastUpdated:null } as SentinelaState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchSentinelaData.pending, (s) => { s.loading = true; })
     .addCase(fetchSentinelaData.fulfilled, (s, { payload }) => {
       s.loading = false;
       s.signals = payload.signals; s.noiseReduction = payload.noiseReduction;
       s.anomalyCount = payload.anomalyCount; s.baselineLearned = payload.baselineLearned;
       s.monitoredSources = payload.monitoredSources; s.signalQuality = payload.signalQuality;
       s.lastUpdated = new Date().toISOString();
     })
     .addCase(fetchSentinelaData.rejected, (s, { error }) => {
       s.loading = false; s.error = error.message ?? "Erro Sentinela";
     });
  },
});

export default sentinelaSlice.reducer;
