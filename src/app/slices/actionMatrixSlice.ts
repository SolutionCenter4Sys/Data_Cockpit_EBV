import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AnomalyLayer = "ingestion" | "trusted" | "analytics" | "batch";
export type ActionType = "notify" | "block" | "retry" | "escalate" | "auto_fix";
export type TriggerStatus = "active" | "triggered" | "inactive";

export interface ActionRule {
  id: string; anomalyType: string; layer: AnomalyLayer;
  severity: "critical" | "high" | "medium" | "low";
  action: ActionType; actionDescription: string; notifyChannel: string;
  triggerCount: number; lastTriggeredAt: string | null;
  status: TriggerStatus; autoBlocking: boolean;
}

export interface ActionMatrixState {
  rules: ActionRule[]; loading: boolean; error: string | null;
}

let ruleCounter = 20;

const mockRules: ActionRule[] = [
  { id:"am-01", anomalyType:"Score Zerado", layer:"analytics", severity:"critical", action:"block", actionDescription:"Bloquear envio de score e acionar squad de dados", notifyChannel:"Slack #critical + Email Squad", triggerCount:7, lastTriggeredAt:"2026-03-19T14:22:00Z", status:"active", autoBlocking:true },
  { id:"am-02", anomalyType:"Arquivo FFT Invalido", layer:"trusted", severity:"critical", action:"block", actionDescription:"Pausar pipeline Trusted->Analytics e notificar lead", notifyChannel:"Teams #data-ops + PagerDuty", triggerCount:2, lastTriggeredAt:"2026-03-19T16:30:00Z", status:"triggered", autoBlocking:true },
  { id:"am-03", anomalyType:"Taxa de Erro Ingestion > 5%", layer:"ingestion", severity:"high", action:"escalate", actionDescription:"Escalar apos 2 retentativas automaticas", notifyChannel:"Slack #data-alerts", triggerCount:12, lastTriggeredAt:"2026-03-19T17:10:00Z", status:"active", autoBlocking:false },
  { id:"am-04", anomalyType:"Batch com Atraso > 30min", layer:"batch", severity:"high", action:"notify", actionDescription:"Notificar responsavel e monitorar continuidade", notifyChannel:"Email Automatico + Badge", triggerCount:4, lastTriggeredAt:"2026-03-18T23:45:00Z", status:"active", autoBlocking:false },
  { id:"am-05", anomalyType:"Oscilacao de Score > 15%", layer:"analytics", severity:"high", action:"notify", actionDescription:"Gerar alerta e iniciar analise manual", notifyChannel:"Slack #score-monitor", triggerCount:3, lastTriggeredAt:"2026-03-19T10:00:00Z", status:"active", autoBlocking:false },
  { id:"am-06", anomalyType:"Campo Obrigatorio Nulo > 10%", layer:"trusted", severity:"medium", action:"retry", actionDescription:"Reprocessar source afetado (max 3 tentativas)", notifyChannel:"Log + Dashboard", triggerCount:8, lastTriggeredAt:"2026-03-19T15:30:00Z", status:"active", autoBlocking:false },
  { id:"am-07", anomalyType:"Falha Validacao Identidade", layer:"ingestion", severity:"critical", action:"block", actionDescription:"Quarentena e revisao manual obrigatoria", notifyChannel:"PagerDuty + Slack #critical", triggerCount:1, lastTriggeredAt:"2026-03-19T16:00:00Z", status:"triggered", autoBlocking:true },
];

export const fetchActionRules = createAsyncThunk("actionMatrix/fetchRules", async () => {
  await new Promise((r) => setTimeout(r, 500));
  return mockRules;
});

const actionMatrixSlice = createSlice({
  name: "actionMatrix",
  initialState: { rules:[], loading:false, error:null } as ActionMatrixState,
  reducers: {
    createActionRule(state, { payload }: PayloadAction<Omit<ActionRule, "id" | "triggerCount" | "lastTriggeredAt">>) {
      ruleCounter++;
      state.rules.push({ ...payload, id: `am-${ruleCounter}`, triggerCount: 0, lastTriggeredAt: null });
    },
    updateActionRule(state, { payload }: PayloadAction<ActionRule>) {
      const idx = state.rules.findIndex((r) => r.id === payload.id);
      if (idx >= 0) state.rules[idx] = payload;
    },
    deleteActionRule(state, { payload }: PayloadAction<string>) {
      state.rules = state.rules.filter((r) => r.id !== payload);
    },
    toggleActionRule(state, { payload }: PayloadAction<string>) {
      const r = state.rules.find((r) => r.id === payload);
      if (r) r.status = r.status === "inactive" ? "active" : "inactive";
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchActionRules.pending, (s) => { s.loading = true; })
     .addCase(fetchActionRules.fulfilled, (s, { payload }) => { s.loading = false; s.rules = payload; })
     .addCase(fetchActionRules.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? "Erro Matriz"; });
  },
});

export const { createActionRule, updateActionRule, deleteActionRule, toggleActionRule } = actionMatrixSlice.actions;
export default actionMatrixSlice.reducer;
