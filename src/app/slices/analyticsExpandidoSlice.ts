import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type ClusterHealth = "healthy" | "degraded" | "critical" | "unmonitored";

export interface ClusterCoverage {
  id: string;
  name: string;
  totalModels: number;
  monitoredModels: number;
  health: ClusterHealth;
  avgAccuracy: number;
  driftCount: number;
  zeroScoreCount: number;
}

export interface CoverageProgress {
  target: number;
  current: number;
  previousMonth: number;
  uncoveredClusters: number;
}

export interface AnalyticsExpandidoState {
  clusters: ClusterCoverage[];
  coverage: CoverageProgress | null;
  loading: boolean;
  error: string | null;
}

const mockClusters: ClusterCoverage[] = [
  { id:"cl-01", name:"Score Pessoa Fisica",  totalModels:312, monitoredModels:312, health:"degraded",  avgAccuracy:81, driftCount:42, zeroScoreCount:1 },
  { id:"cl-02", name:"Score Pessoa Juridica", totalModels:189, monitoredModels:189, health:"healthy",   avgAccuracy:91, driftCount:8,  zeroScoreCount:0 },
  { id:"cl-03", name:"Score Anti-Fraude",     totalModels:147, monitoredModels:147, health:"critical",  avgAccuracy:38, driftCount:87, zeroScoreCount:2 },
  { id:"cl-04", name:"Score Comportamental",  totalModels:198, monitoredModels:198, health:"degraded",  avgAccuracy:72, driftCount:54, zeroScoreCount:0 },
  { id:"cl-05", name:"Score Propensao",       totalModels:134, monitoredModels:134, health:"healthy",   avgAccuracy:88, driftCount:11, zeroScoreCount:0 },
  { id:"cl-06", name:"Score Historico Fin.",  totalModels:112, monitoredModels:112, health:"critical",  avgAccuracy:44, driftCount:91, zeroScoreCount:0 },
  { id:"cl-07", name:"Modelos Experimentais", totalModels:155, monitoredModels:0,   health:"unmonitored", avgAccuracy:0, driftCount:0, zeroScoreCount:0 },
];

const mockCoverage: CoverageProgress = {
  target: 1247, current: 1092, previousMonth: 100, uncoveredClusters: 1,
};

export const fetchAnalyticsExpandido = createAsyncThunk("analyticsExpandido/fetch", async () => {
  await new Promise((r) => setTimeout(r, 600));
  return { clusters: mockClusters, coverage: mockCoverage };
});

const analyticsExpandidoSlice = createSlice({
  name: "analyticsExpandido",
  initialState: { clusters:[], coverage:null, loading:false, error:null } as AnalyticsExpandidoState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchAnalyticsExpandido.pending, (s) => { s.loading = true; })
     .addCase(fetchAnalyticsExpandido.fulfilled, (s, { payload }) => {
       s.loading = false; s.clusters = payload.clusters; s.coverage = payload.coverage;
     })
     .addCase(fetchAnalyticsExpandido.rejected, (s, { error }) => {
       s.loading = false; s.error = error.message ?? "Erro Analytics";
     });
  },
});

export default analyticsExpandidoSlice.reducer;
