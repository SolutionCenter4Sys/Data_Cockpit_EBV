import { useEffect, useState } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button, useTheme, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, IconButton, Switch, FormControlLabel,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import RuleIcon from "@mui/icons-material/Rule";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HistoryIcon from "@mui/icons-material/History";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchRules, fetchExecutions, createRule, updateRule, deleteRule, toggleRule } from "../../app/slices/ruleEngineSlice";
import type { BusinessRule, RuleCategory, SeverityLevel, DataLayer } from "../../domain/entities";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const CATEGORY_LABELS: Record<RuleCategory, string> = { QUALITY: "Qualidade", ALERT: "Alerta", ROUTING: "Roteamento", TRANSFORMATION: "Transformação", VALIDATION: "Validação" };
const CATEGORY_COLORS: Record<RuleCategory, "primary" | "error" | "info" | "warning" | "success"> = { QUALITY: "primary", ALERT: "error", ROUTING: "info", TRANSFORMATION: "warning", VALIDATION: "success" };

const EMPTY_FORM: Omit<BusinessRule, "id" | "triggerCount" | "lastTriggeredAt" | "createdAt" | "updatedAt"> = {
  name: "", description: "", category: "ALERT", condition: "", action: "", severity: "MEDIUM",
  layer: "ANALYTICS", enabled: true, schedule: "*/5 * * * *", createdBy: "", notifyChannels: [], autoBlocking: false,
};

