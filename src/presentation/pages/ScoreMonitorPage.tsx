import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Stack,
  Button,
  Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import TuneIcon from '@mui/icons-material/Tune';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../../app/store';
import {
  fetchScoreMetrics, fetchScoreAnomalies, fetchScoreTimeSeries, selectModel,
} from '../../app/slices/scoreSlice';
import SeverityChip from '../components/SeverityChip';
import PageSkeleton from '../components/PageSkeleton';
import type { ScoreMetric, DataLayer } from '../../domain/entities';

type ScorePeriod = '1H' | '24H' | '7D';

interface ThresholdConfig {
  zeroPercent: number;
  deviationPercent: number;
  correlationThreshold: number;
}

interface HistogramBucket {
  label: string;
  min: number;
  max: number;
  count: number;
}

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  zeroPercent: 2,
  deviationPercent: 15,
  correlationThreshold: 0.65,
};

const STORAGE_KEY = 'cockpit-score-thresholds-v1';

const LAYER_OPTIONS: Array<'ALL' | DataLayer> = ['ALL', 'ANALYTICS', 'TRUSTED', 'INGESTION'];
const LAYER_LABELS: Record<'ALL' | DataLayer, string> = {
  ALL: 'Todas',
  ANALYTICS: 'Analytics',
  TRUSTED: 'Trusted',
  INGESTION: 'Ingestão',
};

const PERIOD_LABELS: Record<ScorePeriod, string> = {
  '1H': 'Última 1h',
  '24H': 'Últimas 24h',
  '7D': 'Últimos 7 dias',
};

const SCORE_BANDS: Array<{ label: string; min: number; max: number }> = [
  { label: '0-300', min: 0, max: 300 },
  { label: '301-500', min: 301, max: 500 },
  { label: '501-650', min: 501, max: 650 },
  { label: '651-750', min: 651, max: 750 },
  { label: '751-900', min: 751, max: 900 },
];

const loadThresholds = (): ThresholdConfig => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_THRESHOLDS;

  try {
    const parsed = JSON.parse(raw) as Partial<ThresholdConfig>;
    if (
      typeof parsed.zeroPercent !== 'number' ||
      typeof parsed.deviationPercent !== 'number' ||
      typeof parsed.correlationThreshold !== 'number'
    ) {
      return DEFAULT_THRESHOLDS;
    }

    return {
      zeroPercent: parsed.zeroPercent,
      deviationPercent: parsed.deviationPercent,
      correlationThreshold: parsed.correlationThreshold,
    };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
};

const persistThresholds = (thresholds: ThresholdConfig): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(thresholds));
};

const isScorePeriod = (value: string): value is ScorePeriod =>
  value === '1H' || value === '24H' || value === '7D';

const isLayerOption = (value: string): value is 'ALL' | DataLayer =>
  value === 'ALL' || value === 'ANALYTICS' || value === 'TRUSTED' || value === 'INGESTION';

const computePearson = (x: number[], y: number[]): number => {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  const sumX = x.reduce((acc, value) => acc + value, 0);
  const sumY = y.reduce((acc, value) => acc + value, 0);
  const sumXY = x.reduce((acc, value, index) => acc + value * y[index], 0);
  const sumXSquare = x.reduce((acc, value) => acc + value ** 2, 0);
  const sumYSquare = y.reduce((acc, value) => acc + value ** 2, 0);
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXSquare - sumX ** 2) * (n * sumYSquare - sumY ** 2));

  if (denominator === 0) return 0;
  return Number((numerator / denominator).toFixed(3));
};

