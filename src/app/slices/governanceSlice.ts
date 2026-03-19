import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type RuleStatus = "active" | "inactive" | "draft";
export type BlockStatus = "blocked" | "released" | "under_review";

export interface GovernanceRule {
  id: string; name: string; description: string; layer: string;
  condition: string; action: string; status: RuleStatus;
  createdAt: string; triggerCount: number;
}

export interface BlockedProcess {
  id: string; processName: string; layer: string;
  blockedAt: string; reason: string; status: BlockStatus;
  releasedAt: string | null; blockedBy: string;
}

export interface GovernanceState {
  rules: GovernanceRule[]; blockedProcesses: BlockedProcess[];
  loading: boolean; error: string | null;
}

const mockRules: GovernanceRule[] = [
  { id:"gov-01", name:"Bloqueio FFT Invalido", description:"Interrompe pipeline quando FFT tem copia incorreta", layer:"Trusted", condition:"FFT_CHECKSUM != EXPECTED", action:"BLOCK_PIPELINE + NOTIFY", status:"active", createdAt:"2026-01-15", triggerCount:2 },
  { id:"gov-02", name:"Quarentena de Identidade", description:"Quarentena de registros com falha de identidade", layer:"Ingestion", condition:"IDENTITY_VALIDATION_FAIL = TRUE", action:"QUARANTINE + BLOCK", status:"active", createdAt:"2026-02-01", triggerCount:1 },
  { id:"gov-03", name:"Gatilho Score Zerado", description:"Bloqueia envio de scores zerados para parceiros", layer:"Analytics", condition:"SCORE = 0 AND MODEL_ACTIVE = TRUE", action:"BLOCK_DELIVERY + ESCALATE", status:"active", createdAt:"2026-01-10", triggerCount:7 },
  { id:"gov-04", name:"Alerta de Completude", description:"Alerta quando completude abaixo de 90%", layer:"Trusted", condition:"COMPLETENESS_RATE < 0.90", action:"WARN + RETRY", status:"active", createdAt:"2026-02-15", triggerCount:8 },
  { id:"gov-05", name:"Schema Incompativel", description:"Impede envio com schema diferente do esperado", layer:"Trusted", condition:"SCHEMA_MATCH = FALSE", action:"BLOCK + NOTIFY", status:"draft", createdAt:"2026-03-10", triggerCount:0 },
];

const mockBlockedProcesses: BlockedProcess[] = [
  { id:"blk-01", processName:"Pipeline FFT -> Analytics", layer:"Trusted", blockedAt:"2026-03-19T16:30:00Z", reason:"Arquivo FFT com checksum invalido", status:"blocked", releasedAt:null, blockedBy:"gov-01" },
  { id:"blk-02", processName:"Validacao Identidade - Batch 1523", layer:"Ingestion", blockedAt:"2026-03-19T16:00:00Z", reason:"100% de falha na validacao de identidade", status:"under_review", releasedAt:null, blockedBy:"gov-02" },
  { id:"blk-03", processName:"Entrega Scores - Banco Parceiro X", layer:"Analytics", blockedAt:"2026-03-18T14:22:00Z", reason:"Score zerado para 3.2% da base", status:"released", releasedAt:"2026-03-18T16:45:00Z", blockedBy:"gov-03" },
];

export const fetchGovernanceData = createAsyncThunk("governance/fetchData", async () => {
  await new Promise((r) => setTimeout(r, 600));
  return { rules: mockRules, blockedProcesses: mockBlockedProcesses };
});

const governanceSlice = createSlice({
  name: "governance",
  initialState: { rules:[], blockedProcesses:[], loading:false, error:null } as GovernanceState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchGovernanceData.pending, (s) => { s.loading = true; })
     .addCase(fetchGovernanceData.fulfilled, (s, { payload }) => {
       s.loading = false; s.rules = payload.rules; s.blockedProcesses = payload.blockedProcesses;
     })
     .addCase(fetchGovernanceData.rejected, (s, { error }) => {
       s.loading = false; s.error = error.message ?? "Erro Governanca";
     });
  },
});

export default governanceSlice.reducer;
