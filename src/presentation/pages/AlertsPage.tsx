import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert as MuiAlert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Tooltip,
  useTheme,
  IconButton,
  Stack,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FlagCircleOutlinedIcon from '@mui/icons-material/FlagCircleOutlined';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchAlerts, fetchAlertRules, acknowledgeAlert, resolveAlert } from '../../app/slices/alertSlice';
import SeverityChip from '../components/SeverityChip';
import PageSkeleton from '../components/PageSkeleton';
import type { Alert, AlertRule, DataLayer, SeverityLevel } from '../../domain/entities';

const STATUS_TABS = ['Todos', 'Abertos', 'Reconhecidos', 'Resolvidos'];
const STATUS_MAP: Record<number, Alert['status'] | undefined> = {
  0: undefined, 1: 'OPEN', 2: 'ACKNOWLEDGED', 3: 'RESOLVED',
};
const LAYER_LABELS: Record<string, string> = {
  INGESTION: 'Ingestão', TRUSTED: 'Trusted', ANALYTICS: 'Analytics',
};

const SEVERITY_PRIORITY: Record<SeverityLevel, number> = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  HEALTHY: 1,
};

const ESCALATION_SLA_MINUTES: Record<SeverityLevel, number> = {
  CRITICAL: 5,
  HIGH: 15,
  MEDIUM: 60,
  LOW: 120,
  HEALTHY: 180,
};

interface RuleFormState {
  id: string;
  name: string;
  metric: string;
  operator: string;
  threshold: number;
  severity: SeverityLevel;
  layer: DataLayer;
  condition: string;
  enabled: boolean;
  channel: string;
  mention: string;
  rateLimitPerHour: number;
  escalationMinutes: number;
  triggerCount: number;
}

interface GroupedIncident {
  id: string;
  affectedProcess: string;
  triggerType: Alert['triggerType'];
  alerts: Alert[];
  highestSeverity: SeverityLevel;
}

interface EscalationView {
  alertId: string;
  minutesOpen: number;
  level: 0 | 1 | 2;
  target: string;
}

const createRuleFromAlertRule = (rule: AlertRule): RuleFormState => ({
  id: rule.id,
  name: rule.name,
  metric: 'score_zerado',
  operator: '>',
  threshold: rule.threshold,
  severity: rule.severity,
  layer: rule.layer,
  condition: rule.condition,
  enabled: rule.enabled,
  channel: 'canal-dados-monitoramento',
  mention: '@responsavel-operacao',
  rateLimitPerHour: 6,
  escalationMinutes: ESCALATION_SLA_MINUTES[rule.severity],
  triggerCount: rule.triggerCount,
});

const createEmptyRule = (): RuleFormState => ({
  id: '',
  name: '',
  metric: 'score_zerado',
  operator: '>',
  threshold: 2,
  severity: 'HIGH',
  layer: 'ANALYTICS',
  condition: 'scoreZeroPercent > 2',
  enabled: true,
  channel: 'canal-dados-monitoramento',
  mention: '@responsavel-operacao',
  rateLimitPerHour: 6,
  escalationMinutes: 15,
  triggerCount: 0,
});

