import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Divider, useTheme,
} from '@mui/material';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ReferenceLine,
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../../app/store';
import {
  fetchScoreMetrics, fetchScoreAnomalies, fetchScoreTimeSeries, selectModel,
} from '../../app/slices/scoreSlice';
import SeverityChip from '../components/SeverityChip';
import PageSkeleton from '../components/PageSkeleton';
import type { ScoreMetric } from '../../domain/entities';

function ScoreRow({
  metric, isSelected, onClick,
}: { metric: ScoreMetric; isSelected: boolean; onClick: () => void }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const deviationColor =
    metric.deviation < -10 ? theme.palette.error.main
    : metric.deviation < -3 ? theme.palette.warning.main
    : theme.palette.success.main;

  const zeroColor =
    metric.zeratedPercent > 5 ? theme.palette.error.main
    : metric.zeratedPercent > 2 ? theme.palette.warning.main
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

  useEffect(() => {
    dispatch(fetchScoreMetrics());
    dispatch(fetchScoreAnomalies());
    dispatch(fetchScoreTimeSeries(chartModel));
  }, [dispatch, chartModel]);

  const handleModelClick = (modelId: string) => {
    dispatch(selectModel(modelId));
    setChartModel(modelId);
    dispatch(fetchScoreTimeSeries(modelId));
    dispatch(fetchScoreAnomalies(modelId));
  };

  const chartData = timeSeries.map((t) => ({
    time: new Date(t.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    score: Math.round(t.scoreAvg),
  }));

  const criticalModels = metrics.filter((m) => m.status === 'CRITICAL').length;
  const highModels = metrics.filter((m) => m.status === 'HIGH').length;
  const avgZerated = metrics.length
    ? (metrics.reduce((s, m) => s + m.zeratedPercent, 0) / metrics.length).toFixed(1)
    : '0';

  const tooltipBg = isLight ? '#FFFFFF' : '#1A2235';
  const tooltipBorder = isLight ? 'rgba(0,47,108,0.15)' : 'rgba(255,255,255,0.1)';
  const tooltipLabel = isLight ? '#4A6380' : '#9CA3AF';
  const gridStroke = isLight ? 'rgba(0,47,108,0.07)' : 'rgba(255,255,255,0.06)';
  const axisColor = isLight ? '#4A6380' : '#6B7280';

  if (loading && metrics.length === 0) return <PageSkeleton />;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Modelos Críticos', value: criticalModels, color: theme.palette.error.main },
          { label: 'Modelos Alto Risco', value: highModels, color: theme.palette.warning.main },
          { label: 'Score Zerado Médio', value: `${avgZerated}%`, color: '#FBBF24' },
          { label: 'Modelos Monitorados', value: metrics.length, color: theme.palette.success.main },
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
              <Typography variant="h5" sx={{ mb: 0.5 }}>Modelos Analíticos</Typography>
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
                    {metrics.map((m) => (
                      <ScoreRow
                        key={m.modelId} metric={m}
                        isSelected={m.modelId === selectedModelId}
                        onClick={() => handleModelClick(m.modelId)}
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
              <Typography variant="h6" sx={{ mb: 2 }}>Anomalias Detectadas</Typography>
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
    </Box>
  );
}
