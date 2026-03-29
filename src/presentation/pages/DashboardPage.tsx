import { useEffect, useMemo, useState } from 'react';
import {
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  LinearProgress,
  Divider,
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
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchDashboard } from '../../app/slices/dashboardSlice';
import KpiCard from '../components/KpiCard';
import HealthRing from '../components/HealthRing';
import PageSkeleton from '../components/PageSkeleton';
import type { LayerHealth, DataLayer, GlobalHealthKpi, SlaMetric, RoiMetric } from '../../domain/entities';

type DashboardPeriod = '1H' | '4H' | '24H' | '7D' | '30D';
type LayerFilter = 'ALL' | DataLayer;

const MOCK_SLA: SlaMetric[] = [
  { layer: 'INGESTION', target: 99.5, actual: 99.2, trend: 'STABLE' },
  { layer: 'TRUSTED', target: 99.0, actual: 97.8, trend: 'DOWN' },
  { layer: 'ANALYTICS', target: 99.9, actual: 99.95, trend: 'UP' },
];

const MOCK_ROI: RoiMetric[] = [
  { label: 'SLA Uptime', value: 99.3, unit: '%', trend: 'STABLE' },
  { label: 'MTTR', value: 23, unit: 'min', trend: 'UP' },
  { label: 'Custo Incidentes', value: 12400, unit: 'R$/mês', trend: 'DOWN' },
  { label: 'ROI Plataforma', value: 340, unit: '%', trend: 'UP' },
];

interface TrendPoint {
  label: string;
  atual: number;
  anterior: number;
}

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

const PERIOD_POINTS: Record<DashboardPeriod, number> = {
  '1H': 6,
  '4H': 8,
  '24H': 12,
  '7D': 14,
  '30D': 15,
};

const PROCESS_OPTIONS = [
  'ETL-047 FFT Copy',
  'BATCH-092 Trusted Sync',
  'MDL-003 Score Fraude',
  'MDL-001 Score Crédito PF',
  'Trusted Data Validation Service',
  'Model Metrics Registry',
];

const KPI_PROCESS_MAP: Record<string, string[]> = {
  'Score Zerado': ['MDL-003 Score Fraude', 'MDL-001 Score Crédito PF'],
  'Falhas Batch': ['ETL-047 FFT Copy', 'BATCH-092 Trusted Sync'],
  'Modelos Monitorados': ['Model Metrics Registry'],
  'Ingestão OK': ['Trusted Data Validation Service', 'ETL-047 FFT Copy'],
};

const getHealthColor = (score: number, isLight: boolean) => {
  if (score >= 80) return isLight ? '#00873D' : '#10B981';
  if (score >= 60) return '#F5A623';
  return '#E31837';
};