export default function RuleEnginePage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { rules, executions, loading } = useAppSelector((s) => s.ruleEngine);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [channelInput, setChannelInput] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  useEffect(() => {
    dispatch(fetchRules());
    dispatch(fetchExecutions());
  }, [dispatch]);

  const openCreate = () => { setEditingRule(null); setForm(EMPTY_FORM); setChannelInput(""); setDialogOpen(true); };
  const openEdit = (rule: BusinessRule) => {
    setEditingRule(rule);
    setForm({ name: rule.name, description: rule.description, category: rule.category, condition: rule.condition, action: rule.action, severity: rule.severity, layer: rule.layer, enabled: rule.enabled, schedule: rule.schedule, createdBy: rule.createdBy, notifyChannels: rule.notifyChannels, autoBlocking: rule.autoBlocking });
    setChannelInput(rule.notifyChannels.join(", "));
    setDialogOpen(true);
  };

  const handleSave = () => {
    const channels = channelInput.split(",").map((c) => c.trim()).filter(Boolean);
    const data = { ...form, notifyChannels: channels };
    if (editingRule) {
      dispatch(updateRule({ ...editingRule, ...data }));
    } else {
      dispatch(createRule(data));
    }
    setDialogOpen(false);
  };

  const filtered = filterCategory === "ALL" ? rules : rules.filter((r) => r.category === filterCategory);
  const activeCount = rules.filter((r) => r.enabled).length;
  const triggersToday = executions.filter((e) => e.result === "TRIGGERED").length;
  const errorCount = executions.filter((e) => e.result === "ERROR").length;

  if (loading && rules.length === 0) return <PageSkeleton cards={4} rows={6} />;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <RuleIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>Cadastro de Regras</Typography>
          <Typography variant="body2" color="text.secondary">Motor de regras de negócio com CEP, automação e histórico de execuções</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddCircleOutlineIcon />} onClick={openCreate}>Nova Regra</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Total Regras" value={rules.length} trend="STABLE" trendValue="cadastradas" severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Ativas" value={activeCount} trend="STABLE" trendValue={`${rules.length - activeCount} desativadas`} severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Disparos Recentes" value={triggersToday} trend={triggersToday > 5 ? "DOWN" : "STABLE"} trendValue="execuções" severity={triggersToday > 5 ? "HIGH" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Erros" value={errorCount} trend={errorCount > 0 ? "DOWN" : "STABLE"} trendValue="nas execuções" severity={errorCount > 0 ? "CRITICAL" : "HEALTHY"} />
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" fontWeight={600} sx={{ mr: 1 }}>Filtrar:</Typography>
            <Chip label="Todas" size="small" variant={filterCategory === "ALL" ? "filled" : "outlined"} onClick={() => setFilterCategory("ALL")} />
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <Chip key={k} label={v} size="small" color={CATEGORY_COLORS[k as RuleCategory]}
                variant={filterCategory === k ? "filled" : "outlined"} onClick={() => setFilterCategory(k)} />
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Regras de Negócio</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><Typography variant="caption" fontWeight={600}>Regra</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600}>Categoria</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600}>Camada</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600}>Severidade</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600}>Schedule</Typography></TableCell>
                  <TableCell align="center"><Typography variant="caption" fontWeight={600}>Ativa</Typography></TableCell>
                  <TableCell align="center"><Typography variant="caption" fontWeight={600}>Disparos</Typography></TableCell>
                  <TableCell align="center"><Typography variant="caption" fontWeight={600}>Ações</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((rule) => (
                  <TableRow key={rule.id} hover sx={{ opacity: rule.enabled ? 1 : 0.5 }}>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" fontWeight={600}>{rule.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{rule.description}</Typography>
                      {rule.autoBlocking && <Chip label="Auto-block" size="small" color="error" variant="outlined" sx={{ mt: 0.3, fontSize: "0.55rem", height: 18 }} />}
                    </TableCell>
                    <TableCell><Chip label={CATEGORY_LABELS[rule.category]} size="small" color={CATEGORY_COLORS[rule.category]} variant="outlined" sx={{ fontSize: "0.6rem" }} /></TableCell>
                    <TableCell><Chip label={rule.layer} size="small" variant="outlined" sx={{ fontSize: "0.6rem" }} /></TableCell>
                    <TableCell>
                      <Chip label={rule.severity} size="small"
                        color={rule.severity === "CRITICAL" ? "error" : rule.severity === "HIGH" ? "warning" : rule.severity === "MEDIUM" ? "info" : "default"} sx={{ fontSize: "0.6rem" }} />
                    </TableCell>
                    <TableCell><Typography variant="caption" sx={{ fontFamily: "monospace" }}>{rule.schedule}</Typography></TableCell>
                    <TableCell align="center">
                      <Switch size="small" checked={rule.enabled} onChange={() => dispatch(toggleRule(rule.id))} />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={rule.triggerCount > 5 ? 700 : 400}
                        color={rule.triggerCount > 10 ? "error.main" : "text.primary"}>{rule.triggerCount}x</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => openEdit(rule)}><EditOutlinedIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => dispatch(deleteRule(rule.id))}><DeleteOutlineIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <HistoryIcon fontSize="small" color="action" />
            <Typography variant="subtitle1" fontWeight={600}>Histórico de Execuções</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><Typography variant="caption" fontWeight={600}>Regra</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600}>Resultado</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600}>Registros</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600}>Tempo</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600}>Detalhes</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600}>Execução</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {executions.map((exec) => (
                  <TableRow key={exec.id} hover sx={{
                    bgcolor: exec.result === "ERROR" ? (theme.palette.mode === "light" ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.06)") : "transparent",
                  }}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{exec.ruleName}</Typography></TableCell>
                    <TableCell>
                      <Chip label={exec.result} size="small"
                        color={exec.result === "TRIGGERED" ? "error" : exec.result === "PASSED" ? "success" : "warning"} sx={{ fontWeight: 700, fontSize: "0.6rem" }} />
                    </TableCell>
                    <TableCell><Typography variant="body2">{exec.affectedRecords.toLocaleString()}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{exec.executionTimeMs}ms</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 300 }}><Typography variant="caption" color="text.secondary">{exec.details}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{new Date(exec.executedAt).toLocaleString("pt-BR")}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra de Negócio"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nome" fullWidth size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Descrição" fullWidth size="small" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Categoria</InputLabel>
                  <Select value={form.category} label="Categoria" onChange={(e: SelectChangeEvent) => setForm({ ...form, category: e.target.value as RuleCategory })}>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Camada</InputLabel>
                  <Select value={form.layer} label="Camada" onChange={(e: SelectChangeEvent) => setForm({ ...form, layer: e.target.value as DataLayer })}>
                    <MenuItem value="INGESTION">Ingestão</MenuItem>
                    <MenuItem value="TRUSTED">Trusted</MenuItem>
                    <MenuItem value="ANALYTICS">Analytics</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Severidade</InputLabel>
                  <Select value={form.severity} label="Severidade" onChange={(e: SelectChangeEvent) => setForm({ ...form, severity: e.target.value as SeverityLevel })}>
                    <MenuItem value="CRITICAL">Critical</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="LOW">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField label="Condição" fullWidth multiline rows={3} value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}
              InputProps={{ sx: { fontFamily: "monospace", fontSize: "0.85rem" } }} placeholder="score_credito_pf.score = 0 AND duration > 30min" />
            <TextField label="Ação" fullWidth size="small" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} placeholder="BLOCK envio + NOTIFY squad" />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Schedule (cron)" fullWidth size="small" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Criado por" fullWidth size="small" value={form.createdBy} onChange={(e) => setForm({ ...form, createdBy: e.target.value })} />
              </Grid>
            </Grid>
            <TextField label="Canais de Notificação (separar por vírgula)" fullWidth size="small" value={channelInput} onChange={(e) => setChannelInput(e.target.value)} placeholder="Slack #critical, PagerDuty, Email squad" />
            <FormControlLabel control={<Switch checked={form.autoBlocking} onChange={(e) => setForm({ ...form, autoBlocking: e.target.checked })} />} label="Auto-blocking (bloqueia pipeline automaticamente)" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name || !form.condition}>{editingRule ? "Salvar" : "Criar Regra"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
