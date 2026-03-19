import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export type Channel = "slack" | "email" | "teams" | "jira" | "pagerduty";
export type NotifStatus = "sent" | "pending" | "failed" | "suppressed";
export type Audience = "data_ops" | "tech_lead" | "manager" | "executive" | "vendor";

export interface Notification {
  id: string;
  alertRef: string;
  title: string;
  message: string;
  audience: Audience[];
  channels: Channel[];
  status: NotifStatus;
  sentAt: string | null;
  assignedTo: string | null;
  aiContextSummary: string;
  priority: "urgent" | "high" | "normal" | "low";
  ticketId: string | null;
}

export interface RoutingRule {
  id: string;
  condition: string;
  audience: Audience;
  channels: Channel[];
  description: string;
  active: boolean;
}

export interface ComunicadorStats {
  sentToday: number;
  suppressed: number;
  avgRoutingTimeSec: number;
  autoAssignedPct: number;
  channelBreakdown: Record<Channel, number>;
}

export interface ComunicadorState {
  notifications: Notification[];
  routingRules: RoutingRule[];
  stats: ComunicadorStats | null;
  loading: boolean;
  error: string | null;
}

const mockNotifications: Notification[] = [
  { id:"cn-01", alertRef:"sa-01", title:"[CRITICO] Colapso validacao de identidade", message:"Falha total no servico de identidade (0% taxa de validacao). Causa provavel: deploy com arquivo corrompido. Detetive investigando. Bloqueio automatico ativo. Aguardando correcao da equipe de infra.", audience:["data_ops","tech_lead","manager"], channels:["slack","pagerduty","jira"], status:"sent", sentAt:"2026-03-19T16:08:00Z", assignedTo:"Equipe Infra + Data Ops", aiContextSummary:"Mensagem contextualizada: causa provavel identificada (deploy 15:45), impacto quantificado (5 modelos afetados), acao sugerida (correcao do arquivo de referencia).", priority:"urgent", ticketId:"JIRA-4521" },
  { id:"cn-02", alertRef:"sa-04", title:"[CRITICO] Score Zero — Anti-Fraude Identidade Sintetica", message:"5.400 predicoes com score zero. Causa: servico de identidade indisponivel. Bloqueio ja ativo. Estimativa de normalizacao: quando identidade for corrigida.", audience:["data_ops","tech_lead"], channels:["slack","jira"], status:"sent", sentAt:"2026-03-19T16:10:00Z", assignedTo:"Data Ops Squad", aiContextSummary:"Notificacao direta ao squad de Data Ops com evidencia de causa-raiz ja identificada pelo Detetive. Evita ruido para outros times.", priority:"urgent", ticketId:"JIRA-4522" },
  { id:"cn-03", alertRef:"sa-02", title:"[ALTO] Drift Score Cluster B — acao necessaria", message:"Score Cluster B com distribuicao 325% acima do threshold de KL-divergence. Dependencia do dado de identidade afetado. Aguardar normalizacao ou executar com fallback.", audience:["tech_lead","manager"], channels:["slack","email"], status:"sent", sentAt:"2026-03-19T18:05:00Z", assignedTo:"Analytics Lead", aiContextSummary:"Mensagem contextualizada com proposta de acao (aguardar ou fallback), correlacao com causa-raiz (identidade), sem necessidade de escalar para executivo ainda.", priority:"high", ticketId:"JIRA-4523" },
  { id:"cn-04", alertRef:"pr-01", title:"[ALTO] Risco de estouro batch — acao preventiva necessaria", message:"Conselheiro prev risco de 78% de estouro na janela 22h-06h. Reagendamento de jobs nao-criticos recomendado antes das 21h.", audience:["data_ops","tech_lead"], channels:["slack","email"], status:"sent", sentAt:"2026-03-19T19:30:00Z", assignedTo:"Batch Operations", aiContextSummary:"Notificacao proativa com 3h de antecedencia. Especifica acao necessaria e deadline. Evita incidente noturno.", priority:"high", ticketId:null },
  { id:"cn-05", alertRef:"sa-06", title:"[INFO] Oscilacao diaria suprimida — Score Cluster D", message:"Variacao de -2.8% suprimida como ruido sazonal esperado (segunda-feira). Nenhuma acao necessaria.", audience:["data_ops"], channels:["slack"], status:"suppressed", sentAt:null, assignedTo:null, aiContextSummary:"Automaticamente suprimido — 89 ocorrencias historicas identicas, 87 confirmadas como falso positivo. Ruido eliminado.", priority:"low", ticketId:null },
  { id:"cn-06", alertRef:"pr-03", title:"[MEDIO] Modelo Score Historico Financeiro — re-treinamento urgente", message:"Tendencia de degradacao confirmada (89% confianca). Re-treinamento necessario nos proximos 2 dias. Auditor AG-07 registrou recomendacao formal.", audience:["tech_lead","manager"], channels:["email","jira"], status:"pending", sentAt:null, assignedTo:null, aiContextSummary:"Notificacao agendada para reuniao diaria. Inclui contexto do Auditor e prazo para acao.", priority:"normal", ticketId:"JIRA-4524" },
];

const mockRules: RoutingRule[] = [
  { id:"rr-01", condition:"severity=critical AND layer=any", audience:"data_ops", channels:["slack","pagerduty"], description:"Alertas criticos vao para Data Ops via Slack e PagerDuty imediatamente", active:true },
  { id:"rr-02", condition:"severity=critical AND type=score_zero", audience:"manager", channels:["email"], description:"Score zero escalado para gerencia via e-mail alem do Data Ops", active:true },
  { id:"rr-03", condition:"confidence < 70 AND severity != critical", audience:"data_ops", channels:["slack"], description:"Alertas de baixa confianca vao apenas para Slack — sem PagerDuty", active:true },
  { id:"rr-04", condition:"type=ai_baseline AND pattern=seasonal", audience:"data_ops", channels:[], description:"Padroes sazonais sao suprimidos automaticamente — sem notificacao", active:true },
  { id:"rr-05", condition:"type=predictive AND horizon <= 12h AND risk=critical", audience:"data_ops", channels:["slack","email"], description:"Predicoes criticas com menos de 12h sao notificadas proativamente", active:true },
];

const mockStats: ComunicadorStats = {
  sentToday:8, suppressed:23, avgRoutingTimeSec:4.2, autoAssignedPct:87,
  channelBreakdown:{ slack:12, email:6, teams:0, jira:8, pagerduty:3 },
};

export const fetchComunicadorData = createAsyncThunk("comunicador/fetch", async () => {
  await new Promise((r) => setTimeout(r, 600));
  return { notifications: mockNotifications, routingRules: mockRules, stats: mockStats };
});

const comunicadorSlice = createSlice({
  name: "comunicador",
  initialState: { notifications:[], routingRules:[], stats:null, loading:false, error:null } as ComunicadorState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchComunicadorData.pending, (s) => { s.loading = true; })
     .addCase(fetchComunicadorData.fulfilled, (s, { payload }) => {
       s.loading = false;
       s.notifications = payload.notifications;
       s.routingRules = payload.routingRules;
       s.stats = payload.stats;
     })
     .addCase(fetchComunicadorData.rejected, (s, { error }) => {
       s.loading = false; s.error = error.message ?? "Erro Comunicador";
     });
  },
});

export default comunicadorSlice.reducer;