function ScoreRow({
  metric,
  isSelected,
  onClick,
  zeroThreshold,
  deviationThreshold,
}: {
  metric: ScoreMetric;
  isSelected: boolean;
  onClick: () => void;
  zeroThreshold: number;
  deviationThreshold: number;
}) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const deviationColor =
    Math.abs(metric.deviation) >= deviationThreshold ? theme.palette.error.main
    : Math.abs(metric.deviation) >= deviationThreshold * 0.7 ? theme.palette.warning.main
    : theme.palette.success.main;

  const zeroColor =
    metric.zeratedPercent >= zeroThreshold ? theme.palette.error.main
    : metric.zeratedPercent >= zeroThreshold * 0.65 ? theme.palette.warning.main
    : theme.palette.success.main;

  return (
    <TableRow
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        backgroundColor: isSelected
          ? (isLight ? 'rgba(227,24,55,0.05)' : 'rgba(227,24,55,0.08)')
          : 'transparent',
      }}
    >
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{metric.modelId}</Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{metric.modelName}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{metric.currentScore}</Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>ant: {metric.previousScore}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ color: deviationColor, fontWeight: 600 }}>
          {metric.deviation > 0 ? '+' : ''}{metric.deviation.toFixed(1)}%
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ color: zeroColor, fontWeight: 700 }}>
          {metric.zeratedPercent.toFixed(1)}%
        </Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
          {metric.zeratedCount.toLocaleString('pt-BR')} registros
        </Typography>
      </TableCell>
      <TableCell><SeverityChip severity={metric.status} /></TableCell>
      <TableCell>
        <Chip
          label={metric.layer} size="small"
          sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary,
            backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,47,108,0.06)' : 'rgba(255,255,255,0.06)' }}
        />
      </TableCell>
    </TableRow>
  );
}

