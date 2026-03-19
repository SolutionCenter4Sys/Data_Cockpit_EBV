import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, LinearProgress,
  Alert, useTheme,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchPipelineRuns, fetchPipelineDetail, clearSelected } from '../../app/slices/lineageSlice';
import StatusBadge from '../components/StatusBadge';
import PageSkeleton from '../components/PageSkeleton';
import type { PipelineRun, LineageNode } from '../../domain/entities';

const LAYER_LABELS: Record<string, string> = {
  INGESTION: 'Ingestão', TRUSTED: 'Trusted', ANALYTICS: 'Analytics',
};
const LAYER_ORDER = ['INGESTION', 'TRUSTED', 'ANALYTICS'];

function LayerNodes({ nodes, layer, isLight }: { nodes: LineageNode[]; layer: string; isLight: boolean }) {
  const theme = useTheme();
  const layerColor =
    layer === 'INGESTION' ? theme.palette.secondary.main
    : layer === 'TRUSTED' ? theme.palette.primary.main
    : '#F5A623';

  const flowBg = isLight ? 'rgba(0,47,108,0.04)' : 'rgba(255,255,255,0.03)';
  const flowBorder = isLight ? 'rgba(0,47,108,0.10)' : 'rgba(255,255,255,0.06)';

  return (
    <Box sx={{ flex: 1, minWidth: 160, p: 2.5, borderRadius: 2,
      backgroundColor: flowBg, border: `1px solid ${flowBorder}`,
      borderTop: `3px solid ${layerColor}` }}>
      <Typography variant="overline" sx={{ color: layerColor, display: 'block', mb: 1.5 }}>
        {LAYER_LABELS[layer]}
      </Typography>
      {nodes.length === 0 ? (
        <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>Sem nós</Typography>
      ) : (
        nodes.map((node) => (
          <Box key={node.id} sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                {node.name}
              </Typography>
              <StatusBadge status={node.status} showDot />
            </Box>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
              {node.type}
            </Typography>
            {node.recordCount !== undefined && (
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled, display: 'block' }}>
                {node.recordCount.toLocaleString('pt-BR')} registros
              </Typography>
            )}
          </Box>
        ))
      )}
    </Box>
  );
}

function RunDetail({ run }: { run: PipelineRun }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const arrowColor = isLight ? 'rgba(0,47,108,0.25)' : 'rgba(255,255,255,0.2)';
  const completionPct = run.stepsTotal > 0 ? (run.stepsCompleted / run.stepsTotal) * 100 : 0;
  const completionColor =
    run.stepsFailled > 0 ? theme.palette.error.main
    : completionPct === 100 ? theme.palette.success.main
    : theme.palette.warning.main;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h5">{run.pipelineName}</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: 'monospace' }}>
              {run.runId}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Passos</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                <span style={{ color: theme.palette.success.main }}>{run.stepsCompleted}</span>
                {' / '}{run.stepsTotal}
                {run.stepsFailled > 0 && (
                  <span style={{ color: theme.palette.error.main }}> ({run.stepsFailled} falha)</span>
                )}
              </Typography>
            </Box>
            <StatusBadge status={run.status} />
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={completionPct}
          sx={{ mb: 3, height: 6, borderRadius: 3,
            '& .MuiLinearProgress-bar': { backgroundColor: completionColor } }}
        />

        {run.nodes.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Grafo de Lineage</Typography>
            <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0, overflowX: 'auto', pb: 2 }}>
              {LAYER_ORDER.map((layer, i) => {
                const layerNodes = run.nodes.filter((n) => n.layer === layer);
                return (
                  <Box key={layer} sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <LayerNodes nodes={layerNodes} layer={layer} isLight={isLight} />
                    {i < LAYER_ORDER.length - 1 && (
                      <Box sx={{ px: 1, flexShrink: 0, color: arrowColor, fontSize: '1.5rem', lineHeight: 1 }}>
                        →
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function LineagePage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { runs, selectedRun, loading } = useAppSelector((s) => s.lineage);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchPipelineRuns());
    return () => { dispatch(clearSelected()); };
  }, [dispatch]);

  const handleSelectRun = (runId: string) => {
    if (selectedId === runId) {
      setSelectedId(null);
      dispatch(clearSelected());
    } else {
      setSelectedId(runId);
      dispatch(fetchPipelineDetail(runId));
    }
  };

  const failedRuns = runs.filter((r) => r.status === 'FAILED');
  const chipBg = isLight ? 'rgba(0,47,108,0.06)' : 'rgba(255,255,255,0.06)';

  if (loading && runs.length === 0) return <PageSkeleton />;

  return (
    <Box>
      {failedRuns.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>{failedRuns.length} pipeline(s) falharam:</strong>{' '}
          {failedRuns.map((r) => r.pipelineName).join(', ')}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Pipelines', value: runs.length, color: theme.palette.text.secondary },
          { label: 'Com Falha', value: failedRuns.length, color: failedRuns.length > 0 ? theme.palette.error.main : theme.palette.success.main },
          { label: 'Em Execução', value: runs.filter((r) => r.status === 'RUNNING').length, color: theme.palette.info.main },
          { label: 'Concluídos', value: runs.filter((r) => r.status === 'SUCCESS').length, color: theme.palette.success.main },
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

      {selectedRun && selectedId && <RunDetail run={selectedRun} />}

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h5" sx={{ mb: 0.5 }}>Execuções de Pipelines</Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 2 }}>
            Clique em uma linha para ver o grafo de lineage e detalhes
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Pipeline</TableCell>
                  <TableCell>Camada</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Passos</TableCell>
                  <TableCell>Progresso</TableCell>
                  <TableCell>Início</TableCell>
                  <TableCell>Nós</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {runs.map((run) => {
                  const isSelected = selectedId === run.runId;
                  const pct = run.stepsTotal > 0 ? (run.stepsCompleted / run.stepsTotal) * 100 : 0;
                  const pctColor =
                    run.stepsFailled > 0 ? theme.palette.error.main
                    : pct === 100 ? theme.palette.success.main
                    : theme.palette.warning.main;

                  return (
                    <TableRow
                      key={run.runId}
                      onClick={() => handleSelectRun(run.runId)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: isSelected
                          ? (isLight ? 'rgba(227,24,55,0.05)' : 'rgba(227,24,55,0.08)')
                          : 'transparent',
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{run.pipelineName}</Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontFamily: 'monospace' }}>
                          {run.runId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={LAYER_LABELS[run.layer]} size="small"
                          sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary, backgroundColor: chipBg }} />
                      </TableCell>
                      <TableCell><StatusBadge status={run.status} /></TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          <span style={{ color: theme.palette.success.main, fontWeight: 600 }}>{run.stepsCompleted}</span>
                          {' / '}{run.stepsTotal}
                          {run.stepsFailled > 0 && (
                            <span style={{ color: theme.palette.error.main }}> · {run.stepsFailled}✗</span>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 100 }}>
                        <LinearProgress variant="determinate" value={pct}
                          sx={{ height: 5, borderRadius: 3,
                            '& .MuiLinearProgress-bar': { backgroundColor: pctColor } }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {new Date(run.startTime).toLocaleString('pt-BR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {run.nodes.length} nós · {run.edges.length} conexões
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