const toNumericValue = (value: number | string): number => {
  if (typeof value === 'number') return value;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const pseudoRandom = (seed: number): number => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const buildPointLabel = (period: DashboardPeriod, index: number, total: number): string => {
  if (period === '7D' || period === '30D') {
    return `D-${total - index}`;
  }
  return `T-${total - index}`;
};

const buildTrendSeries = (period: DashboardPeriod, kpi: GlobalHealthKpi): TrendPoint[] => {
  const total = PERIOD_POINTS[period];
  const base = toNumericValue(kpi.value);
  const amplitude = Math.max(base * 0.12, 2);
  const seedBase = kpi.label.length + base;

  return Array.from({ length: total }, (_, index) => {
    const noise = pseudoRandom(seedBase + index) - 0.5;
    const prevNoise = pseudoRandom(seedBase + index + 17) - 0.5;
    const drift = ((index / (total - 1)) * 2 - 1) * 0.6;
    const atual = Math.max(0, Number((base + noise * amplitude + drift).toFixed(1)));
    const anterior = Math.max(0, Number((base + prevNoise * amplitude - drift * 0.75).toFixed(1)));

    return {
      label: buildPointLabel(period, index, total),
      atual,
      anterior,
    };
  });
};

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

function LayerHealthRow({ layer }: { layer: LayerHealth }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const color = getHealthColor(layer.healthScore, isLight);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 5px ${color}` }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            {LAYER_LABELS[layer.layer]}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            <span style={{ color, fontWeight: 700 }}>{layer.healthScore}%</span> saúde
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            <span style={{ color: layer.activeAlerts > 0 ? '#F5A623' : color, fontWeight: 600 }}>
              {layer.activeAlerts}
            </span>{' '}alertas
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            <span style={{ fontWeight: 600, color: theme.palette.text.primary }}>{layer.successRate}%</span> sucesso
          </Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={layer.healthScore}
        sx={{ mb: 1.5, '& .MuiLinearProgress-bar': { backgroundColor: color } }}
      />
    </Box>
  );
}

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { data, loading, error } = useAppSelector((s) => s.dashboard);
  const [period, setPeriod] = useState<DashboardPeriod>('24H');
  const [layerFilter, setLayerFilter] = useState<LayerFilter>('ALL');
  const [processFilter, setProcessFilter] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('');

  useEffect(() => { dispatch(fetchDashboard()); }, [dispatch]);

  const filteredLayerHealth = useMemo<LayerHealth[]>(
    () => {
      if (!data) return [];
      return data.layerHealth.filter((layer) => (layerFilter === 'ALL' ? true : layer.layer === layerFilter));
    },
    [data, layerFilter]
  );

  const filteredKpis = useMemo<GlobalHealthKpi[]>(
    () => {
      if (!data) return [];

      const matchedKpiLabels = processFilter.trim().length === 0
        ? data.kpis.map((kpi) => kpi.label)
        : Object.entries(KPI_PROCESS_MAP)
            .filter(([, processList]) =>
              processList.some((processName) => processName.toLowerCase().includes(processFilter.toLowerCase()))
            )
            .map(([kpiLabel]) => kpiLabel);

      return data.kpis.filter((kpi) => matchedKpiLabels.includes(kpi.label));
    },
    [data, processFilter]
  );

  const trendByKpi = useMemo<Record<string, TrendPoint[]>>(() => {
    return filteredKpis.reduce<Record<string, TrendPoint[]>>((acc, kpi) => {
      acc[kpi.label] = buildTrendSeries(period, kpi);
      return acc;
    }, {});
  }, [filteredKpis, period]);

  useEffect(() => {
    if (!data) return;
    if (filteredKpis.length === 0) {
      setSelectedMetric('');
      return;
    }
    if (!filteredKpis.some((kpi) => kpi.label === selectedMetric)) {
      setSelectedMetric(filteredKpis[0].label);
    }
  }, [data, filteredKpis, selectedMetric]);

  const selectedTrend = selectedMetric ? trendByKpi[selectedMetric] ?? [] : [];

  const filteredOverallHealth = filteredLayerHealth.length === 0
    ? 0
    : Math.round(
        filteredLayerHealth.reduce((sum, layer) => sum + layer.healthScore, 0) / filteredLayerHealth.length
      );

  const activeFilterCount =
    (layerFilter !== 'ALL' ? 1 : 0) + (processFilter.trim().length > 0 ? 1 : 0) + (period !== '24H' ? 1 : 0);

  if (loading && !data) return <PageSkeleton cards={4} rows={5} />;
  if (error) return <Alert severity="error" sx={{ mb: 2 }}>Erro ao carregar dashboard: {error}</Alert>;
  if (!data) return null;

  const handlePeriodChange = (event: SelectChangeEvent<string>): void => {
    const value = event.target.value;
    if (isDashboardPeriod(value)) {
      setPeriod(value);
    }
  };

  const handleLayerChange = (event: SelectChangeEvent<string>): void => {
    const value = event.target.value;
    if (isLayerFilter(value)) {
      setLayerFilter(value);
    }
  };

  const handleExportCsv = (): void => {
    const rows: string[] = [];
    rows.push('tipo;nome;valor;unidade;severidade;periodo;camada;processo_filtro');
    filteredKpis.forEach((kpi) => {
      rows.push(
        [
          'kpi',
          escapeCsv(kpi.label),
          escapeCsv(kpi.value),
          escapeCsv(kpi.unit ?? ''),
          escapeCsv(kpi.severity),
          escapeCsv(PERIOD_LABELS[period]),
          escapeCsv(LAYER_LABELS[layerFilter]),
          escapeCsv(processFilter || 'todos'),
        ].join(';')
      );
    });
    filteredLayerHealth.forEach((layer) => {
      rows.push(
        [
          'camada',
          escapeCsv(LAYER_LABELS[layer.layer]),
          escapeCsv(layer.healthScore),
          '%',
          'HEALTH',
          escapeCsv(PERIOD_LABELS[period]),
          escapeCsv(LAYER_LABELS[layerFilter]),
          escapeCsv(processFilter || 'todos'),
        ].join(';')
      );
    });

    downloadFile(
      `dashboard-cockpit-${Date.now()}.csv`,
      rows.join('\n'),
      'text/csv;charset=utf-8;'
    );
  };

  const handleExportSnapshot = (): void => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      filters: { period, layerFilter, processFilter },
      overallHealth: filteredOverallHealth,
      kpis: filteredKpis,
      layerHealth: filteredLayerHealth,
      criticalAlerts: data.criticalAlerts,
      activeAlerts: data.activeAlerts,
    };
    downloadFile(
      `dashboard-cockpit-snapshot-${Date.now()}.json`,
      JSON.stringify(snapshot, null, 2),
      'application/json;charset=utf-8;'
    );
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
                <Chip
                  size="small"
                  color="secondary"
                  variant="outlined"
                  label={`${activeFilterCount} filtro(s) ativo(s)`}
                />
              )}
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<TableViewIcon fontSize="small" />}
                onClick={handleExportCsv}
              >
                Exportar CSV
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<DownloadIcon fontSize="small" />}
                onClick={handleExportSnapshot}
              >
                Snapshot JSON
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={1.5}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="dashboard-period-label">Período</InputLabel>
                <Select
                  labelId="dashboard-period-label"
                  value={period}
                  label="Período"
                  onChange={handlePeriodChange}
                >
                  {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="dashboard-layer-label">Camada</InputLabel>
                <Select
                  labelId="dashboard-layer-label"
                  value={layerFilter}
                  label="Camada"
                  onChange={handleLayerChange}
                >
                  {Object.entries(LAYER_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Filtro por processo/job"
                value={processFilter}
                onChange={(event) => setProcessFilter(event.target.value)}
                placeholder="Ex: ETL-047, MDL-003"
                helperText={`Sugestões: ${PROCESS_OPTIONS.slice(0, 3).join(' · ')}`}
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
                }}
              >
                Limpar filtros
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {filteredKpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <KpiCard
              {...kpi}
              trendPreview={(trendByKpi[kpi.label] ?? []).map((point) => ({
                label: point.label,
                value: point.atual,
              }))}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 0.5 }}>Saúde por Camada</Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 3 }}>
                Ingestão → Trusted → Analytics
              </Typography>
              {filteredLayerHealth.map((layer) => (
                <LayerHealthRow key={layer.layer} layer={layer} />
              ))}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Total Alertas</Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: data.activeAlerts > 0 ? '#F5A623' : theme.palette.success.main, fontWeight: 700 }}
                  >
                    {data.activeAlerts}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Críticos</Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: data.criticalAlerts > 0 ? theme.palette.error.main : theme.palette.success.main, fontWeight: 700 }}
                  >
                    {data.criticalAlerts}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent
              sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}
            >
              <Typography variant="h5" sx={{ mb: 2, alignSelf: 'flex-start' }}>Saúde Geral</Typography>
              <HealthRing value={filteredOverallHealth} size={140} strokeWidth={10} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 2, textAlign: 'center' }}>
                Índice consolidado considerando filtros aplicados
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                {filteredLayerHealth.map((l) => (
                  <HealthRing key={l.layer} value={l.healthScore} size={60} strokeWidth={5} label={LAYER_LABELS[l.layer]} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h6">Tendências detalhadas</Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Comparativo do período atual vs período anterior
              </Typography>
            </Box>

            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel id="metric-select-label">Métrica</InputLabel>
              <Select
                labelId="metric-select-label"
                value={selectedMetric}
                label="Métrica"
                onChange={(event) => setSelectedMetric(event.target.value)}
              >
                {filteredKpis.map((kpi) => (
                  <MenuItem key={kpi.label} value={kpi.label}>
                    {kpi.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {selectedTrend.length === 0 ? (
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Nenhuma série disponível para os filtros atuais.
            </Typography>
          ) : (
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedTrend} margin={{ top: 8, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="label" tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} />
                  <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="atual" name="Período atual" stroke={theme.palette.secondary.main} strokeWidth={2.4} dot={false} />
                  <Line type="monotone" dataKey="anterior" name="Período anterior" stroke={theme.palette.text.disabled} strokeDasharray="4 2" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>SLA & ROI</Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 2 }}>
            Indicadores de nível de serviço e retorno sobre investimento da plataforma
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {MOCK_ROI.map((roi) => (
              <Grid item xs={6} sm={3} key={roi.label}>
                <KpiCard
                  label={roi.label}
                  value={typeof roi.value === 'number' && roi.value > 999 ? `${(roi.value / 1000).toFixed(1)}k` : roi.value}
                  unit={roi.unit}
                  trend={roi.trend}
                  trendValue={roi.unit}
                  severity={roi.trend === 'DOWN' && roi.label.includes('Custo') ? 'HEALTHY' : roi.trend === 'UP' ? 'HEALTHY' : 'MEDIUM'}
                />
              </Grid>
            ))}
          </Grid>

          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Cumprimento de SLA por Camada</Typography>
          <Box sx={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_SLA.map((s) => ({
                layer: s.layer === 'INGESTION' ? 'Ingestão' : s.layer === 'TRUSTED' ? 'Trusted' : 'Analytics',
                Meta: s.target,
                Real: s.actual,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="layer" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                <YAxis domain={[95, 100]} tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar dataKey="Meta" fill={theme.palette.text.disabled} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Real" radius={[4, 4, 0, 0]}>
                  {MOCK_SLA.map((s, i) => (
                    <Cell key={i} fill={s.actual >= s.target ? theme.palette.success.main : theme.palette.error.main} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
