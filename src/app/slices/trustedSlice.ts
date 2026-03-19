import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type CheckStatus = "pass" | "warning" | "fail" | "running";

export interface QualityCheck {
  id: string; name: string;
  category: "consistency" | "completeness" | "timeliness" | "integrity";
  status: CheckStatus; lastRunAt: string;
  passRate: number; recordsChecked: number; failedRecords: number;
  description: string; transition: string;
}

export interface TrustedState {
  checks: QualityCheck[]; loading: boolean; error: string | null; lastUpdated: string | null;
}

const mockChecks: QualityCheck[] = [
  { id:"tru-01", name:"Consistencia de CPF", category:"integrity", status:"pass", lastRunAt:"2026-03-19T17:55:00Z", passRate:99.8, recordsChecked:55000, failedRecords:110, description:"Digito verificador e formato", transition:"Ingestion -> Trusted" },
  { id:"tru-02", name:"Completude de Campos Obrigatorios", category:"completeness", status:"warning", lastRunAt:"2026-03-19T17:40:00Z", passRate:93.2, recordsChecked:55000, failedRecords:3740, description:"Campos mandatorios para scoring", transition:"Ingestion -> Trusted" },
  { id:"tru-03", name:"Consistencia Cross-source", category:"consistency", status:"pass", lastRunAt:"2026-03-19T17:50:00Z", passRate:97.5, recordsChecked:48000, failedRecords:1200, description:"Nome vs. CPF vs. data nascimento", transition:"Ingestion -> Trusted" },
  { id:"tru-04", name:"Timeliness - Dados Frescos", category:"timeliness", status:"warning", lastRunAt:"2026-03-19T17:20:00Z", passRate:85.3, recordsChecked:22000, failedRecords:3234, description:"Max 30 dias para dados financeiros", transition:"Ingestion -> Trusted" },
  { id:"tru-05", name:"Validacao Arquivo FFT", category:"integrity", status:"fail", lastRunAt:"2026-03-19T16:30:00Z", passRate:0, recordsChecked:12000, failedRecords:12000, description:"Copia incorreta detectada - bloqueado", transition:"Trusted -> Analytics" },
  { id:"tru-06", name:"Integridade de Schema Analytics", category:"consistency", status:"pass", lastRunAt:"2026-03-19T17:58:00Z", passRate:99.1, recordsChecked:34000, failedRecords:306, description:"Schema conforme antes de enviar ao Analytics", transition:"Trusted -> Analytics" },
  { id:"tru-07", name:"Deteccao de Truncamento", category:"integrity", status:"running", lastRunAt:"2026-03-19T18:00:00Z", passRate:0, recordsChecked:0, failedRecords:0, description:"Verificando campos truncados nos registros", transition:"Trusted -> Analytics" },
];

export const fetchTrustedChecks = createAsyncThunk("trusted/fetchChecks", async () => {
  await new Promise((r) => setTimeout(r, 600));
  return mockChecks;
});

const trustedSlice = createSlice({
  name: "trusted",
  initialState: { checks:[], loading:false, error:null, lastUpdated:null } as TrustedState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTrustedChecks.pending, (s) => { s.loading = true; })
     .addCase(fetchTrustedChecks.fulfilled, (s, { payload }) => {
       s.loading = false; s.checks = payload; s.lastUpdated = new Date().toISOString();
     })
     .addCase(fetchTrustedChecks.rejected, (s, { error }) => {
       s.loading = false; s.error = error.message ?? "Erro Trusted";
     });
  },
});

export default trustedSlice.reducer;