function AlertRow({
  alert,
  escalation,
  onNotify,
}: {
  alert: Alert;
  escalation?: EscalationView;
  onNotify: (targetAlert: Alert) => void;
}) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const actionLoading = useAppSelector((s) => s.alerts.actionLoading);
  const isLoading = actionLoading === alert.id;

  const statusColor: Record<Alert['status'], string> = {
    OPEN: theme.palette.error.main,
    ACKNOWLEDGED: theme.palette.warning.main,
    RESOLVED: theme.palette.success.main,
  };
  const statusLabel: Record<Alert['status'], string> = {
    OPEN: 'Aberto', ACKNOWLEDGED: 'Reconhecido', RESOLVED: 'Resolvido',
  };

  const chipBg = isLight ? 'rgba(0,47,108,0.05)' : 'rgba(255,255,255,0.06)';

  return (
    <TableRow>
      <TableCell sx={{ minWidth: 130 }}><SeverityChip severity={alert.severity} /></TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>{alert.title}</Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{alert.description}</Typography>
      </TableCell>
      <TableCell>
        <Chip label={LAYER_LABELS[alert.layer]} size="small"
          sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary, backgroundColor: chipBg }} />
      </TableCell>
      <TableCell>
        <Chip label={statusLabel[alert.status]} size="small"
          sx={{ fontSize: '0.65rem', color: statusColor[alert.status],
            backgroundColor: `${statusColor[alert.status]}15` }} />
        {escalation && escalation.level > 0 && (
          <Chip
            icon={<FlagCircleOutlinedIcon />}
            label={`Escalonado L${escalation.level}`}
            size="small"
            sx={{
              ml: 1,
              mt: 0.6,
              fontSize: '0.65rem',
              color: theme.palette.error.main,
              backgroundColor: `${theme.palette.error.main}14`,
            }}
          />
        )}
      </TableCell>
      <TableCell>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          {new Date(alert.triggeredAt).toLocaleString('pt-BR')}
        </Typography>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {alert.status === 'OPEN' && (
            <Tooltip title="Reconhecer alerta">
              <span>
                <Button size="small" variant="outlined"
                  startIcon={isLoading ? <CircularProgress size={12} /> : <VisibilityIcon fontSize="small" />}
                  disabled={isLoading}
                  onClick={() => dispatch(acknowledgeAlert(alert.id))}
                  sx={{ fontSize: '0.7rem', borderColor: theme.palette.warning.main,
                    color: theme.palette.warning.main,
                    '&:hover': { borderColor: theme.palette.warning.main,
                      backgroundColor: `${theme.palette.warning.main}15` } }}>
                  Reconhecer
                </Button>
              </span>
            </Tooltip>
          )}
          {(alert.status === 'OPEN' || alert.status === 'ACKNOWLEDGED') && (
            <Tooltip title="Resolver alerta">
              <span>
                <Button size="small" variant="outlined"
                  startIcon={isLoading ? <CircularProgress size={12} /> : <CheckCircleOutlineIcon fontSize="small" />}
                  disabled={isLoading}
                  onClick={() => dispatch(resolveAlert(alert.id))}
                  sx={{ fontSize: '0.7rem', borderColor: theme.palette.success.main,
                    color: theme.palette.success.main,
                    '&:hover': { borderColor: theme.palette.success.main,
                      backgroundColor: `${theme.palette.success.main}15` } }}>
                  Resolver
                </Button>
              </span>
            </Tooltip>
          )}
          <Tooltip title="Enviar para mensageria interna">
            <span>
              <IconButton
                size="small"
                onClick={() => onNotify(alert)}
                sx={{
                  color: theme.palette.info.main,
                  border: `1px solid ${theme.palette.info.main}55`,
                  borderRadius: 1,
                }}
                aria-label={`Notificar alerta ${alert.id}`}
              >
                <NotificationsActiveIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
}

