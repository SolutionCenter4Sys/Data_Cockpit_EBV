import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type CaseStatus = "open" | "investigating" | "confirmed" | "closed" | "false_positive";
export type CorrelationType = "temporal" | "causal" | "process" | "data_dependency";

export interface Correlation {
  signalId: string;
  source: string;
  correlationType: CorrelationType;
  strength: number; // 0-100
  description: string;
}

export interface InvestigationCase {
  id: string;
  title: string;
  originSignal: string;
  layer: string;
  severity: "critical" | "high" | "medium" | "low";
  status: CaseStatus;
  openedAt: string;
  closedAt: string | null;
  correlations: Correlation[];
  summary: string;
  affectedProcesses: string[];
  passedToGuru: boolean;
}

export interface DetetivoState {
  cases: InvestigationCase[];
  loading: boolean;
  error: string | null;
  activeCase: string | null;
}

const mockCases: InvestigationCase[] = [
  {
    id:"dc-01", title:"Colapso total da validacao de identidade",
    originSignal:"sig-04", layer:"ingestion", severity:"critical", status:"investigating",
    openedAt:"2026-03-19T16:05:00Z", closedAt:null,
    correlations:[
      { signalId:"sig-02", source:"Validacao E-mail", correlationType:"temporal", strength:87, description:"Degradacao de e-mail e identidade ocorreram no mesmo batch — mesma janela temporal" },
      { signalId:"gv-02", source:"Guardiao — Checksum Identidade", correlationType:"causal", strength:95, description:"Checksum de identidade falhou — causa direta do colapso" },
      { signalId:"am-07", source:"Regra de Quarentena", correlationType:"process", strength:100, description:"Regra de quarentena disparou automaticamente" },
    ],
    summary:"Falha completa (100%) no servico de validacao de identidade. Checksum invalido aponta para corrompimento do arquivo de referencia CPF/RG. Correlacionado com degradacao de e-mail no mesmo ciclo. Hipotese: falha de deploy na madrugada anterior.",
    affectedProcesses:["Ingestion Batch 1523", "Enriquecimento CPF", "Score Cluster B"],
    passedToGuru:true
  },
  {
    id:"dc-02", title:"Arquivo FFT com copia incorreta em Trusted",
    originSignal:"sig-05", layer:"trusted", severity:"critical", status:"confirmed",
    openedAt:"2026-03-19T16:35:00Z", closedAt:null,
    correlations:[
      { signalId:"gv-01", source:"Guardiao — FFT Checksum", correlationType:"causal", strength:100, description:"Guardiao confirmou copia incorreta do arquivo FFT com divergencia de checksum" },
      { signalId:"dc-01", source:"Caso Identidade", correlationType:"data_dependency", strength:62, description:"Pipeline FFT usa dados do batch de identidade — possivel contaminacao" },
    ],
    summary:"Arquivo FFT copiado incorretamente para a camada Trusted. Guardiao detectou divergencia de checksum. Pipeline Trusted a Analytics bloqueado preventivamente. Causa provavel: script de copia executou fora da janela correta.",
    affectedProcesses:["Pipeline FFT Trusted", "Analytics Score Modelo D", "Entrega Banco Parceiro X"],
    passedToGuru:true
  },
  {
    id:"dc-03", title:"Oscilacao anormal no Score Cluster B",
    originSignal:"sig-07", layer:"analytics", severity:"high", status:"open",
    openedAt:"2026-03-19T18:05:00Z", closedAt:null,
    correlations:[
      { signalId:"dc-01", source:"Caso Identidade", correlationType:"data_dependency", strength:78, description:"Score Cluster B usa variaveis de identidade — dado de entrada possivelmente corrompido" },
      { signalId:"sig-04", source:"Validacao Identidade", correlationType:"causal", strength:73, description:"Ausencia de dado de identidade impacta diretamente variaveis do Score B" },
    ],
    summary:"Score Cluster B apresentou desvio de -8.7% em relacao ao baseline. Detetive correlacionou com a falha de identidade (dc-01). Alta probabilidade de causa: modelo recebendo dados incompletos de identidade.",
    affectedProcesses:["Score Model Cluster B", "Entrega parcial Banco Y"],
    passedToGuru:false
  },
  {
    id:"dc-04", title:"Taxa de erro elevada em Validacao de E-mail",
    originSignal:"sig-02", layer:"ingestion", severity:"medium", status:"investigating",
    openedAt:"2026-03-19T17:15:00Z", closedAt:null,
    correlations:[
      { signalId:"sig-04", source:"Identidade", correlationType:"temporal", strength:55, description:"Degradacao paralela sugere problema sistemico no batch" },
    ],
    summary:"Taxa de erro de e-mail subiu para 2.34% (acima do threshold de 1%). Correlacao temporal fraca com falha de identidade. Investigando se proveedor externo de validacao de e-mail esta com instabilidade.",
    affectedProcesses:["Ingestion E-mail Batch"],
    passedToGuru:false
  },
  {
    id:"dc-05", title:"Score Zerado detectado — Modelo Cluster A (resolvido)",
    originSignal:"sig-06", layer:"analytics", severity:"critical", status:"closed",
    openedAt:"2026-03-18T14:00:00Z", closedAt:"2026-03-18T16:45:00Z",
    correlations:[
      { signalId:"am-01", source:"Regra Score Zerado", correlationType:"causal", strength:100, description:"Regra de bloqueio automatico disparou e isolou o modelo" },
    ],
    summary:"Score zerado detectado em Modelo Cluster A para 3.2% da base. Bloqueio automatico ativado. Causa identificada: dado de entrada com formato incorreto apos migracao de schema. Corrigido e reprocessado.",
    affectedProcesses:["Score Model Cluster A"],
    passedToGuru:true
  },
];

export const fetchDetetivoData = createAsyncThunk("detetivo/fetchData", async () => {
  await new Promise((r) => setTimeout(r, 700));
  return mockCases;
});

const detetivoSlice = createSlice({
  name: "detetivo",
  initialState: { cases:[], loading:false, error:null, activeCase:null } as DetetivoState,
  reducers: {
    setActiveCase(state, { payload }) { state.activeCase = payload; },
  },
  extraReducers: (b) => {
    b.addCase(fetchDetetivoData.pending, (s) => { s.loading = true; })
     .addCase(fetchDetetivoData.fulfilled, (s, { payload }) => { s.loading = false; s.cases = payload; })
     .addCase(fetchDetetivoData.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? "Erro Detetive"; });
  },
});

export const { setActiveCase } = detetivoSlice.actions;
export default detetivoSlice.reducer;
