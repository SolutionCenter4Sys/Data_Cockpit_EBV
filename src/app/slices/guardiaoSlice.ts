import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type BoundaryCheck = "pass" | "fail" | "warning" | "running";
export type IssueType = "fft_copy" | "truncation" | "null_field" | "schema" | "checksum" | "other";
export type BoundaryLayer = "ingestion_to_trusted" | "trusted_to_analytics";

export interface QualityViolation {
  id: string;
  layer: BoundaryLayer;
  issueType: IssueType;
  severity: "critical" | "high" | "medium";
  field?: string;
  affectedRecords: number;
  detectedAt: string;
  description: string;
  status: "open" | "resolved" | "suppressed";
}

export interface BoundaryGate {
  id: string;
  name: string;
  boundary: BoundaryLayer;
  status: BoundaryCheck;
  checksTotal: number;
  checksPassed: number;
  lastRunAt: string;
  activeViolations: number;
}

export interface GuardiaoState {
  gates: BoundaryGate[];
  violations: QualityViolation[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const mockGates: BoundaryGate[] = [
  { id:"gg-01", name:"Validacao FFT na Fronteira", boundary:"ingestion_to_trusted", status:"fail", checksTotal:8, checksPassed:6, lastRunAt:"2026-03-19T18:00:00Z", activeViolations:2 },
  { id:"gg-02", name:"Deteccao de Truncamento", boundary:"ingestion_to_trusted", status:"warning", checksTotal:12, checksPassed:11, lastRunAt:"2026-03-19T18:00:00Z", activeViolations:1 },
  { id:"gg-03", name:"Validacao de Nulos Inesperados", boundary:"ingestion_to_trusted", status:"pass", checksTotal:20, checksPassed:20, lastRunAt:"2026-03-19T17:58:00Z", activeViolations:0 },
  { id:"gg-04", name:"Verificacao de Schema Destino", boundary:"trusted_to_analytics", status:"pass", checksTotal:15, checksPassed:15, lastRunAt:"2026-03-19T17:55:00Z", activeViolations:0 },
  { id:"gg-05", name:"Consistencia de Chaves Primarias", boundary:"trusted_to_analytics", status:"warning", checksTotal:10, checksPassed:9, lastRunAt:"2026-03-19T17:50:00Z", activeViolations:1 },
  { id:"gg-06", name:"Validacao de Checksum Critico", boundary:"ingestion_to_trusted", status:"fail", checksTotal:5, checksPassed:3, lastRunAt:"2026-03-19T16:30:00Z", activeViolations:2 },
];

const mockViolations: QualityViolation[] = [
  { id:"gv-01", layer:"ingestion_to_trusted", issueType:"fft_copy", severity:"critical", field:"arquivo_fft", affectedRecords:12000, detectedAt:"2026-03-19T16:30:00Z", description:"Arquivo FFT com copia incorreta detectada — checksum nao confere com referencia", status:"open" },
  { id:"gv-02", layer:"ingestion_to_trusted", issueType:"checksum", severity:"critical", field:"hash_referencia", affectedRecords:5400, detectedAt:"2026-03-19T16:00:00Z", description:"Checksum de integridade falhou na validacao de identidade", status:"open" },
  { id:"gv-03", layer:"ingestion_to_trusted", issueType:"truncation", severity:"high", field:"nome_logradouro", affectedRecords:1240, detectedAt:"2026-03-19T17:30:00Z", description:"Campo nome_logradouro truncado em 38 caracteres — perda de informacao de endereco", status:"open" },
  { id:"gv-04", layer:"trusted_to_analytics", issueType:"schema", severity:"medium", field:"cod_produto_v2", affectedRecords:340, detectedAt:"2026-03-19T17:50:00Z", description:"Campo novo cod_produto_v2 ausente no schema destino Analytics — versao desatualizada", status:"open" },
  { id:"gv-05", layer:"ingestion_to_trusted", issueType:"null_field", severity:"medium", field:"cpf_titular", affectedRecords:89, detectedAt:"2026-03-19T15:00:00Z", description:"CPF nulo em registros que deveriam ter CPF obrigatorio", status:"resolved" },
];

export const fetchGuardiaoData = createAsyncThunk("guardiao/fetchData", async () => {
  await new Promise((r) => setTimeout(r, 600));
  return { gates: mockGates, violations: mockViolations };
});

const guardiaoSlice = createSlice({
  name: "guardiao",
  initialState: { gates:[], violations:[], loading:false, error:null, lastUpdated:null } as GuardiaoState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchGuardiaoData.pending, (s) => { s.loading = true; })
     .addCase(fetchGuardiaoData.fulfilled, (s, { payload }) => {
       s.loading = false; s.gates = payload.gates; s.violations = payload.violations;
       s.lastUpdated = new Date().toISOString();
     })
     .addCase(fetchGuardiaoData.rejected, (s, { error }) => {
       s.loading = false; s.error = error.message ?? "Erro Guardiao";
     });
  },
});

export default guardiaoSlice.reducer;
