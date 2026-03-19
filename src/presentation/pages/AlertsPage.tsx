import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Alert as MuiAlert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Chip, CircularProgress, Tabs, Tab, Divider, Tooltip, useTheme,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchAlerts, fetchAlertRules, acknowledgeAlert, resolveAlert } from '../../app/slices/alertSlice';
import SeverityChip from '../components/SeverityChip';
import PageSkeleton from '../components/PageSkeleton';
import type { Alert } from '../../domain/entities';

const STATUS_TABS = ['Todos', 'Abertos', 'Reconhecidos', 'Resolvidos'];
const STATUS_MAP: Record<number, Alert['status'] | undefined> = {
  0: undefined, 1: 'OPEN', 2: 'ACKNOWLEDGED', 3: 'RESOLVED',
};
const LAYER_LABELS: Record<string, string> = {
  INGESTION: 'Ingestão', TRUSTED: 'Trusted', ANALYTICS: 'Analytics',
};

function AlertRow({ alert }: { alert: Alert }) {
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

  useEffect(() => {
    dispatch(fetchAlerts());
    dispatch(fetchAlertRules());
  }, [dispatch]);

  const openAlerts = alerts.filter((a) => a.status === 'OPEN');
  const criticalAlerts = alerts.filter((a) => a.status === 'OPEN' && a.severity === 'CRITICAL');
  const filtered = tab === 0 ? alerts : alerts.filter((a) => a.status === STATUS_MAP[tab]);

  if (loading && alerts.length === 0) return <PageSkeleton />;

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
                    {filtered.map((a) => <AlertRow key={a.id} alert={a} />)}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Regras de Acionamento</Typography>
              {rules.map((rule, i) => (
                <Box key={rule.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{rule.name}</Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                        {rule.condition}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                      <SeverityChip severity={rule.severity} />
                      <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                        {rule.triggerCount}x disparado
                      </Typography>
                    </Box>
                  </Box>
                  {i < rules.length - 1 && <Divider sx={{ my: 1.5 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
