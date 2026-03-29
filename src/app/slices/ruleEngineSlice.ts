import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { BusinessRule, RuleExecution } from "../../domain/entities";

interface RuleEngineState {
  rules: BusinessRule[];
  executions: RuleExecution[];
  loading: boolean;
  error: string | null;
}

const mockRules: BusinessRule[] = [
  { id:"br-01", name:"Score Zerado Bloqueio", description:"Bloqueia envio quando score de crédito PF retorna zero por mais de 30min", category:"ALERT", condition:"score_credito_pf.score = 0 AND duration > 30min", action:"BLOCK envio + NOTIFY squad", severity:"CRITICAL", layer:"ANALYTICS", enabled:true, schedule:"*/5 * * * *", triggerCount:7, lastTriggeredAt:"2026-03-29T08:22:00Z", createdBy:"Ana Silva", createdAt:"2026-02-15T10:00:00Z", updatedAt:"2026-03-20T14:00:00Z", notifyChannels:["Slack #critical","PagerDuty"], autoBlocking:true },
  { id:"br-02", name:"Freshness Ingestão", description:"Alerta quando dados de ingestão têm mais de 2h sem atualização", category:"QUALITY", condition:"MAX(ingestion.last_updated) < NOW() - INTERVAL '2h'", action:"NOTIFY + LOG", severity:"HIGH", layer:"INGESTION", enabled:true, schedule:"0 * * * *", triggerCount:15, lastTriggeredAt:"2026-03-29T07:00:00Z", createdBy:"Carlos Mendes", createdAt:"2026-02-20T09:00:00Z", updatedAt:"2026-03-15T11:00:00Z", notifyChannels:["Slack #data-alerts"], autoBlocking:false },
  { id:"br-03", name:"Duplicatas Score Fraude", description:"Detecta registros duplicados na tabela de score de fraude e pausa pipeline", category:"VALIDATION", condition:"COUNT(DISTINCT cpf, data_ref) < COUNT(*) ON score_fraude", action:"PAUSE pipeline + ALERT", severity:"CRITICAL", layer:"ANALYTICS", enabled:true, schedule:"0 8 * * *", triggerCount:3, lastTriggeredAt:"2026-03-29T08:00:00Z", createdBy:"Carlos Mendes", createdAt:"2026-03-01T08:00:00Z", updatedAt:"2026-03-25T16:00:00Z", notifyChannels:["Teams #data-ops","Email squad"], autoBlocking:true },
  { id:"br-04", name:"Roteamento Alerta Legado", description:"Redireciona alertas de fontes legado para squad específica", category:"ROUTING", condition:"source.type = 'ORACLE' AND alert.severity IN ('CRITICAL','HIGH')", action:"ROUTE to squad-legado", severity:"MEDIUM", layer:"INGESTION", enabled:true, schedule:"realtime", triggerCount:22, lastTriggeredAt:"2026-03-28T23:30:00Z", createdBy:"Rafael Costa", createdAt:"2026-02-10T14:00:00Z", updatedAt:"2026-03-10T10:00:00Z", notifyChannels:["Slack #legado-ops"], autoBlocking:false },
  { id:"br-05", name:"Transformação Encoding", description:"Aplica correção de encoding UTF-8 para dados migrados do legado Oracle", category:"TRANSFORMATION", condition:"source = 'Oracle Legado' AND field CONTAINS '\\?'", action:"APPLY encoding_fix_utf8", severity:"LOW", layer:"TRUSTED", enabled:true, schedule:"0 2 * * *", triggerCount:45, lastTriggeredAt:"2026-03-29T02:00:00Z", createdBy:"Rafael Costa", createdAt:"2026-01-20T10:00:00Z", updatedAt:"2026-03-05T09:00:00Z", notifyChannels:["Log"], autoBlocking:false },
  { id:"br-06", name:"Volume Mínimo Kafka", description:"Alerta se o stream de eventos Kafka cair abaixo de 100 eventos/min", category:"ALERT", condition:"kafka.events_per_minute < 100", action:"ESCALATE after 5min", severity:"HIGH", layer:"INGESTION", enabled:false, schedule:"*/1 * * * *", triggerCount:2, lastTriggeredAt:"2026-03-15T22:00:00Z", createdBy:"Lucia Ferreira", createdAt:"2026-03-10T16:00:00Z", updatedAt:"2026-03-28T12:00:00Z", notifyChannels:["PagerDuty","Slack #critical"], autoBlocking:false },
];

