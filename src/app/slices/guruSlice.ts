import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type AnalysisStatus = "complete" | "in_progress" | "pending_data";
export type TrendType = "worsening" | "improving" | "stable" | "critical";

export interface RootCauseAnalysis {
  id: string;
  caseId: string;
  caseTitle: string;
  layer: string;
  severity: "critical" | "high" | "medium";
  status: AnalysisStatus;
  analyzedAt: string;
  rootCause: string;
  contributingFactors: string[];
  historicalPattern: string;
  recommendation: string;
  preventionMeasures: string[];
  feedbackToSentinela: string;
  confidence: number; // 0-100
}

export interface TrendInsight {
  id: string;
  title: string;
  description: string;
  trend: TrendType;
  layer: string;
  horizon: "24h" | "7d" | "30d";
  confidence: number;
  dataPoints: number;
}

export interface GuruState {
  analyses: RootCauseAnalysis[];
  trends: TrendInsight[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const mockAnalyses: RootCauseAnalysis[] = [
  {
    id:"ga-01", caseId:"dc-01", caseTitle:"Colapso validacao de identidade",
    layer:"ingestion", severity:"critical", status:"complete",
    analyzedAt:"2026-03-19T18:30:00Z",
    rootCause:"Deploy incorreto do arquivo de referencia CPF/RG realizado em 15:45 do dia 19/03. Script de copia executou sem validacao de checksum, sobrescrevendo arquivo valido com versao corrompida do servidor de homologacao.",
    contributingFactors:[
      "Ausencia de validacao automatica pos-deploy do arquivo de referencia",
      "Script de copia sem verificacao de checksum",
      "Janela de batch iniciou antes da validacao manual ser realizada",
      "Monitoramento reativo — problema detectado apos 15 minutos de execucao",
    ],
    historicalPattern:"Este e o 3o incidente similar nos ultimos 6 meses. Padroes anteriores: 2025-09-12 (FFT incorreto) e 2025-11-28 (schema desatualizado). Padrao comum: deploys sem validacao em horario de pico de batch.",
    recommendation:"Implementar checklist obrigatorio pos-deploy com validacao de checksum automatizada. Bloquear inicio de batch ate aprovacao do Guardiao de Qualidade.",
    preventionMeasures:[
      "Checksum obrigatorio antes de qualquer copia de arquivo de referencia",
      "Lock de inicio de batch ate aprovacao automatica do Guardiao",
      "Janela de deploy proibida entre 15h-20h (horario de batch critico)",
    ],
    feedbackToSentinela:"Novo padrao registrado: correlacao entre deploy 15h-20h e falha em arquivo de referencia. Sentinela deve elevar alertas de deploy nesta janela.",
    confidence:94,
  },
  {
    id:"ga-02", caseId:"dc-02", caseTitle:"Arquivo FFT com copia incorreta",
    layer:"trusted", severity:"critical", status:"complete",
    analyzedAt:"2026-03-19T18:45:00Z",
    rootCause:"O mesmo deploy incorreto de 15:45 do caso dc-01 afetou o arquivo FFT. O script de sincronizacao automatica copiou o arquivo FFT de homologacao para producao sem verificar a fonte correta.",
    contributingFactors:[
      "Script de sincronizacao sem discriminacao entre ambientes homologacao e producao",
      "FFT depende do arquivo de referencia de identidade — falha em cascata",
      "Quality Gate do Guardiao bloqueou a propagacao para Analytics — funcionou como esperado",
    ],
    historicalPattern:"Segundo caso de FFT incorreto no ano. Causa raiz identica ao de 2025-09-12. Evidencia de lacuna no processo de deploy.",
    recommendation:"Separar rigorosamente scripts de sincronizacao por ambiente. Adicionar variavel de ambiente obrigatoria com validacao antes de execucao.",
    preventionMeasures:[
      "Variavel ENV=producao obrigatoria e validada antes de qualquer sincronizacao",
      "Checklist de deploy com aprovacao de 2 pessoas em mudancas de arquivo critico",
    ],
    feedbackToSentinela:"Correlacao forte entre colapso de identidade (dc-01) e falha FFT (dc-02). Monitorar conjuntamente no proximo ciclo.",
    confidence:97,
  },
  {
    id:"ga-03", caseId:"dc-03", caseTitle:"Oscilacao Score Cluster B",
    layer:"analytics", severity:"high", status:"in_progress",
    analyzedAt:"2026-03-19T19:00:00Z",
    rootCause:"Em analise — hipotese principal: Score Cluster B usa 6 variaveis de identidade que estao ausentes ou corrompidas devido ao dc-01. O modelo recebeu dados incompletos e produziu scores com desvio de -8.7%.",
    contributingFactors:[
      "Dependencia de variaveis de identidade no Score Cluster B",
      "Ausencia de fallback para dados faltantes de identidade",
      "Propagacao do impacto da falha de ingestion ate o modelo analitico",
    ],
    historicalPattern:"Historico indica que desvios acima de 5% no Score Cluster B sempre tiveram origem em problemas de dado de entrada — nenhum caso de falha do modelo em si nos ultimos 12 meses.",
    recommendation:"Implementar fallback para valores de identidade ausentes. Considerar score neutro quando dado critico de entrada estiver indisponivel.",
    preventionMeasures:[
      "Fallback para variaveis criticas com valor neutro em caso de ausencia",
      "Alerta preventivo quando fonte de dado de modelo critico falha",
    ],
    feedbackToSentinela:"Registrar dependencia Score Cluster B x Validacao Identidade no mapa de dependencias para monitoramento correlacionado.",
    confidence:76,
  },
];

const mockTrends: TrendInsight[] = [
  { id:"gt-01", title:"Degradacao acelerada dos modelos de score", description:"Taxa de degradacao de modelos acima do historico: 156 modelos com drift detectado vs. media de 82 por periodo similar. Correlacionado com mudancas no SCR de fevereiro/2026.", trend:"worsening", layer:"analytics", horizon:"30d", confidence:89, dataPoints:1247 },
  { id:"gt-02", title:"Aumento de falhas em batch na janela 15h-19h", description:"Incidentes criticos nos ultimos 3 meses concentram 78% dos casos nesta janela horaria. Padroes de deploy e inicio de processamento precisam ser revisados.", trend:"worsening", layer:"ingestion", horizon:"30d", confidence:92, dataPoints:340 },
  { id:"gt-03", title:"Taxa de erro de ingestion em queda pos-correcao", description:"Apos correcao de identidade esperada para hoje 20h, projecao e de retorno ao baseline de 0.3% de erro ate amanha 06h.", trend:"improving", layer:"ingestion", horizon:"24h", confidence:81, dataPoints:48 },
  { id:"gt-04", title:"Score Cluster A estavel — historico positivo", description:"Score Cluster A manteve 92% de acuracia nos ultimos 30 dias. Sem drift detectado. Modelo candidato a reducao de frequencia de auditoria.", trend:"stable", layer:"analytics", horizon:"30d", confidence:95, dataPoints:1440 },
  { id:"gt-05", title:"Risco de estouro de janela batch amanha", description:"Volume de dados cresceu 12% no ultimo mes. Com o incidente de hoje, ha backlog acumulado. Previsao de estouro da janela batch de 22h-06h amanha com 67% de probabilidade.", trend:"critical", layer:"batch", horizon:"24h", confidence:67, dataPoints:90 },
];

export const fetchGuruData = createAsyncThunk("guru/fetchData", async () => {
  await new Promise((r) => setTimeout(r, 800));
  return { analyses: mockAnalyses, trends: mockTrends };
});

const guruSlice = createSlice({
  name: "guru",
  initialState: { analyses:[], trends:[], loading:false, error:null, lastUpdated:null } as GuruState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchGuruData.pending, (s) => { s.loading = true; })
     .addCase(fetchGuruData.fulfilled, (s, { payload }) => {
       s.loading = false; s.analyses = payload.analyses; s.trends = payload.trends;
       s.lastUpdated = new Date().toISOString();
     })
     .addCase(fetchGuruData.rejected, (s, { error }) => {
       s.loading = false; s.error = error.message ?? "Erro Guru";
     });
  },
});

export default guruSlice.reducer;
