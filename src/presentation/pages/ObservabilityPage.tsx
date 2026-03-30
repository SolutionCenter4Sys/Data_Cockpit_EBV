import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Grid, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, useTheme,
  LinearProgress, Stack, Tabs, Tab, IconButton,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchPipelineRuns } from "../../app/slices/lineageSlice";
import KpiCard from "../components/KpiCard";
import StatusBadge from "../components/StatusBadge";
import PageSkeleton from "../components/PageSkeleton";

const LAYER_LABELS: Record<string, string> = {
  INGESTION: "Ingestão", TRUSTED: "Trusted", ANALYTICS: "Analytics",
};

export default function ObservabilityPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { runs, loading } = useAppSelector((s) => s.lineage);
  const [tab, setTab] = useState(0);

  useEffect(() => { dispatch(fetchPipelineRuns()); }, [dispatch]);

  if (loading && runs.length === 0) return <PageSkeleton cards={4} rows={8} />;

  const running = runs.filter((r) => r.status === "RUNNING");
  const failed = runs.filter((r) => r.status === "FAILED");
  const success = runs.filter((r) => r.status === "SUCCESS");
  const avgSteps = runs.length > 0
    ? Math.round(runs.reduce((sum, r) => sum + r.stepsCompleted, 0) / runs.length)
    : 0;

  const byLayer = runs.reduce<Record<string, typeof runs>>((acc, r) => {
    acc[r.layer] = acc[r.layer] || [];
    acc[r.layer].push(r);
    return acc;
  }, {});

  const displayRuns = tab === 0 ? runs : tab === 1 ? running : tab === 2 ? failed : success;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Pipelines Ativos" value={runs.length} trend="STABLE" trendValue={`${running.length} em execução`} severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Com Falha" value={failed.length} trend={failed.length > 0 ? "DOWN" : "STABLE"} trendValue="agora" severity={failed.length > 0 ? "CRITICAL" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Taxa de Sucesso" value={`${runs.length > 0 ? Math.round((success.length / runs.length) * 100) : 0}%`} trend="UP" trendValue="últimas 24h" severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Passos Médios" value={avgSteps} trend="STABLE" trendValue="por pipeline" severity="MEDIUM" />
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Saúde por Camada</Typography>
          <Grid container spacing={2}>
            {Object.entries(byLayer).map(([layer, layerRuns]) => {
              const failedCount = layerRuns.filter((r) => r.status === "FAILED").length;
              const successRate = layerRuns.length > 0 ? Math.round(((layerRuns.length - failedCount) / layerRuns.length) * 100) : 0;
              const color = successRate >= 90 ? theme.palette.success.main : successRate >= 70 ? theme.palette.warning.main : theme.palette.error.main;
              return (
                <Grid item xs={12} sm={4} key={layer}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Typography variant="subtitle2" fontWeight={700}>{LAYER_LABELS[layer] || layer}</Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ color, my: 0.5 }}>{successRate}%</Typography>
                      <LinearProgress variant="determinate" value={successRate} sx={{ mb: 1, "& .MuiLinearProgress-bar": { bgcolor: color } }} />
                      <Stack direction="row" spacing={1}>
                        <Chip label={`${layerRuns.length} pipelines`} size="small" variant="outlined" />
                        {failedCount > 0 && <Chip label={`${failedCount} falhas`} size="small" color="error" />}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 2.5, pt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary">
            <Tab label={`Todos (${runs.length})`} />
            <Tab label={`Em Execução (${running.length})`} />
            <Tab label={`Falhas (${failed.length})`} />
            <Tab label={`Sucesso (${success.length})`} />
          </Tabs>
          <IconButton size="small" onClick={() => dispatch(fetchPipelineRuns())}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="caption" fontWeight={700}>Pipeline</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={700}>Camada</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={700}>Status</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={700}>Progresso</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={700}>Início</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={700}>Nós</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayRuns.map((run) => {
                const pct = run.stepsTotal > 0 ? (run.stepsCompleted / run.stepsTotal) * 100 : 0;
                const pctColor = run.stepsFailled > 0 ? theme.palette.error.main : pct === 100 ? theme.palette.success.main : theme.palette.warning.main;
                return (
                  <TableRow key={run.runId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{run.pipelineName}</Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace" }}>{run.runId}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={LAYER_LABELS[run.layer] || run.layer} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell><StatusBadge status={run.status} /></TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      <LinearProgress variant="determinate" value={pct} sx={{ height: 5, borderRadius: 3, "& .MuiLinearProgress-bar": { bgcolor: pctColor } }} />
                      <Typography variant="caption" color="text.secondary">{run.stepsCompleted}/{run.stepsTotal}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(run.startTime).toLocaleString("pt-BR")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{run.nodes.length} nós</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
