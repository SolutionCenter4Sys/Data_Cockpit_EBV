import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import {
  Box, Grid, Typography, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, useTheme, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, IconButton, Switch,
  Stack, FormControlLabel,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import BlockIcon from "@mui/icons-material/Block";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ReplayIcon from "@mui/icons-material/Replay";
import EscalatorWarningIcon from "@mui/icons-material/EscalatorWarning";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchActionRules, createActionRule, updateActionRule, deleteActionRule, toggleActionRule } from "../../app/slices/actionMatrixSlice";
import type { ActionType, TriggerStatus, ActionRule, AnomalyLayer } from "../../app/slices/actionMatrixSlice";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const ACTION_ICONS: Record<ActionType, ReactElement> = {
  block: <BlockIcon fontSize="small" />,
  notify: <NotificationsIcon fontSize="small" />,
  retry: <ReplayIcon fontSize="small" />,
  escalate: <EscalatorWarningIcon fontSize="small" />,
  auto_fix: <AutoFixHighIcon fontSize="small" />,
};

const ACTION_COLOR: Record<ActionType, "error" | "info" | "warning" | "primary" | "success"> = {
  block: "error", notify: "info", retry: "warning", escalate: "primary", auto_fix: "success",
};

const EMPTY_FORM: Omit<ActionRule, "id" | "triggerCount" | "lastTriggeredAt"> = {
  anomalyType: "", layer: "analytics", severity: "high", action: "notify",
  actionDescription: "", notifyChannel: "", status: "active", autoBlocking: false,
};

function StatusBadge({ status }: { status: TriggerStatus }) {
  if (status === "triggered") return <Chip label="DISPARADO" color="error" size="small" sx={{ fontWeight:700 }} />;
  if (status === "inactive") return <Chip label="Inativo" size="small" />;
  return <Chip label="Ativo" color="success" size="small" variant="outlined" />;
}

