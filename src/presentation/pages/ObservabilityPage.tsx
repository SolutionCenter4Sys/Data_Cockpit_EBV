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
  FormControlLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FlagCircleOutlinedIcon from '@mui/icons-material/FlagCircleOutlined';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchAlerts, acknowledgeAlert, resolveAlert } from '../../app/slices/alertSlice';
import { fetchTests } from '../../app/slices/dataQualitySlice';
import SeverityChip from '../components/SeverityChip';
import PageSkeleton from '../components/PageSkeleton';
import type { Alert, DataLayer, SeverityLevel } from '../../domain/entities';

const STATUS_TABS = ['Todos', 'Abertos', 'Reconhecidos', 'Resolvidos'];
const STATUS_MAP: Record<number, Alert['status'] | undefined> = {
  0: undefined, 1: 'OPEN', 2: 'ACKNOWLEDGED', 3: 'RESOLVED',
};
const LAYER_LABELS: Record<string, string> = {
  INGESTION: 'Ingestão', TRUSTED: 'Trusted', ANALYTICS: 'Analytics',
};

const SEVERITY_PRIORITY: Record<SeverityLevel, number> = {
  CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, HEALTHY: 1,
};

const ESCALATION_SLA_MINUTES: Record<SeverityLevel, number> = {
  CRITICAL: 5, HIGH: 15, MEDIUM: 60, LOW: 120, HEALTHY: 180,
};

type ActionType = 'notify' | 'block' | 'retry' | 'escalate' | 'auto_fix' | 'servicenow';
type OutputTarget = 'slack' | 'teams' | 'email' | 'pagerduty' | 'servicenow' | 'jira' | 'dashboard';

const OUTPUT_LABELS: Record<OutputTarget, string> = {
  slack: 'Slack', teams: 'Teams', email: 'Email', pagerduty: 'PagerDuty',
  servicenow: 'ServiceNow', jira: 'Jira', dashboard: 'Dashboard',
};
const ALL_OUTPUT_TARGETS: OutputTarget[] = ['slack', 'teams', 'email', 'pagerduty', 'servicenow', 'jira', 'dashboard'];

interface AlertFormState {
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
  qualityTestId: string;
  action: ActionType;
  outputTargets: OutputTarget[];
  autoBlocking: boolean;
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

const createEmptyAlert = (): AlertFormState => ({
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
  qualityTestId: '',
  action: 'notify',
  outputTargets: ['dashboard'],
  autoBlocking: false,
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
        <Chip label={alert.area || '—'} size="small" variant="outlined"
          sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary }} />
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
              ml: 1, mt: 0.6, fontSize: '0.65rem',
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

export default function ObservabilityPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { alerts, loading } = useAppSelector((s) => s.alerts);
  const { tests } = useAppSelector((s) => s.dataQuality);
  const [tab, setTab] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [draft, setDraft] = useState<AlertFormState>(createEmptyAlert());
  const [notificationLog, setNotificationLog] = useState<string[]>([]);