export default function AlertsPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { alerts, rules, loading } = useAppSelector((s) => s.alerts);
  const [tab, setTab] = useState(0);
  const [rulesState, setRulesState] = useState<RuleFormState[]>([]);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [ruleDraft, setRuleDraft] = useState<RuleFormState>(createEmptyRule());
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [notificationLog, setNotificationLog] = useState<string[]>([]);

  useEffect(() => {
    dispatch(fetchAlerts());
    dispatch(fetchAlertRules());
  }, [dispatch]);

  useEffect(() => {
    setRulesState(rules.map(createRuleFromAlertRule));
  }, [rules]);

  const openAlerts = alerts.filter((a) => a.status === 'OPEN');
  const criticalAlerts = alerts.filter((a) => a.status === 'OPEN' && a.severity === 'CRITICAL');
  const filtered = tab === 0 ? alerts : alerts.filter((a) => a.status === STATUS_MAP[tab]);

  const groupedIncidents = useMemo<GroupedIncident[]>(() => {
    const map = new Map<string, GroupedIncident>();

    alerts.forEach((alert) => {
      const roundedDate = new Date(alert.triggeredAt);
      roundedDate.setMinutes(Math.floor(roundedDate.getMinutes() / 30) * 30, 0, 0);
      const bucket = roundedDate.toISOString();
      const key = `${alert.affectedProcess}::${alert.triggerType}::${bucket}`;

      const existing = map.get(key);
      if (existing) {
        existing.alerts.push(alert);
        if (SEVERITY_PRIORITY[alert.severity] > SEVERITY_PRIORITY[existing.highestSeverity]) {
          existing.highestSeverity = alert.severity;
        }
      } else {
        map.set(key, {
          id: key,
          affectedProcess: alert.affectedProcess,
          triggerType: alert.triggerType,
          alerts: [alert],
          highestSeverity: alert.severity,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.alerts.length - a.alerts.length);
  }, [alerts]);

  const escalations = useMemo<Record<string, EscalationView>>(() => {
    return openAlerts.reduce<Record<string, EscalationView>>((acc, alert) => {
      const minutesOpen = Math.max(
        1,
        Math.floor((Date.now() - new Date(alert.triggeredAt).getTime()) / 60000)
      );
      const sla = ESCALATION_SLA_MINUTES[alert.severity];
      const level: 0 | 1 | 2 = minutesOpen > sla * 2 ? 2 : minutesOpen > sla ? 1 : 0;
      const target = level === 2 ? 'Gestor Executivo' : level === 1 ? 'Líder de Operações' : 'Equipe Operacional';
      acc[alert.id] = { alertId: alert.id, minutesOpen, level, target };
      return acc;
    }, {});
  }, [openAlerts]);

  if (loading && alerts.length === 0) return <PageSkeleton />;

  const openNewRuleDialog = (): void => {
    setEditingRuleId(null);
    setRuleDraft(createEmptyRule());
    setIsRuleDialogOpen(true);
  };

  const openEditRuleDialog = (rule: RuleFormState): void => {
    setEditingRuleId(rule.id);
    setRuleDraft(rule);
    setIsRuleDialogOpen(true);
  };

  const handleRuleField = <K extends keyof RuleFormState>(field: K, value: RuleFormState[K]): void => {
    setRuleDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSeverityChange = (event: SelectChangeEvent<string>): void => {
    const value = event.target.value;
    if (value === 'CRITICAL' || value === 'HIGH' || value === 'MEDIUM' || value === 'LOW' || value === 'HEALTHY') {
      handleRuleField('severity', value);
    }
  };

  const handleLayerChange = (event: SelectChangeEvent<string>): void => {
    const value = event.target.value;
    if (value === 'INGESTION' || value === 'TRUSTED' || value === 'ANALYTICS') {
      handleRuleField('layer', value);
    }
  };

  const saveRule = (): void => {
    if (!ruleDraft.name.trim()) return;

    if (editingRuleId) {
      setRulesState((current) =>
        current.map((rule) => (rule.id === editingRuleId ? { ...ruleDraft, id: editingRuleId } : rule))
      );
    } else {
      const nextId = `RUL-${Date.now().toString().slice(-5)}`;
      setRulesState((current) => [{ ...ruleDraft, id: nextId }, ...current]);
    }
    setIsRuleDialogOpen(false);
  };

  const deleteRule = (ruleId: string): void => {
    setRulesState((current) => current.filter((rule) => rule.id !== ruleId));
  };

  const toggleRule = (ruleId: string): void => {
    setRulesState((current) =>
      current.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule))
    );
  };

  const notifyAlert = (alert: Alert): void => {
    const message = `[${new Date().toLocaleTimeString('pt-BR')}] ${alert.severity} | ${alert.title} -> ${alert.affectedProcess}`;
    setNotificationLog((current) => [message, ...current].slice(0, 8));
  };

  return (
    <Box>
      {criticalAlerts.length > 0 && (
        <MuiAlert severity="error" sx={{ mb: 3 }}>
          <strong>{criticalAlerts.length} alerta(s) crítico(s) aberto(s)</strong> — ação imediata necessária.
        </MuiAlert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Críticos', value: alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'OPEN').length, color: theme.palette.error.main },
          { label: 'Altos', value: alerts.filter((a) => a.severity === 'HIGH' && a.status === 'OPEN').length, color: theme.palette.warning.main },
          { label: 'Abertos', value: openAlerts.length, color: '#FBBF24' },
          { label: 'Total Alertas', value: alerts.length, color: theme.palette.text.secondary },
        ].map((k) => (
          <Grid item xs={6} md={3} key={k.label}>
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>{k.label}</Typography>
                <Typography variant="h3" sx={{ color: k.color, fontWeight: 700 }}>{k.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Tabs
                value={tab} onChange={(_, v) => setTab(v)}
                sx={{ mb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
                TabIndicatorProps={{ style: { backgroundColor: theme.palette.primary.main } }}
              >
                {STATUS_TABS.map((label, i) => (
                  <Tab
                    key={label}
                    label={`${label}${i === 0 ? ` (${alerts.length})` : i === 1 ? ` (${openAlerts.length})` : ''}`}
                    sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary,
                      '&.Mui-selected': { color: theme.palette.text.primary } }}
                  />
                ))}
              </Tabs>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Severidade</TableCell>
                      <TableCell>Alerta</TableCell>
                      <TableCell>Camada</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Detectado</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((a) => (
                      <AlertRow
                        key={a.id}
                        alert={a}
                        escalation={escalations[a.id]}
                        onNotify={notifyAlert}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Regras de Acionamento (CRUD)</Typography>
                <Button
                  size="small"
                  startIcon={<AddCircleOutlineIcon fontSize="small" />}
                  onClick={openNewRuleDialog}
                  variant="contained"
                >
                  Nova regra
                </Button>
              </Stack>

              {rulesState.map((rule, i) => (
                <Box key={rule.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.8, gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{rule.name}</Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                        {rule.metric} {rule.operator} {rule.threshold} ({rule.condition})
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.disabled, display: 'block' }}>
                        Canal: {rule.channel} · Rate limit: {rule.rateLimitPerHour}/h
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={0.5}>
                      <SeverityChip severity={rule.severity} />
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Switch size="small" checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {rule.enabled ? 'Ativa' : 'Inativa'}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          aria-label={`Editar regra ${rule.id}`}
                          onClick={() => openEditRuleDialog(rule)}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label={`Excluir regra ${rule.id}`}
                          onClick={() => deleteRule(rule.id)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                        {rule.triggerCount}x disparado
                      </Typography>
                    </Stack>
                  </Box>
                  {i < rulesState.length - 1 && <Divider sx={{ my: 1.2 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Incidentes agrupados</Typography>
              {groupedIncidents.length === 0 ? (
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Nenhum agrupamento disponível.
                </Typography>
              ) : (
                groupedIncidents.map((group) => (
                  <Accordion key={group.id} disableGutters sx={{ mb: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {group.affectedProcess}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {group.alerts.length} alerta(s) agrupados · {group.triggerType}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <Stack spacing={0.6}>
                        <SeverityChip severity={group.highestSeverity} />
                        {group.alerts.map((alertItem) => (
                          <Typography key={alertItem.id} variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {new Date(alertItem.triggeredAt).toLocaleTimeString('pt-BR')} · {alertItem.title}
                          </Typography>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Escalonamento automático</Typography>
              {openAlerts.length === 0 ? (
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Sem alertas abertos no momento.
                </Typography>
              ) : (
                openAlerts.map((alertItem) => {
                  const escalation = escalations[alertItem.id];
                  return (
                    <Box key={alertItem.id} sx={{ mb: 1.2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {alertItem.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Em aberto há {escalation.minutesOpen} min · Escala alvo: {escalation.target}
                      </Typography>
                      {escalation.level > 0 && (
                        <Typography variant="caption" sx={{ color: theme.palette.error.main, display: 'block' }}>
                          Escalonamento L{escalation.level} ativo
                        </Typography>
                      )}
                    </Box>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Mensageria interna (simulação)</Typography>
              {notificationLog.length === 0 ? (
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Nenhuma notificação enviada nesta sessão.
                </Typography>
              ) : (
                notificationLog.map((log) => (
                  <Typography key={log} variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, mb: 0.8 }}>
                    {log}
                  </Typography>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={isRuleDialogOpen} onClose={() => setIsRuleDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingRuleId ? 'Editar regra' : 'Nova regra de alerta'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1.5} sx={{ mt: 0.3 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Nome da regra"
                value={ruleDraft.name}
                onChange={(event) => handleRuleField('name', event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Métrica"
                value={ruleDraft.metric}
                onChange={(event) => handleRuleField('metric', event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Threshold"
                value={ruleDraft.threshold}
                onChange={(event) => handleRuleField('threshold', Number(event.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="rule-severity-label">Severidade</InputLabel>
                <Select
                  labelId="rule-severity-label"
                  label="Severidade"
                  value={ruleDraft.severity}
                  onChange={handleSeverityChange}
                >
                  <MenuItem value="CRITICAL">CRITICAL</MenuItem>
                  <MenuItem value="HIGH">HIGH</MenuItem>
                  <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                  <MenuItem value="LOW">LOW</MenuItem>
                  <MenuItem value="HEALTHY">HEALTHY</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="rule-layer-label">Camada</InputLabel>
                <Select
                  labelId="rule-layer-label"
                  label="Camada"
                  value={ruleDraft.layer}
                  onChange={handleLayerChange}
                >
                  <MenuItem value="INGESTION">INGESTION</MenuItem>
                  <MenuItem value="TRUSTED">TRUSTED</MenuItem>
                  <MenuItem value="ANALYTICS">ANALYTICS</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Condição textual"
                value={ruleDraft.condition}
                onChange={(event) => handleRuleField('condition', event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Canal mensageria"
                value={ruleDraft.channel}
                onChange={(event) => handleRuleField('channel', event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Menção padrão"
                value={ruleDraft.mention}
                onChange={(event) => handleRuleField('mention', event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Rate limit por hora"
                value={ruleDraft.rateLimitPerHour}
                onChange={(event) => handleRuleField('rateLimitPerHour', Number(event.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Escalonar após (min)"
                value={ruleDraft.escalationMinutes}
                onChange={(event) => handleRuleField('escalationMinutes', Number(event.target.value))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsRuleDialogOpen(false)}>Cancelar</Button>
          <Button onClick={saveRule} variant="contained">
            {editingRuleId ? 'Salvar alterações' : 'Criar regra'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
