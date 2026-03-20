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
  Button,
  CircularProgress,
  Tooltip,
  LinearProgress,
  Alert,
  Chip,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import ReplayIcon from '@mui/icons-material/Replay';
import TimelineIcon from '@mui/icons-material/Timeline';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line } from 'recharts';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchBatchJobs, fetchBatchMetrics, retryBatchJob } from '../../app/slices/batchSlice';
import StatusBadge from '../components/StatusBadge';
import PageSkeleton from '../components/PageSkeleton';
import type { BatchJob, DataLayer, ProcessStatus } from '../../domain/entities';

const LAYER_LABELS: Record<string, string> = {
  INGESTION: 'Ingestão', TRUSTED: 'Trusted', ANALYTICS: 'Analytics',
};

type JobStatusFilter = 'ALL' | ProcessStatus;
type LayerFilter = 'ALL' | DataLayer;

interface TimelineEntry {
  jobId: string;
  actual: number;
  expected: number;
}

interface HistoryPoint {
  run: string;
  duration: number;
  expected: number;
  volume: number;
}

interface BaselineRow {
  jobId: string;
  jobName: string;
  p50: number;
  p95: number;
  avgDuration: number;
  avgVolume: number;
}

const STATUS_LABELS: Record<JobStatusFilter, string> = {
  ALL: 'Todos',
  RUNNING: 'Executando',
  SUCCESS: 'Sucesso',
  FAILED: 'Falhou',
  WARNING: 'Atenção',
  PENDING: 'Pendente',
};

const isStatusFilter = (value: string): value is JobStatusFilter =>
  value === 'ALL' || value === 'RUNNING' || value === 'SUCCESS' || value === 'FAILED' || value === 'WARNING' || value === 'PENDING';

const isLayerFilter = (value: string): value is LayerFilter =>
  value === 'ALL' || value === 'INGESTION' || value === 'TRUSTED' || value === 'ANALYTICS';

const getExpectedDuration = (job: BatchJob): number => {
  if (job.layer === 'INGESTION') return 25;
  if (job.layer === 'TRUSTED') return 45;
  return 55;
};

const seededValue = (seed: number): number => {
  const raw = Math.sin(seed * 19.17) * 10000;
  return raw - Math.floor(raw);
};

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return sorted[position];
};

const buildHistoryForJob = (job: BatchJob): HistoryPoint[] => {
  const expected = getExpectedDuration(job);
  const volumeBase = job.recordsProcessed ?? 150000;
  const seedBase = job.jobId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return Array.from({ length: 12 }, (_, index) => {
    const noise = seededValue(seedBase + index) - 0.5;
    const duration = Math.max(5, Math.round(expected + noise * expected * 0.6));
    const volume = Math.max(1000, Math.round(volumeBase + noise * volumeBase * 0.4));

    return {
      run: `R${index + 1}`,
      duration,
      expected,
      volume,
    };
  });
};