  useEffect(() => {
    dispatch(fetchAlerts());
    dispatch(fetchTests());
  }, [dispatch]);

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
        map.set(key, { id: key, affectedProcess: alert.affectedProcess, triggerType: alert.triggerType, alerts: [alert], highestSeverity: alert.severity });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.alerts.length - a.alerts.length);
  }, [alerts]);

  const escalations = useMemo<Record<string, EscalationView>>(() => {
    return openAlerts.reduce<Record<string, EscalationView>>((acc, alert) => {
      const minutesOpen = Math.max(1, Math.floor((Date.now() - new Date(alert.triggeredAt).getTime()) / 60000));
      const sla = ESCALATION_SLA_MINUTES[alert.severity];
      const level: 0 | 1 | 2 = minutesOpen > sla * 2 ? 2 : minutesOpen > sla ? 1 : 0;
      const target = level === 2 ? 'Gestor Executivo' : level === 1 ? 'Líder de Operações' : 'Equipe Operacional';
      acc[alert.id] = { alertId: alert.id, minutesOpen, level, target };
      return acc;
    }, {});
  }, [openAlerts]);

  if (loading && alerts.length === 0) return <PageSkeleton />;

  const openNewDialog = (): void => {
    setDraft(createEmptyAlert());
    setIsDialogOpen(true);
  };

  const handleField = <K extends keyof AlertFormState>(field: K, value: AlertFormState[K]): void => {
    setDraft((c) => ({ ...c, [field]: value }));
  };

  const handleSeverityChange = (event: SelectChangeEvent<string>): void => {
    const v = event.target.value;
    if (v === 'CRITICAL' || v === 'HIGH' || v === 'MEDIUM' || v === 'LOW' || v === 'HEALTHY') handleField('severity', v);
  };

  const handleLayerChange = (event: SelectChangeEvent<string>): void => {
    const v = event.target.value;
    if (v === 'INGESTION' || v === 'TRUSTED' || v === 'ANALYTICS') handleField('layer', v);
  };

  const handleQualityTestChange = (event: SelectChangeEvent<string>): void => {
    const testId = event.target.value;
    handleField('qualityTestId', testId);
    if (testId) {
      const test = tests.find((t) => t.id === testId);
      if (test) {
        handleField('name', `Alerta — ${test.name}`);
        handleField('condition', test.query);
      }
    }
  };

  const saveAlert = (): void => {
    if (!draft.name.trim()) return;
    setIsDialogOpen(false);
  };

  const notifyAlert = (alert: Alert): void => {
    const message = `[${new Date().toLocaleTimeString('pt-BR')}] ${alert.severity} | ${alert.title} -> ${alert.affectedProcess}`;
    setNotificationLog((c) => [message, ...c].slice(0, 8));
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
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Tabs
                  value={tab} onChange={(_, v) => setTab(v)}
                  sx={{ mb: 2, borderBottom: `1px solid ${theme.palette.divider}`, flex: 1 }}
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
                <Button
                  size="small"
                  startIcon={<AddCircleOutlineIcon fontSize="small" />}
                  onClick={openNewDialog}
                  variant="contained"
                  sx={{ mb: 2, ml: 2, whiteSpace: 'nowrap' }}
                >
                  Novo alerta
                </Button>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Severidade</TableCell>
                      <TableCell>Alerta</TableCell>
                      <TableCell>Camada</TableCell>
                      <TableCell>Área</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Detectado</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((a) => (
                      <AlertRow key={a.id} alert={a} escalation={escalations[a.id]} onNotify={notifyAlert} />
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
              <Typography variant="h6" sx={{ mb: 1.5 }}>Incidentes agrupados</Typography>
              {groupedIncidents.length === 0 ? (
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Nenhum agrupamento disponível.</Typography>
              ) : (
                groupedIncidents.map((group) => (
                  <Accordion key={group.id} disableGutters sx={{ mb: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{group.affectedProcess}</Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {group.alerts.length} alerta(s) agrupados · {group.triggerType}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <Stack spacing={0.6}>
                        <SeverityChip severity={group.highestSeverity} />
                        {group.alerts.map((item) => (
                          <Typography key={item.id} variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {new Date(item.triggeredAt).toLocaleTimeString('pt-BR')} · {item.title}
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
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Sem alertas abertos no momento.</Typography>
              ) : (
                openAlerts.map((item) => {
                  const esc = escalations[item.id];
                  return (
                    <Box key={item.id} sx={{ mb: 1.2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.title}</Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Em aberto há {esc.minutesOpen} min · Escala alvo: {esc.target}
                      </Typography>
                      {esc.level > 0 && (
                        <Typography variant="caption" sx={{ color: theme.palette.error.main, display: 'block' }}>
                          Escalonamento L{esc.level} ativo
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
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Nenhuma notificação enviada nesta sessão.</Typography>
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

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Novo alerta</DialogTitle>
        <DialogContent>
          <Grid container spacing={1.5} sx={{ mt: 0.3 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Caso de Teste (Qualidade de Dados)</InputLabel>
                <Select
                  value={draft.qualityTestId}
                  label="Caso de Teste (Qualidade de Dados)"
                  onChange={handleQualityTestChange}
                >
                  <MenuItem value="">Nenhum (manual)</MenuItem>
                  {tests.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name} — {t.tableName.split('.').pop()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 0.5 }}>
                <Chip label="Configuração do Alerta" size="small" />
              </Divider>
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Nome do alerta" value={draft.name}
                onChange={(e) => handleField('name', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Métrica" value={draft.metric}
                onChange={(e) => handleField('metric', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" type="number" label="Threshold" value={draft.threshold}
                onChange={(e) => handleField('threshold', Number(e.target.value))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Severidade</InputLabel>
                <Select label="Severidade" value={draft.severity} onChange={handleSeverityChange}>
                  <MenuItem value="CRITICAL">CRITICAL</MenuItem>
                  <MenuItem value="HIGH">HIGH</MenuItem>
                  <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                  <MenuItem value="LOW">LOW</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Camada</InputLabel>
                <Select label="Camada" value={draft.layer} onChange={handleLayerChange}>
                  <MenuItem value="INGESTION">Ingestão</MenuItem>
                  <MenuItem value="TRUSTED">Trusted</MenuItem>
                  <MenuItem value="ANALYTICS">Analytics</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Condição textual" value={draft.condition}
                onChange={(e) => handleField('condition', e.target.value)} />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 0.5 }}>
                <Chip label="Ação Desejada" size="small" />
              </Divider>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Ação</InputLabel>
                <Select label="Ação" value={draft.action}
                  onChange={(e: SelectChangeEvent) => handleField('action', e.target.value as ActionType)}>
                  <MenuItem value="notify">Notificar</MenuItem>
                  <MenuItem value="block">Bloquear</MenuItem>
                  <MenuItem value="retry">Retry</MenuItem>
                  <MenuItem value="escalate">Escalar</MenuItem>
                  <MenuItem value="auto_fix">Auto-fix</MenuItem>
                  <MenuItem value="servicenow">ServiceNow (Incidente)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Canais de Saída</InputLabel>
                <Select
                  multiple
                  value={draft.outputTargets}
                  label="Canais de Saída"
                  onChange={(e: SelectChangeEvent<string[]>) => {
                    const val = e.target.value;
                    handleField('outputTargets', (typeof val === 'string' ? val.split(',') : val) as OutputTarget[]);
                  }}
                  renderValue={(sel) => (sel as OutputTarget[]).map((s) => OUTPUT_LABELS[s]).join(', ')}
                >
                  {ALL_OUTPUT_TARGETS.map((t) => (
                    <MenuItem key={t} value={t}>{OUTPUT_LABELS[t]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Canal mensageria" value={draft.channel}
                onChange={(e) => handleField('channel', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Menção padrão" value={draft.mention}
                onChange={(e) => handleField('mention', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" type="number" label="Rate limit por hora" value={draft.rateLimitPerHour}
                onChange={(e) => handleField('rateLimitPerHour', Number(e.target.value))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" type="number" label="Escalonar após (min)" value={draft.escalationMinutes}
                onChange={(e) => handleField('escalationMinutes', Number(e.target.value))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={<Switch checked={draft.autoBlocking} onChange={(e) => handleField('autoBlocking', e.target.checked)} />}
                label="Auto-blocking"
                sx={{ mt: 0.5 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
          <Button onClick={saveAlert} variant="contained">
            Criar alerta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