export default function ActionMatrixPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { rules, loading } = useAppSelector((s) => s.actionMatrix);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ActionRule | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { dispatch(fetchActionRules()); }, [dispatch]);

  const openCreate = () => { setEditingRule(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (rule: ActionRule) => {
    setEditingRule(rule);
    setForm({
      anomalyType: rule.anomalyType, layer: rule.layer, severity: rule.severity, action: rule.action,
      actionDescription: rule.actionDescription, notifyChannel: rule.notifyChannel, status: rule.status, autoBlocking: rule.autoBlocking,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingRule) {
      dispatch(updateActionRule({ ...editingRule, ...form }));
    } else {
      dispatch(createActionRule(form));
    }
    setDialogOpen(false);
  };

  if (loading && rules.length === 0) return <PageSkeleton />;

  const triggered = rules.filter(r => r.status === "triggered").length;
  const withBlock = rules.filter(r => r.autoBlocking).length;
  const totalTriggers = rules.reduce((a, r) => a + r.triggerCount, 0);

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <PlaylistAddCheckIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>Matriz de Acionamento</Typography>
          <Typography variant="body2" color="text.secondary">Regras de ação automática por tipo de anomalia e camada</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddCircleOutlineIcon />} onClick={openCreate}>Nova Regra</Button>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Regras Ativas" value={rules.filter(r => r.status !== "inactive").length} trend="STABLE" trendValue={`${rules.length} total`} severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Disparadas Agora" value={triggered} trend={triggered > 0 ? "DOWN" : "STABLE"} trendValue={`${triggered} em ação`} severity={triggered > 0 ? "CRITICAL" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Com Bloqueio Auto" value={withBlock} trend="STABLE" trendValue={`${withBlock} regras`} severity="HIGH" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Total de Disparos" value={totalTriggers} trend="UP" trendValue="histórico" severity="MEDIUM" />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius:2, overflow:"hidden" }}>
        <Box sx={{ p:2, borderBottom:`1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Regras de Acionamento</Typography>
          <Typography variant="caption" color="text.secondary">Anomalia detectada {'=>'} Ação automática {'=>'} Notificação</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="caption" fontWeight={600}>Anomalia</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Camada</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Severidade</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Ação</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Canal</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Status</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Disparos</Typography></TableCell>
                <TableCell align="center"><Typography variant="caption" fontWeight={600}>Gerenciar</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id} hover sx={{
                  bgcolor: rule.status === "triggered" ? (theme.palette.mode === "light" ? "rgba(227,24,55,0.04)" : "rgba(227,24,55,0.08)") : "transparent",
                  opacity: rule.status === "inactive" ? 0.5 : 1,
                }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{rule.anomalyType}</Typography>
                    <Typography variant="caption" color="text.secondary">{rule.actionDescription}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={rule.layer} size="small" variant="outlined"
                      color={rule.layer === "analytics" ? "primary" : rule.layer === "trusted" ? "secondary" : "default"} />
                  </TableCell>
                  <TableCell>
                    <Chip label={rule.severity.toUpperCase()} size="small"
                      color={rule.severity === "critical" ? "error" : rule.severity === "high" ? "warning" : rule.severity === "medium" ? "info" : "default"} />
                  </TableCell>
                  <TableCell>
                    <Chip icon={ACTION_ICONS[rule.action]} label={rule.action.replace("_"," ")}
                      size="small" color={ACTION_COLOR[rule.action]} variant="outlined" />
                    {rule.autoBlocking && (
                      <Chip label="auto-block" size="small" color="error" variant="outlined" sx={{ ml:0.5, fontSize:"0.6rem", height:18 }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{rule.notifyChannel}</Typography>
                  </TableCell>
                  <TableCell><StatusBadge status={rule.status} /></TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={rule.triggerCount > 5 ? 600 : 400}
                      color={rule.triggerCount > 5 ? "warning.main" : "text.primary"}>
                      {rule.triggerCount}x
                    </Typography>
                    {rule.lastTriggeredAt && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(rule.lastTriggeredAt).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton size="small" onClick={() => openEdit(rule)}><EditOutlinedIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => dispatch(toggleActionRule(rule.id))}>
                        <Switch size="small" checked={rule.status !== "inactive"} sx={{ pointerEvents: "none" }} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => dispatch(deleteActionRule(rule.id))}><DeleteOutlineIcon fontSize="small" /></IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRule ? "Editar Regra de Acionamento" : "Nova Regra de Acionamento"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Tipo de Anomalia" fullWidth size="small" value={form.anomalyType} onChange={(e) => setForm({ ...form, anomalyType: e.target.value })} placeholder="Ex: Score Zerado, Batch com Atraso > 30min" />
            <TextField label="Descrição da Ação" fullWidth size="small" multiline rows={2} value={form.actionDescription} onChange={(e) => setForm({ ...form, actionDescription: e.target.value })} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Camada</InputLabel>
                  <Select value={form.layer} label="Camada" onChange={(e: SelectChangeEvent) => setForm({ ...form, layer: e.target.value as AnomalyLayer })}>
                    <MenuItem value="ingestion">Ingestão</MenuItem>
                    <MenuItem value="trusted">Trusted</MenuItem>
                    <MenuItem value="analytics">Analytics</MenuItem>
                    <MenuItem value="batch">Batch</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Severidade</InputLabel>
                  <Select value={form.severity} label="Severidade" onChange={(e: SelectChangeEvent) => setForm({ ...form, severity: e.target.value as ActionRule["severity"] })}>
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <FormControl fullWidth size="small">
              <InputLabel>Ação</InputLabel>
              <Select value={form.action} label="Ação" onChange={(e: SelectChangeEvent) => setForm({ ...form, action: e.target.value as ActionType })}>
                <MenuItem value="notify">Notificar</MenuItem>
                <MenuItem value="block">Bloquear</MenuItem>
                <MenuItem value="retry">Retry</MenuItem>
                <MenuItem value="escalate">Escalar</MenuItem>
                <MenuItem value="auto_fix">Auto-fix</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Canal de Notificação" fullWidth size="small" value={form.notifyChannel} onChange={(e) => setForm({ ...form, notifyChannel: e.target.value })} placeholder="Slack #critical, PagerDuty, Email" />
            <FormControlLabel control={<Switch checked={form.autoBlocking} onChange={(e) => setForm({ ...form, autoBlocking: e.target.checked })} />} label="Auto-blocking (bloqueia pipeline automaticamente)" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.anomalyType}>{editingRule ? "Salvar" : "Criar"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
