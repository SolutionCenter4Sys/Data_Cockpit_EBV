import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Tooltip,
  useTheme,
  IconButton,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FlagCircleOutlinedIcon from '@mui/icons-material/FlagCircleOutlined';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchAlerts, acknowledgeAlert, resolveAlert, createAlert } from '../../app/slices/alertSlice';
import { fetchTests } from '../../app/slices/dataQualitySlice';
import SeverityChip from '../components/SeverityChip';
import PageSkeleton from '../components/PageSkeleton';
import type { Alert, PipelineStage, SeverityLevel, DataLayer } from '../../domain/entities';

const STATUS_TABS = ['Todos', 'Abertos', 'Reconhecidos', 'Resolvidos'];
const STATUS_MAP: Record<number, Alert['status'] | undefined> = {
  0: undefined, 1: 'OPEN', 2: 'ACKNOWLEDGED', 3: 'RESOLVED',
};
const LAYER_LABELS: Record<string, string> = {
  INGESTION: 'Ingestão', TRUSTED: 'Trusted', ANALYTICS: 'Analytics',
};

const STAGE_FILTER_OPTIONS: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'INGESTAO', label: 'Ingestão', color: '#1565C0' },
  { key: 'GOVERNANCA', label: 'Governança', color: '#6A1B9A' },
  { key: 'DW', label: 'Data Warehouse', color: '#00695C' },
  { key: 'ANALYTICS_STAGE', label: 'Analytics', color: '#E65100' },
  { key: 'DELIVERY', label: 'Delivery', color: '#283593' },
  { key: 'PRODUTOS', label: 'Produtos', color: '#AD1457' },
];

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { alerts, loading } = useAppSelector((s) => s.alerts);
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState(tabParam ? Number(tabParam) : 0);
  const [notificationLog, setNotificationLog] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const qualityTests = useAppSelector((s) => s.dataQuality.tests);
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM' as Alert['severity'],
    qualityTestId: '',
    triggerType: 'THRESHOLD' as Alert['triggerType'],
    affectedProcess: '',
    suggestedAction: '',
  });

  const stageParam = searchParams.get('stage') as PipelineStage | null;
  const [stageFilter, setStageFilter] = useState<PipelineStage | ''>(stageParam ?? '');

  useEffect(() => {
    dispatch(fetchAlerts());
    dispatch(fetchTests());
  }, [dispatch]);

  useEffect(() => {
    if (stageParam) setStageFilter(stageParam);
    if (tabParam) setTab(Number(tabParam));
  }, [stageParam, tabParam]);

  const handleStageFilter = (stage: PipelineStage | ''): void => {
    setStageFilter(stage);
    if (stage) {
      setSearchParams({ stage });
    } else {
      setSearchParams({});
    }
  };

  const stageFilteredAlerts = useMemo(() => {
    if (!stageFilter) return alerts;
    return alerts.filter((a) => a.stage === stageFilter);
  }, [alerts, stageFilter]);

  const openAlerts = stageFilteredAlerts.filter((a) => a.status === 'OPEN');
  const criticalAlerts = stageFilteredAlerts.filter((a) => a.status === 'OPEN' && a.severity === 'CRITICAL');
  const filtered = tab === 0 ? stageFilteredAlerts : stageFilteredAlerts.filter((a) => a.status === STATUS_MAP[tab]);

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

  const notifyAlert = (alert: Alert): void => {
    const message = `[${new Date().toLocaleTimeString('pt-BR')}] ${alert.severity} | ${alert.title} -> ${alert.affectedProcess}`;
    setNotificationLog((current) => [message, ...current].slice(0, 8));
  };

  const resetDraft = () => setDraft({
    title: '', description: '', severity: 'MEDIUM', qualityTestId: '',
    triggerType: 'THRESHOLD', affectedProcess: '', suggestedAction: '',
  });

  const TEST_LAYER_MAP: Record<string, DataLayer> = {
    'EBV Core Database': 'INGESTION',
    'Oracle Legado': 'INGESTION',
    'Kafka Events Stream': 'INGESTION',
    'BigQuery Analytics': 'ANALYTICS',
  };

  const TEST_STAGE_MAP: Record<string, PipelineStage> = {
    'EBV Core Database': 'INGESTAO',
    'Oracle Legado': 'INGESTAO',
    'Kafka Events Stream': 'INGESTAO',
    'BigQuery Analytics': 'ANALYTICS_STAGE',
  };

  const handleCreateAlert = () => {
    if (!draft.title.trim()) return;
    const selectedTest = qualityTests.find((t) => t.id === draft.qualityTestId);
    const layer: DataLayer = selectedTest ? (TEST_LAYER_MAP[selectedTest.sourceName] ?? 'TRUSTED') : 'INGESTION';
    const stage: PipelineStage = selectedTest ? (TEST_STAGE_MAP[selectedTest.sourceName] ?? 'DW') : 'INGESTAO';
    const { qualityTestId: _, ...rest } = draft;
    dispatch(createAlert({ ...rest, layer, stage }));
    setDialogOpen(false);
    resetDraft();
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
          { label: 'Críticos', value: stageFilteredAlerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'OPEN').length, color: theme.palette.error.main },
          { label: 'Altos', value: stageFilteredAlerts.filter((a) => a.severity === 'HIGH' && a.status === 'OPEN').length, color: theme.palette.warning.main },
          { label: 'Abertos', value: openAlerts.length, color: '#FBBF24' },
          { label: 'Total Alertas', value: stageFilteredAlerts.length, color: theme.palette.text.secondary },
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

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            <FilterAltIcon fontSize="small" sx={{ color: theme.palette.text.disabled }} />
            <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>Área da Esteira:</Typography>
            <Chip
              label="Todas"
              size="small"
              variant={stageFilter === '' ? 'filled' : 'outlined'}
              color={stageFilter === '' ? 'primary' : 'default'}
              onClick={() => handleStageFilter('')}
              sx={{ fontSize: '0.72rem' }}
            />
            {STAGE_FILTER_OPTIONS.map((opt) => (
              <Chip
                key={opt.key}
                label={opt.label}
                size="small"
                variant={stageFilter === opt.key ? 'filled' : 'outlined'}
                onClick={() => handleStageFilter(opt.key)}
                sx={{
                  fontSize: '0.72rem',
                  borderColor: opt.color,
                  color: stageFilter === opt.key ? '#fff' : opt.color,
                  backgroundColor: stageFilter === opt.key ? opt.color : 'transparent',
                  '&:hover': { backgroundColor: `${opt.color}22` },
                }}
              />
            ))}
            <Button
              variant="contained"
              size="small"
              startIcon={<AddAlertIcon />}
              onClick={() => setDialogOpen(true)}
              sx={{ ml: 'auto', fontSize: '0.75rem', textTransform: 'none' }}
            >
              Adicionar Alerta
            </Button>
          </Stack>
        </CardContent>
      </Card>

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
                    label={`${label}${i === 0 ? ` (${stageFilteredAlerts.length})` : i === 1 ? ` (${openAlerts.length})` : ''}`}
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

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); resetDraft(); }} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Alerta</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Título" size="small" required value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          <TextField label="Descrição" size="small" multiline rows={2} value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
          <TextField label="Severidade" size="small" select value={draft.severity}
            onChange={(e) => setDraft((d) => ({ ...d, severity: e.target.value as Alert['severity'] }))}>
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
          <TextField label="Caso de Teste" size="small" select value={draft.qualityTestId}
            onChange={(e) => setDraft((d) => ({ ...d, qualityTestId: e.target.value }))}>
            {qualityTests.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name} — {t.tableName}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Tipo de disparo" size="small" select value={draft.triggerType}
            onChange={(e) => setDraft((d) => ({ ...d, triggerType: e.target.value as Alert['triggerType'] }))}>
            {(['THRESHOLD', 'ANOMALY', 'BATCH_FAILURE', 'SCORE_ZERO', 'LATENCY'] as const).map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
          <TextField label="Processo afetado" size="small" value={draft.affectedProcess}
            onChange={(e) => setDraft((d) => ({ ...d, affectedProcess: e.target.value }))} />
          <TextField label="Ação sugerida" size="small" value={draft.suggestedAction}
            onChange={(e) => setDraft((d) => ({ ...d, suggestedAction: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setDialogOpen(false); resetDraft(); }}>Cancelar</Button>
          <Button variant="contained" disabled={!draft.title.trim()} onClick={handleCreateAlert}>
            Criar Alerta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