const mockExecutions: RuleExecution[] = [
  { id:"re-01", ruleId:"br-01", ruleName:"Score Zerado Bloqueio", executedAt:"2026-03-29T08:22:00Z", result:"TRIGGERED", affectedRecords:342, executionTimeMs:156, details:"Score zerado detectado em 342 registros PF. Pipeline bloqueado." },
  { id:"re-02", ruleId:"br-02", ruleName:"Freshness Ingestão", executedAt:"2026-03-29T07:00:00Z", result:"TRIGGERED", affectedRecords:0, executionTimeMs:89, details:"Tabela transacoes não atualizada há 2h15min. Alerta enviado." },
  { id:"re-03", ruleId:"br-03", ruleName:"Duplicatas Score Fraude", executedAt:"2026-03-29T08:00:00Z", result:"TRIGGERED", affectedRecords:18, executionTimeMs:2340, details:"18 registros duplicados encontrados (cpf+data_ref). Pipeline pausado." },
  { id:"re-04", ruleId:"br-04", ruleName:"Roteamento Alerta Legado", executedAt:"2026-03-28T23:30:00Z", result:"TRIGGERED", affectedRecords:1, executionTimeMs:45, details:"Alerta CRITICAL roteado para squad-legado via Slack." },
  { id:"re-05", ruleId:"br-05", ruleName:"Transformação Encoding", executedAt:"2026-03-29T02:00:00Z", result:"PASSED", affectedRecords:12450, executionTimeMs:8920, details:"12.450 registros processados, 234 com encoding corrigido." },
  { id:"re-06", ruleId:"br-01", ruleName:"Score Zerado Bloqueio", executedAt:"2026-03-29T08:17:00Z", result:"PASSED", affectedRecords:0, executionTimeMs:132, details:"Nenhum score zerado detectado nesta execução." },
  { id:"re-07", ruleId:"br-02", ruleName:"Freshness Ingestão", executedAt:"2026-03-29T06:00:00Z", result:"PASSED", affectedRecords:0, executionTimeMs:67, details:"Todas as fontes atualizadas dentro do SLA." },
  { id:"re-08", ruleId:"br-06", ruleName:"Volume Mínimo Kafka", executedAt:"2026-03-15T22:00:00Z", result:"ERROR", affectedRecords:0, executionTimeMs:5023, details:"Timeout ao conectar com broker Kafka. Regra desativada após incidente." },
];

export const fetchRules = createAsyncThunk("ruleEngine/fetchRules", async () => {
  await new Promise((r) => setTimeout(r, 500));
  return mockRules;
});

export const fetchExecutions = createAsyncThunk("ruleEngine/fetchExecutions", async () => {
  await new Promise((r) => setTimeout(r, 400));
  return mockExecutions;
});

let ruleCounter = 10;

const ruleEngineSlice = createSlice({
  name: "ruleEngine",
  initialState: { rules: [], executions: [], loading: false, error: null } as RuleEngineState,
  reducers: {
    createRule(state, { payload }: PayloadAction<Omit<BusinessRule, "id" | "triggerCount" | "lastTriggeredAt" | "createdAt" | "updatedAt">>) {
      ruleCounter++;
      const now = new Date().toISOString();
      state.rules.push({ ...payload, id: `br-${ruleCounter}`, triggerCount: 0, lastTriggeredAt: null, createdAt: now, updatedAt: now });
    },
    updateRule(state, { payload }: PayloadAction<BusinessRule>) {
      const idx = state.rules.findIndex((r) => r.id === payload.id);
      if (idx >= 0) state.rules[idx] = { ...payload, updatedAt: new Date().toISOString() };
    },
    deleteRule(state, { payload }: PayloadAction<string>) {
      state.rules = state.rules.filter((r) => r.id !== payload);
    },
    toggleRule(state, { payload }: PayloadAction<string>) {
      const r = state.rules.find((r) => r.id === payload);
      if (r) r.enabled = !r.enabled;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchRules.pending, (s) => { s.loading = true; })
     .addCase(fetchRules.fulfilled, (s, { payload }) => { s.loading = false; s.rules = payload; })
     .addCase(fetchRules.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? "Erro"; })
     .addCase(fetchExecutions.fulfilled, (s, { payload }) => { s.executions = payload; });
  },
});

export const { createRule, updateRule, deleteRule, toggleRule } = ruleEngineSlice.actions;
export default ruleEngineSlice.reducer;
