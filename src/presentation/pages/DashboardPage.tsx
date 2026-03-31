import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  LinearProgress,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import TableViewIcon from '@mui/icons-material/TableView';
import DownloadIcon from '@mui/icons-material/Download';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchDashboard } from '../../app/slices/dashboardSlice';
import { fetchPipelineRuns } from '../../app/slices/lineageSlice';
import { fetchTests } from '../../app/slices/dataQualitySlice';
import PageSkeleton from '../components/PageSkeleton';
import type { DataLayer, StageHealth, PipelineStage } from '../../domain/entities';

type DashboardPeriod = '1H' | '4H' | '24H' | '7D' | '30D';
type LayerFilter = 'ALL' | DataLayer;

const STAGE_COLORS: Record<PipelineStage, string> = {
  INGESTAO: '#1565C0',
  GOVERNANCA: '#6A1B9A',
  DW: '#00695C',
  ANALYTICS_STAGE: '#E65100',
  DELIVERY: '#283593',
  PRODUTOS: '#AD1457',
};

const MOCK_STAGE_HEALTH: StageHealth[] = [
  { stage: 'INGESTAO', label: 'Ingestão', owner: 'Caio', healthScore: 94.2, activeAlerts: 2, qualityChecks: 18, qualityPassing: 16, lastUpdated: '2026-03-29T10:15:00Z' },
  { stage: 'GOVERNANCA', label: 'Governança', owner: 'Diego', healthScore: 97.8, activeAlerts: 1, qualityChecks: 24, qualityPassing: 23, lastUpdated: '2026-03-29T10:12:00Z' },
  { stage: 'DW', label: 'Data Warehouse', owner: 'Shimada', healthScore: 91.5, activeAlerts: 16, qualityChecks: 32, qualityPassing: 16, lastUpdated: '2026-03-29T10:10:00Z' },
  { stage: 'ANALYTICS_STAGE', label: 'Analytics', owner: 'Shimada', healthScore: 88.3, activeAlerts: 3, qualityChecks: 15, qualityPassing: 12, lastUpdated: '2026-03-29T10:08:00Z' },
  { stage: 'DELIVERY', label: 'Delivery', owner: 'Caio', healthScore: 99.1, activeAlerts: 0, qualityChecks: 8, qualityPassing: 8, lastUpdated: '2026-03-29T10:14:00Z' },
  { stage: 'PRODUTOS', label: 'Produtos', owner: 'Diego', healthScore: 96.5, activeAlerts: 1, qualityChecks: 12, qualityPassing: 11, lastUpdated: '2026-03-29T10:13:00Z' },
];


const LAYER_LABELS: Record<string, string> = {
  ALL: 'Todas',
  INGESTION: 'Ingestão',
  TRUSTED: 'Trusted',
  ANALYTICS: 'Analytics',
};

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  '1H': 'Última 1h',
  '4H': 'Últimas 4h',
  '24H': 'Últimas 24h',
  '7D': 'Últimos 7 dias',
  '30D': 'Últimos 30 dias',
};

const OWNER_OPTIONS = [...new Set(MOCK_STAGE_HEALTH.map((s) => s.owner))];