function JobRow({ job, retryingJobId }: { job: BatchJob; retryingJobId: string | null }) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isRetrying = retryingJobId === job.jobId;
  const canRetry = job.status === 'FAILED' || job.status === 'WARNING';

  const formatDuration = (min?: number) => {
    if (min === undefined) return '--';
    return min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`;
  };

  const successColor =
    job.successRate === 100 ? theme.palette.success.main
    : (job.successRate ?? 0) > 90 ? theme.palette.warning.main
    : theme.palette.error.main;

  const chipBg = theme.palette.mode === 'light' ? 'rgba(0,47,108,0.06)' : 'rgba(255,255,255,0.06)';

  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{job.jobId}</Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{job.jobName}</Typography>
      </TableCell>
      <TableCell>
        <Chip label={LAYER_LABELS[job.layer]} size="small"
          sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary, backgroundColor: chipBg }} />
      </TableCell>
      <TableCell><StatusBadge status={job.status} /></TableCell>
      <TableCell>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          {job.startTime ? new Date(job.startTime).toLocaleTimeString('pt-BR') : '--'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          {formatDuration(job.durationMinutes)}
        </Typography>
      </TableCell>
      <TableCell>
        {job.successRate !== undefined ? (
          <Box>
            <Typography variant="caption" sx={{ color: successColor, fontWeight: 600 }}>
              {job.successRate.toFixed(1)}%
            </Typography>
            <LinearProgress variant="determinate" value={job.successRate}
              sx={{ mt: 0.5, height: 4, '& .MuiLinearProgress-bar': { backgroundColor: successColor } }} />
          </Box>
        ) : (
          <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>--</Typography>
        )}
      </TableCell>
      <TableCell sx={{ maxWidth: 200 }}>
        {job.errorMessage && (
          <Tooltip title={job.errorMessage}>
            <Typography variant="caption" sx={{
              color: theme.palette.error.main, display: 'block',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180,
            }}>
              {job.errorMessage}
            </Typography>
          </Tooltip>
        )}
      </TableCell>
      <TableCell>
        {canRetry && (
          <Button size="small" variant="outlined"
            startIcon={isRetrying ? <CircularProgress size={12} /> : <ReplayIcon fontSize="small" />}
            disabled={isRetrying}
            onClick={() => dispatch(retryBatchJob(job.jobId))}
            aria-label={`Reexecutar job ${job.jobId}`}
            sx={{ fontSize: '0.7rem', borderColor: theme.palette.secondary.main,
              color: theme.palette.secondary.main,
              '&:hover': { borderColor: theme.palette.secondary.main,
                backgroundColor: `${theme.palette.secondary.main}15` } }}>
            {isRetrying ? 'Reagendando...' : 'Reexecutar'}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function BatchMonitorPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { jobs, metrics, loading, retryingJobId } = useAppSelector((s) => s.batch);
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>('ALL');
  const [layerFilter, setLayerFilter] = useState<LayerFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  useEffect(() => {
    dispatch(fetchBatchJobs());
    dispatch(fetchBatchMetrics());
    const interval = setInterval(() => {
      dispatch(fetchBatchJobs());
      dispatch(fetchBatchMetrics());
    }, 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const matchesStatus = statusFilter === 'ALL' ? true : job.status === statusFilter;
        const matchesLayer = layerFilter === 'ALL' ? true : job.layer === layerFilter;
        const matchesSearch = searchTerm.trim().length === 0
          ? true
          : `${job.jobId} ${job.jobName}`.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesLayer && matchesSearch;
      }),
    [jobs, statusFilter, layerFilter, searchTerm]
  );

  const failedJobs = filteredJobs.filter((j) => j.status === 'FAILED');
  const runningJobs = filteredJobs.filter((j) => j.status === 'RUNNING');

  const timelineData = useMemo<TimelineEntry[]>(
    () =>
      filteredJobs.map((job) => ({
        jobId: job.jobId,
        expected: getExpectedDuration(job),
        actual: job.durationMinutes ?? getExpectedDuration(job),
      })),
    [filteredJobs]
  );

  const historyByJob = useMemo<Record<string, HistoryPoint[]>>(
    () =>
      jobs.reduce<Record<string, HistoryPoint[]>>((acc, job) => {
        acc[job.jobId] = buildHistoryForJob(job);
        return acc;
      }, {}),
    [jobs]
  );

  const baselineRows = useMemo<BaselineRow[]>(
    () =>
      jobs.map((job) => {
        const history = historyByJob[job.jobId] ?? [];
        const durations = history.map((point) => point.duration);
        const volumes = history.map((point) => point.volume);
        const avgDuration = durations.length === 0
          ? 0
          : Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
        const avgVolume = volumes.length === 0
          ? 0
          : Math.round(volumes.reduce((sum, value) => sum + value, 0) / volumes.length);

        return {
          jobId: job.jobId,
          jobName: job.jobName,
          p50: percentile(durations, 50),
          p95: percentile(durations, 95),
          avgDuration,
          avgVolume,
        };
      }),
    [historyByJob, jobs]
  );

  useEffect(() => {
    if (selectedJobId && jobs.some((job) => job.jobId === selectedJobId)) return;
    if (jobs.length > 0) {
      setSelectedJobId(jobs[0].jobId);
    }
  }, [jobs, selectedJobId]);

  const selectedHistory = selectedJobId ? historyByJob[selectedJobId] ?? [] : [];

  if (loading && jobs.length === 0) return <PageSkeleton />;

  const handleStatusChange = (event: SelectChangeEvent<string>): void => {
    const value = event.target.value;
    if (isStatusFilter(value)) setStatusFilter(value);
  };

  const handleLayerChange = (event: SelectChangeEvent<string>): void => {
    const value = event.target.value;
    if (isLayerFilter(value)) setLayerFilter(value);
  };

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterAltIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
              <Typography variant="h6">Filtros de execução</Typography>
            </Box>
            <Button
              size="small"
              onClick={() => {
                setStatusFilter('ALL');
                setLayerFilter('ALL');
                setSearchTerm('');
              }}
            >
              Limpar filtros
            </Button>
          </Stack>

          <Grid container spacing={1.5} sx={{ mt: 0.2 }}>
            <Grid item xs={12} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel id="batch-status-label">Status</InputLabel>
                <Select
                  labelId="batch-status-label"
                  label="Status"
                  value={statusFilter}
                  onChange={handleStatusChange}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel id="batch-layer-label">Camada</InputLabel>
                <Select
                  labelId="batch-layer-label"
                  label="Camada"
                  value={layerFilter}
                  onChange={handleLayerChange}
                >
                  <MenuItem value="ALL">Todas</MenuItem>
                  <MenuItem value="INGESTION">Ingestão</MenuItem>
                  <MenuItem value="TRUSTED">Trusted</MenuItem>
                  <MenuItem value="ANALYTICS">Analytics</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Buscar por job"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Ex: ETL-047, Trusted Sync"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {failedJobs.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>{failedJobs.length} job(s) falharam</strong>:{' '}
          {failedJobs.map((j) => j.jobId).join(', ')} — verifique as causas e reexecute.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {metrics && [
          { label: 'Taxa de Sucesso', value: `${metrics.successRate.toFixed(1)}%`,
            color: metrics.successRate >= 80 ? theme.palette.success.main : theme.palette.error.main },
          { label: 'Jobs com Falha', value: metrics.failedToday,
            color: metrics.failedToday > 0 ? theme.palette.error.main : theme.palette.success.main },
          { label: 'Duração Média', value: `${metrics.avgDurationMinutes}min`, color: theme.palette.text.secondary },
          { label: 'Jobs Pendentes', value: metrics.pendingJobs, color: theme.palette.text.disabled },
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

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 0.6 }}>
                <TimelineIcon fontSize="small" sx={{ mr: 0.8, verticalAlign: 'middle' }} />
                Timeline de execução (real x esperada)
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 2 }}>
                Comparativo do tempo esperado (baseline) com duração real por job
              </Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={timelineData}
                    margin={{ top: 8, right: 10, left: 18, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis type="number" tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} />
                    <YAxis type="category" dataKey="jobId" width={78} tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="expected" name="Esperado (min)" fill={`${theme.palette.info.main}88`} />
                    <Bar dataKey="actual" name="Real (min)" fill={theme.palette.secondary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 0.6 }}>Baseline histórico (P50/P95)</Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 2 }}>
                Selecione um job para visualizar tendência de duração
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Job</TableCell>
                    <TableCell>P50</TableCell>
                    <TableCell>P95</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {baselineRows.map((row) => (
                    <TableRow
                      key={row.jobId}
                      hover
                      onClick={() => setSelectedJobId(row.jobId)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor:
                          selectedJobId === row.jobId
                            ? `${theme.palette.secondary.main}14`
                            : 'transparent',
                      }}
                    >
                      <TableCell>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{row.jobId}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary }}>
                          {row.jobName}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary }}>
                          {row.avgVolume.toLocaleString('pt-BR')} rec médios
                        </Typography>
                      </TableCell>
                      <TableCell>{row.p50}min</TableCell>
                      <TableCell>{row.p95}min</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 0.6 }}>
            Histórico de execuções — {selectedJobId || 'N/A'}
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 2 }}>
            Base para detecção de anomalias e previsão de estouro de janela
          </Typography>
          <Box sx={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedHistory} margin={{ top: 5, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="run" tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} />
                <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="expected" name="Esperado" stroke={theme.palette.info.main} strokeDasharray="4 2" dot={false} />
                <Line type="monotone" dataKey="duration" name="Executado" stroke={theme.palette.secondary.main} strokeWidth={2.3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {runningJobs.length > 0 && (
        <Card sx={{ mb: 2, border: `1px solid ${theme.palette.info.main}30`,
          backgroundColor: `${theme.palette.info.main}08` }}>
          <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} sx={{ color: theme.palette.info.main }} />
            <Typography variant="body2">
              <strong>{runningJobs.length} job(s) em execução:</strong>{' '}
              {runningJobs.map((j) => j.jobName).join(', ')}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h5" sx={{ mb: 0.5 }}>Jobs de Batch</Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 2 }}>
            Monitoramento em tempo real (atualização a cada 15s)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Job</TableCell>
                  <TableCell>Camada</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Início</TableCell>
                  <TableCell>Duração</TableCell>
                  <TableCell>Sucesso</TableCell>
                  <TableCell>Erro</TableCell>
                  <TableCell>Ação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredJobs.map((job) => (
                  <JobRow key={job.jobId} job={job} retryingJobId={retryingJobId} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