export default function ScoreMonitorPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { metrics, anomalies, timeSeries, selectedModelId, loading } = useAppSelector((s) => s.score);
  const [chartModel, setChartModel] = useState('MDL-001');
  const [period, setPeriod] = useState<ScorePeriod>('24H');
  const [layerFilter, setLayerFilter] = useState<'ALL' | DataLayer>('ALL');
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState<ThresholdConfig>(loadThresholds);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    dispatch(fetchScoreMetrics());
    dispatch(fetchScoreAnomalies());
    dispatch(fetchScoreTimeSeries(chartModel));
  }, [dispatch, chartModel]);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchScoreMetrics());
      dispatch(fetchScoreAnomalies(chartModel));
      dispatch(fetchScoreTimeSeries(chartModel));
    }, 60000);

    return () => clearInterval(interval);
  }, [dispatch, chartModel]);

  useEffect(() => {
    if (!savedMessage) return undefined;
    const timeout = setTimeout(() => setSavedMessage(''), 2500);
    return () => clearTimeout(timeout);
  }, [savedMessage]);

  const handleModelClick = (modelId: string) => {
    dispatch(selectModel(modelId));
    setChartModel(modelId);
    dispatch(fetchScoreTimeSeries(modelId));
    dispatch(fetchScoreAnomalies(modelId));
  };

  const filteredByLayer = useMemo(
    () => metrics.filter((metric) => (layerFilter === 'ALL' ? true : metric.layer === layerFilter)),
    [metrics, layerFilter]
  );

  const histogramData = useMemo<HistogramBucket[]>(
    () =>
      SCORE_BANDS.map((band) => ({
        ...band,
        count: filteredByLayer.filter(
          (metric) => metric.currentScore >= band.min && metric.currentScore <= band.max
        ).length,
      })),
    [filteredByLayer]
  );

  const bandFilter = histogramData.find((band) => band.label === selectedBand);

  const filteredMetrics = useMemo(
    () =>
      filteredByLayer.filter((metric) => {
        if (!bandFilter) return true;
        return metric.currentScore >= bandFilter.min && metric.currentScore <= bandFilter.max;
      }),
    [filteredByLayer, bandFilter]
  );

  const chartData = useMemo(() => {
    const source =
      period === '1H'
        ? timeSeries.slice(-6)
        : period === '24H'
          ? timeSeries
          : timeSeries;

    return source.map((point, index) => ({
      time:
        period === '7D'
          ? `D-${source.length - index}`
          : new Date(point.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      score: Math.round(point.scoreAvg),
      zeratedCount: point.zeratedCount,
    }));
  }, [period, timeSeries]);

  const criticalModels = filteredMetrics.filter((m) => m.status === 'CRITICAL').length;
  const highModels = filteredMetrics.filter((m) => m.status === 'HIGH').length;
  const avgZerated = filteredMetrics.length
    ? (filteredMetrics.reduce((s, m) => s + m.zeratedPercent, 0) / filteredMetrics.length).toFixed(1)
    : '0';
  const thresholdBreaches = filteredMetrics.filter(
    (metric) =>
      metric.zeratedPercent >= thresholds.zeroPercent ||
      Math.abs(metric.deviation) >= thresholds.deviationPercent
  );

  const correlationData = useMemo(() => {
    if (chartData.length === 0) return [] as Array<{ time: string; consultas: number; desvio: number }>;

    const baseline = chartData.reduce((sum, point) => sum + point.score, 0) / chartData.length;
    return chartData.map((point, index) => {
      const oscillation = Math.sin(index * 0.8) * 280;
      const consultas = Math.round(1700 + oscillation + point.score * 0.32);
      const desvio = Number((point.score - baseline).toFixed(1));
      return { time: point.time, consultas, desvio };
    });
  }, [chartData]);

  const correlationCoefficient = useMemo(() => {
    const consultas = correlationData.map((point) => point.consultas);
    const desvios = correlationData.map((point) => point.desvio);
    return computePearson(consultas, desvios);
  }, [correlationData]);

  const tooltipBg = isLight ? '#FFFFFF' : '#1A2235';
  const tooltipBorder = isLight ? 'rgba(0,47,108,0.15)' : 'rgba(255,255,255,0.1)';
  const tooltipLabel = isLight ? '#4A6380' : '#9CA3AF';
  const gridStroke = isLight ? 'rgba(0,47,108,0.07)' : 'rgba(255,255,255,0.06)';
  const axisColor = isLight ? '#4A6380' : '#6B7280';

  if (loading && metrics.length === 0) return <PageSkeleton />;

  const handlePeriodChange = (event: SelectChangeEvent<string>): void => {
    const value = event.target.value;
    if (isScorePeriod(value)) {
      setPeriod(value);
    }
  };

  const handleLayerChange = (event: SelectChangeEvent<string>): void => {
    const value = event.target.value;
    if (isLayerOption(value)) {
      setLayerFilter(value);
    }
  };

  const handleSaveThresholds = (): void => {
    persistThresholds(thresholds);
    setSavedMessage('Thresholds salvos com sucesso.');
  };

  const handleResetThresholds = (): void => {
    setThresholds(DEFAULT_THRESHOLDS);
    persistThresholds(DEFAULT_THRESHOLDS);
    setSavedMessage('Thresholds resetados para padrão.');
  };

  return (
    <Box>
      {thresholdBreaches.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {thresholdBreaches.length} modelo(s) ultrapassaram os thresholds configurados.
        </Alert>
      )}

      {savedMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {savedMessage}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', lg: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%' }}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="score-period-label">Período</InputLabel>
                <Select labelId="score-period-label" value={period} label="Período" onChange={handlePeriodChange}>
                  {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="score-layer-label">Camada</InputLabel>
                <Select labelId="score-layer-label" value={layerFilter} label="Camada" onChange={handleLayerChange}>
                  {LAYER_OPTIONS.map((layer) => (
                    <MenuItem key={layer} value={layer}>
                      {LAYER_LABELS[layer]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button size="small" startIcon={<SaveOutlinedIcon fontSize="small" />} variant="contained" onClick={handleSaveThresholds}>
                Salvar thresholds
              </Button>
              <Button size="small" startIcon={<FilterAltOffIcon fontSize="small" />} onClick={handleResetThresholds}>
                Padrão
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Threshold Score Zerado: {thresholds.zeroPercent.toFixed(1)}%
              </Typography>
              <Slider
                size="small"
                min={0.5}
                max={10}
                step={0.1}
                value={thresholds.zeroPercent}
                onChange={(_, value) => {
                  if (typeof value === 'number') {
                    setThresholds((prev) => ({ ...prev, zeroPercent: value }));
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Threshold Oscilação: {thresholds.deviationPercent.toFixed(1)}%
              </Typography>
              <Slider
                size="small"
                min={3}
                max={35}
                step={1}
                value={thresholds.deviationPercent}
                onChange={(_, value) => {
                  if (typeof value === 'number') {
                    setThresholds((prev) => ({ ...prev, deviationPercent: value }));
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Threshold Correlação: {thresholds.correlationThreshold.toFixed(2)}
              </Typography>
              <Slider
                size="small"
                min={0.1}
                max={0.95}
                step={0.01}
                value={thresholds.correlationThreshold}
                onChange={(_, value) => {
                  if (typeof value === 'number') {
                    setThresholds((prev) => ({ ...prev, correlationThreshold: value }));
                  }
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Modelos Críticos', value: criticalModels, color: theme.palette.error.main },
          { label: 'Modelos Alto Risco', value: highModels, color: theme.palette.warning.main },
          { label: 'Score Zerado Médio', value: `${avgZerated}%`, color: '#FBBF24' },
          { label: 'Modelos Monitorados', value: filteredMetrics.length, color: theme.palette.success.main },
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
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="h5">Modelos Analíticos</Typography>
                {selectedBand && (
                  <Chip
                    label={`Drill-down: ${selectedBand}`}
                    color="secondary"
                    onDelete={() => setSelectedBand(null)}
                  />
                )}
              </Box>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 2 }}>
                Clique em um modelo para ver detalhes e série temporal
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Modelo</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Desvio</TableCell>
                      <TableCell>Zerado</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Camada</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMetrics.map((m) => (
                      <ScoreRow
                        key={m.modelId} metric={m}
                        isSelected={m.modelId === selectedModelId}
                        onClick={() => handleModelClick(m.modelId)}
                        zeroThreshold={thresholds.zeroPercent}
                        deviationThreshold={thresholds.deviationPercent}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Histograma de Distribuição de Scores
              </Typography>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fill: axisColor, fontSize: 10 }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }}
                    labelStyle={{ color: tooltipLabel }}
                  />
                  <Bar
                    dataKey="count"
                    onClick={(payload) => {
                      if (!payload || typeof payload !== 'object' || !('label' in payload)) return;
                      const value = payload.label;
                      if (typeof value !== 'string') return;
                      setSelectedBand((current) => (current === value ? null : value));
                    }}
                  >
                    {histogramData.map((entry) => (
                      <Cell
                        key={entry.label}
                        cursor="pointer"
                        fill={selectedBand === entry.label ? theme.palette.secondary.main : `${theme.palette.secondary.main}88`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Série Temporal — {chartModel}</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="time" tick={{ fill: axisColor, fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fill: axisColor, fontSize: 10 }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }}
                    labelStyle={{ color: tooltipLabel }}
                  />
                  <ReferenceLine
                    y={500} stroke={theme.palette.error.main}
                    strokeDasharray="4 2"
                    label={{ value: 'Limiar', fill: theme.palette.error.main, fontSize: 10 }}
                  />
                  <Line type="monotone" dataKey="score" stroke={theme.palette.secondary.main} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <TuneIcon fontSize="small" sx={{ mr: 0.8, verticalAlign: 'middle' }} />
                Anomalias Detectadas
              </Typography>
              {anomalies.length === 0 ? (
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Nenhuma anomalia detectada.
                </Typography>
              ) : (
                anomalies.map((ev, i) => (
                  <Box key={ev.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <SeverityChip severity={ev.severity} />
                      <Chip
                        label={ev.eventType} size="small"
                        sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary,
                          backgroundColor: isLight ? 'rgba(0,47,108,0.06)' : 'rgba(255,255,255,0.06)' }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>{ev.description}</Typography>
                    {ev.rootCause && (
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                        Causa: {ev.rootCause}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                      {ev.affectedRecords.toLocaleString('pt-BR')} registros afetados
                    </Typography>
                    {i < anomalies.length - 1 && <Divider sx={{ my: 1.5 }} />}
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Correlação avançada: consultas externas x desvio de score
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 2 }}>
            Coeficiente de Pearson: <strong>{correlationCoefficient.toFixed(3)}</strong>
            {Math.abs(correlationCoefficient) >= thresholds.correlationThreshold
              ? ' (acima do limiar configurado)'
              : ' (dentro do limiar configurado)'}
          </Typography>

          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={correlationData} margin={{ top: 8, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" tick={{ fill: axisColor, fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fill: axisColor, fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: axisColor, fontSize: 10 }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }}
                  labelStyle={{ color: tooltipLabel }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="consultas" name="Consultas externas" stroke={theme.palette.secondary.main} strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="desvio" name="Desvio de score" stroke={theme.palette.warning.main} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