const escapeCsv = (value: string | number): string => {
  const text = String(value);
  if (text.includes(';') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const downloadFile = (filename: string, content: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const isDashboardPeriod = (value: string): value is DashboardPeriod =>
  value === '1H' || value === '4H' || value === '24H' || value === '7D' || value === '30D';

const isLayerFilter = (value: string): value is LayerFilter =>
  value === 'ALL' || value === 'INGESTION' || value === 'TRUSTED' || value === 'ANALYTICS';

const DONUT_COLORS = { success: '#4CAF50', fail: '#F44336', other: '#FF9800' };

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { data, loading, error } = useAppSelector((s) => s.dashboard);
  const { runs } = useAppSelector((s) => s.lineage);
  const { tests } = useAppSelector((s) => s.dataQuality);

  const [period, setPeriod] = useState<DashboardPeriod>('24H');
  const [layerFilter, setLayerFilter] = useState<LayerFilter>('ALL');
  const [processFilter, setProcessFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().slice(0, 10));
  const [ownerFilter, setOwnerFilter] = useState('');

  useEffect(() => {
    dispatch(fetchDashboard());
    dispatch(fetchPipelineRuns());
    dispatch(fetchTests());
  }, [dispatch]);

  const filteredStages = useMemo(
    () => ownerFilter ? MOCK_STAGE_HEALTH.filter((s) => s.owner === ownerFilter) : MOCK_STAGE_HEALTH,
    [ownerFilter],
  );

  const pipelineDonut = useMemo(() => {
    if (runs.length === 0) return { success: 0, fail: 0, pct: 0 };
    const success = runs.filter((r) => r.status === 'SUCCESS').length;
    const fail = runs.length - success;
    return { success, fail, pct: Math.round((success / runs.length) * 100) };
  }, [runs]);

  const qualityDonut = useMemo(() => {
    if (tests.length === 0) return { success: 0, fail: 0, pct: 0 };
    const success = tests.filter((t) => t.lastResult === 'PASS').length;
    const fail = tests.length - success;
    return { success, fail, pct: Math.round((success / tests.length) * 100) };
  }, [tests]);

  const activeFilterCount =
    (layerFilter !== 'ALL' ? 1 : 0) +
    (processFilter.trim().length > 0 ? 1 : 0) +
    (period !== '24H' ? 1 : 0) +
    (ownerFilter ? 1 : 0);

  if (loading && !data) return <PageSkeleton cards={4} rows={5} />;
  if (error) return <Alert severity="error" sx={{ mb: 2 }}>Erro ao carregar dashboard: {error}</Alert>;
  if (!data) return null;

  const handlePeriodChange = (event: SelectChangeEvent<string>): void => {
    const value = event.target.value;
    if (isDashboardPeriod(value)) setPeriod(value);
  };

  const handleLayerChange = (event: SelectChangeEvent<string>): void => {
    const value = event.target.value;
    if (isLayerFilter(value)) setLayerFilter(value);
  };

  const handleExportCsv = (): void => {
    const rows: string[] = ['tipo;nome;valor;unidade;periodo;camada'];
    filteredStages.forEach((stage) => {
      const passRate = stage.qualityChecks > 0 ? Math.round((stage.qualityPassing / stage.qualityChecks) * 100) : 0;
      rows.push(
        ['stage', escapeCsv(stage.label), escapeCsv(passRate), '%', escapeCsv(PERIOD_LABELS[period]), escapeCsv(LAYER_LABELS[layerFilter])].join(';'),
      );
    });
    downloadFile(`dashboard-cockpit-${Date.now()}.csv`, rows.join('\n'), 'text/csv;charset=utf-8;');
  };

  const handleExportSnapshot = (): void => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      filters: { period, layerFilter, processFilter, dateFilter, ownerFilter },
      stages: filteredStages,
      criticalAlerts: data.criticalAlerts,
      activeAlerts: data.activeAlerts,
    };
    downloadFile(`dashboard-cockpit-snapshot-${Date.now()}.json`, JSON.stringify(snapshot, null, 2), 'application/json;charset=utf-8;');
  };

  return (
    <Box>
      {data.criticalAlerts > 0 && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Typography
              variant="caption"
              component="a"
              href="/alerts"
              sx={{ color: theme.palette.error.main, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
            >
              Ver alertas
            </Typography>
          }
        >
          <strong>{data.criticalAlerts} alerta(s) crítico(s)</strong> requerem atenção imediata — processos de dados podem estar em risco.
        </Alert>
      )}

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>Saúde por Área da Esteira</Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 2 }}>
            Ingestão → Governança → DW → Analytics → Delivery → Produtos
          </Typography>
          <Grid container spacing={2}>
            {filteredStages.map((stage) => {
              const color = STAGE_COLORS[stage.stage];
              const passRate = stage.qualityChecks > 0 ? Math.round((stage.qualityPassing / stage.qualityChecks) * 100) : 0;
              return (
                <Grid item xs={12} sm={6} md={4} lg={2} key={stage.stage}>
                  <Card variant="outlined" sx={{
                    border: `1px solid ${color}22`,
                    background: `linear-gradient(135deg, ${color}08, transparent)`,
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s, transform 0.15s',
                    '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                  }} onClick={() => navigate(`/alerts?stage=${stage.stage}&tab=1`)}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 6px ${color}88` }} />
                        <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.78rem' }}>{stage.label}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, fontSize: '0.65rem', lineHeight: 1.25, mb: 0.75 }}>
                        Taxa de sucesso dos testes de qualidade
                      </Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1 }}>
                        {passRate}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={passRate}
                        sx={{ my: 1, '& .MuiLinearProgress-bar': { bgcolor: color } }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35, flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 600, color: stage.activeAlerts > 0 ? theme.palette.warning.main : theme.palette.success.main }}>
                            {stage.activeAlerts}
                          </span>
                          {' / '}
                          {stage.qualityChecks} testes
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.disabled, whiteSpace: 'nowrap', flexShrink: 0, fontSize: '0.65rem' }}>
                          | {stage.healthScore}%
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: theme.palette.text.disabled, fontSize: '0.62rem' }}>
                        Responsável: {stage.owner}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterAltIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
              <Typography variant="h6">Filtros globais e exportação</Typography>
              {activeFilterCount > 0 && (
                <Chip size="small" color="secondary" variant="outlined" label={`${activeFilterCount} filtro(s) ativo(s)`} />
              )}
            </Box>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" startIcon={<TableViewIcon fontSize="small" />} onClick={handleExportCsv}>
                Exportar CSV
              </Button>
              <Button size="small" variant="contained" startIcon={<DownloadIcon fontSize="small" />} onClick={handleExportSnapshot}>
                Snapshot JSON
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={1.5}>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Data"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="dashboard-owner-label">Responsável</InputLabel>
                <Select
                  labelId="dashboard-owner-label"
                  value={ownerFilter}
                  label="Responsável"
                  onChange={(e: SelectChangeEvent) => setOwnerFilter(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {OWNER_OPTIONS.map((o) => (
                    <MenuItem key={o} value={o}>{o}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="dashboard-period-label">Período</InputLabel>
                <Select labelId="dashboard-period-label" value={period} label="Período" onChange={handlePeriodChange}>
                  {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="dashboard-layer-label">Camada</InputLabel>
                <Select labelId="dashboard-layer-label" value={layerFilter} label="Camada" onChange={handleLayerChange}>
                  {Object.entries(LAYER_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Processo/job"
                value={processFilter}
                onChange={(e) => setProcessFilter(e.target.value)}
                placeholder="Ex: ETL-047"
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                size="small"
                variant="text"
                sx={{ mt: { xs: 0, md: 1 } }}
                onClick={() => {
                  setPeriod('24H');
                  setLayerFilter('ALL');
                  setProcessFilter('');
                  setOwnerFilter('');
                  setDateFilter(new Date().toISOString().slice(0, 10));
                }}
              >
                Limpar filtros
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Donut charts */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 }, transition: 'box-shadow 0.2s' }}
            onClick={() => navigate('/lineage')}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Sucesso dos Pipelines</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ width: 140, height: 140, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: 'Sucesso', value: pipelineDonut.success },
                        { name: 'Falha', value: pipelineDonut.fail },
                      ]} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} strokeWidth={0}>
                        <Cell fill={DONUT_COLORS.success} />
                        <Cell fill={DONUT_COLORS.fail} />
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1, color: pipelineDonut.pct >= 80 ? DONUT_COLORS.success : DONUT_COLORS.fail }}>
                      {pipelineDonut.pct}%
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: DONUT_COLORS.success }} />
                      <Typography variant="body2">Sucesso: {pipelineDonut.success}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: DONUT_COLORS.fail }} />
                      <Typography variant="body2">Falha: {pipelineDonut.fail}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      Clique para ver Linhagem de Dados
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 }, transition: 'box-shadow 0.2s' }}
            onClick={() => navigate('/data-quality')}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Testes de Qualidade</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ width: 140, height: 140, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: 'Sucesso', value: qualityDonut.success },
                        { name: 'Falha', value: qualityDonut.fail },
                      ]} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} strokeWidth={0}>
                        <Cell fill={DONUT_COLORS.success} />
                        <Cell fill={DONUT_COLORS.fail} />
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1, color: qualityDonut.pct >= 80 ? DONUT_COLORS.success : DONUT_COLORS.fail }}>
                      {qualityDonut.pct}%
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: DONUT_COLORS.success }} />
                      <Typography variant="body2">Sucesso: {qualityDonut.success}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: DONUT_COLORS.fail }} />
                      <Typography variant="body2">Falha: {qualityDonut.fail}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      Clique para ver Qualidade de Dados
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

    </Box>
  );
}
