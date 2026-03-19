import { useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, CircularProgress,
  Tooltip, LinearProgress, Alert, Chip, useTheme,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchBatchJobs, fetchBatchMetrics, retryBatchJob } from '../../app/slices/batchSlice';
import StatusBadge from '../components/StatusBadge';
import PageSkeleton from '../components/PageSkeleton';
import type { BatchJob } from '../../domain/entities';

const LAYER_LABELS: Record<string, string> = {
  INGESTION: 'Ingestão', TRUSTED: 'Trusted', ANALYTICS: 'Analytics',
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

  useEffect(() => {
    dispatch(fetchBatchJobs());
    dispatch(fetchBatchMetrics());
    const interval = setInterval(() => {
      dispatch(fetchBatchJobs());
      dispatch(fetchBatchMetrics());
    }, 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const failedJobs = jobs.filter((j) => j.status === 'FAILED');
  const runningJobs = jobs.filter((j) => j.status === 'RUNNING');

  if (loading && jobs.length === 0) return <PageSkeleton />;

  return (
    <Box>
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
                {jobs.map((job) => (
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
