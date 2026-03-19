import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type IngestionStatus = "ok" | "warning" | "error" | "inactive";

export interface IngestionSource {
  id: string; name: string;
  type: "address" | "email" | "financial" | "identity" | "other";
  status: IngestionStatus; lastRunAt: string;
  recordsProcessed: number; errorCount: number;
  errorRate: number; latencyMs: number; description: string;
}

export interface IngestionState {
  sources: IngestionSource[]; loading: boolean;
  error: string | null; lastUpdated: string | null;
}

const mockSources: IngestionSource[] = [
  { id:"ing-01", name:"Enriquecimento de Endereco", type:"address", status:"ok", lastRunAt:"2026-03-19T17:30:00Z", recordsProcessed:48320, errorCount:12, errorRate:0.02, latencyMs:124, description:"CEP, logradouro, complemento" },
  { id:"ing-02", name:"Validacao de E-mail", type:"email", status:"warning", lastRunAt:"2026-03-19T17:15:00Z", recordsProcessed:38100, errorCount:891, errorRate:2.34, latencyMs:89, description:"Sintaxe, dominio, caixa postal" },
  { id:"ing-03", name:"Historico Financeiro", type:"financial", status:"ok", lastRunAt:"2026-03-19T17:45:00Z", recordsProcessed:22110, errorCount:5, errorRate:0.02, latencyMs:340, description:"SCR, serasa, historico de credito" },
  { id:"ing-04", name:"Validacao de Identidade", type:"identity", status:"error", lastRunAt:"2026-03-19T16:00:00Z", recordsProcessed:0, errorCount:5400, errorRate:100, latencyMs:0, description:"CPF, RG, biometria" },
  { id:"ing-05", name:"Dados Cadastrais PJ", type:"other", status:"ok", lastRunAt:"2026-03-19T17:50:00Z", recordsProcessed:9820, errorCount:31, errorRate:0.31, latencyMs:210, description:"CNPJ, razao social, socios" },
  { id:"ing-06", name:"Comportamento Digital", type:"other", status:"warning", lastRunAt:"2026-03-19T17:00:00Z", recordsProcessed:61200, errorCount:2100, errorRate:3.43, latencyMs:56, description:"Clicks, dispositivo, sessao" },
];

export const fetchIngestionSources = createAsyncThunk("ingestion/fetchSources", async () => {
  await new Promise((r) => setTimeout(r, 700));
  return mockSources;
});

const ingestionSlice = createSlice({
  name: "ingestion",
  initialState: { sources:[], loading:false, error:null, lastUpdated:null } as IngestionState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchIngestionSources.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchIngestionSources.fulfilled, (s, { payload }) => {
       s.loading = false; s.sources = payload; s.lastUpdated = new Date().toISOString();
     })
     .addCase(fetchIngestionSources.rejected, (s, { error }) => {
       s.loading = false; s.error = error.message ?? "Erro Ingestion";
     });
  },
});

export default ingestionSlice.reducer;
