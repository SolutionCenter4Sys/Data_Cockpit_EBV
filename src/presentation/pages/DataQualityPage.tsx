import { useEffect, useState } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button, useTheme, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, IconButton, LinearProgress, CircularProgress,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Tooltip as RechartsTooltip,
} from "recharts";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchTests, fetchIndicators, runTest, createTest } from "../../app/slices/dataQualitySlice";
import type { TestResult, SeverityLevel } from "../../domain/entities";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const RESULT_CONFIG: Record<TestResult, { icon: React.ReactElement; color: "success" | "error" | "warning" | "default"; label: string }> = {
  PASS: { icon: <CheckCircleIcon fontSize="small" />, color: "success", label: "PASS" },
  FAIL: { icon: <CancelIcon fontSize="small" />, color: "error", label: "FAIL" },
  ERROR: { icon: <ErrorOutlineIcon fontSize="small" />, color: "warning", label: "ERROR" },
  PENDING: { icon: <HourglassEmptyIcon fontSize="small" />, color: "default", label: "PENDENTE" },
};

const EMPTY_FORM = { name: "", sourceId: "", sourceName: "", query: "", expectedResult: "", schedule: "0 * * * *", createdBy: "", severity: "MEDIUM" as SeverityLevel, description: "" };

export default function DataQualityPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { tests, indicators, loading } = useAppSelector((s) => s.dataQuality);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    dispatch(fetchTests());
    dispatch(fetchIndicators());
  }, [dispatch]);

  const handleRun = async (testId: string) => {
    setRunningId(testId);
    await dispatch(runTest(testId));
    setRunningId(null);
  };

  const handleCreate = () => {
    if (!form.name || !form.query) return;
    dispatch(createTest(form));
    setDialogOpen(false);
    setForm(EMPTY_FORM);
  };

  const passCount = tests.filter((t) => t.lastResult === "PASS").length;
  const failCount = tests.filter((t) => t.lastResult === "FAIL").length;
  const avgScore = indicators.length > 0 ? Math.round(indicators.reduce((a, i) => a + i.overallScore, 0) / indicators.length) : 0;

  if (loading && tests.length === 0) return <PageSkeleton cards={4} rows={6} />;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <FactCheckIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>Qualidade de Dados</Typography>
          <Typography variant="body2" color="text.secondary">Testes SQL, indicadores de qualidade por pipeline e dimensões de dados</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => setDialogOpen(true)}>
          Novo Teste
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Total Testes" value={tests.length} trend="STABLE" trendValue="cadastrados" severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Passando" value={passCount} trend="UP" trendValue={`${tests.length > 0 ? Math.round((passCount / tests.length) * 100) : 0}%`} severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Falhando" value={failCount} trend={failCount > 0 ? "DOWN" : "STABLE"} trendValue={`${failCount} teste(s)`} severity={failCount > 0 ? "CRITICAL" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Score Médio" value={`${avgScore}%`} trend={avgScore >= 85 ? "UP" : "DOWN"} trendValue="todas pipelines" severity={avgScore >= 85 ? "HEALTHY" : "MEDIUM"} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Indicadores por Pipeline</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><Typography variant="caption" fontWeight={600}>Pipeline</Typography></TableCell>
                      <TableCell><Typography variant="caption" fontWeight={600}>Camada</Typography></TableCell>
                      <TableCell align="center"><Typography variant="caption" fontWeight={600}>Completude</Typography></TableCell>
                      <TableCell align="center"><Typography variant="caption" fontWeight={600}>Acurácia</Typography></TableCell>
                      <TableCell align="center"><Typography variant="caption" fontWeight={600}>Freshness</Typography></TableCell>
                      <TableCell align="center"><Typography variant="caption" fontWeight={600}>Consistência</Typography></TableCell>
                      <TableCell><Typography variant="caption" fontWeight={600}>Score</Typography></TableCell>
                      <TableCell align="center"><Typography variant="caption" fontWeight={600}>Testes</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {indicators.map((ind) => (
                      <TableRow key={ind.pipeline} hover>
                        <TableCell><Typography variant="body2" fontWeight={600}>{ind.pipeline}</Typography></TableCell>
                        <TableCell><Chip label={ind.layer} size="small" variant="outlined" sx={{ fontSize: "0.6rem" }} /></TableCell>
                        <TableCell align="center"><Typography variant="body2" color={ind.completeness >= 90 ? "success.main" : "warning.main"}>{ind.completeness}%</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2" color={ind.accuracy >= 90 ? "success.main" : "warning.main"}>{ind.accuracy}%</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2" color={ind.freshness >= 90 ? "success.main" : "warning.main"}>{ind.freshness}%</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2" color={ind.consistency >= 90 ? "success.main" : "warning.main"}>{ind.consistency}%</Typography></TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <LinearProgress variant="determinate" value={ind.overallScore} color={ind.overallScore >= 90 ? "success" : ind.overallScore >= 75 ? "warning" : "error"} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                            <Typography variant="caption" fontWeight={700}>{ind.overallScore}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            <span style={{ color: theme.palette.success.main, fontWeight: 600 }}>{ind.testsPassing}</span>
                            /{ind.testsTotal}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Dimensões de Qualidade</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={indicators.map((i) => ({
                  pipeline: i.pipeline.replace("Pipeline ", ""),
                  Completude: i.completeness, Acurácia: i.accuracy,
                  Freshness: i.freshness, Consistência: i.consistency,
                }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="pipeline" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Completude" dataKey="Completude" stroke={theme.palette.primary.main} fill={theme.palette.primary.main} fillOpacity={0.15} />
                  <Radar name="Acurácia" dataKey="Acurácia" stroke={theme.palette.success.main} fill={theme.palette.success.main} fillOpacity={0.15} />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Testes de Qualidade SQL</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><Typography variant="caption" fontWeight={600}>Teste</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600}>Fonte</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600}>Query</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600}>Esperado</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600}>Resultado</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600}>Severidade</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={600}>Última Exec.</Typography></TableCell>
                  <TableCell align="center"><Typography variant="caption" fontWeight={600}>Ação</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tests.map((test) => {
                  const cfg = RESULT_CONFIG[test.lastResult];
                  return (
                    <TableRow key={test.id} hover sx={{
                      bgcolor: test.lastResult === "FAIL" ? (theme.palette.mode === "light" ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.06)") : "transparent",
                    }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{test.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{test.description}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="caption">{test.sourceName}</Typography></TableCell>
                      <TableCell>
                        <Box sx={{ fontFamily: "monospace", fontSize: "0.68rem", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {test.query}
                        </Box>
                      </TableCell>
                      <TableCell><Chip label={test.expectedResult} size="small" variant="outlined" sx={{ fontFamily: "monospace", fontSize: "0.65rem" }} /></TableCell>
                      <TableCell><Chip icon={cfg.icon} label={cfg.label} size="small" color={cfg.color} sx={{ fontWeight: 700 }} /></TableCell>
                      <TableCell>
                        <Chip label={test.severity} size="small"
                          color={test.severity === "CRITICAL" ? "error" : test.severity === "HIGH" ? "warning" : "default"} variant="outlined" sx={{ fontSize: "0.6rem" }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {test.lastRunAt ? new Date(test.lastRunAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" onClick={() => handleRun(test.id)} disabled={runningId === test.id}>
                          {runningId === test.id ? <CircularProgress size={16} /> : <PlayArrowIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Novo Teste de Qualidade SQL</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nome do Teste" fullWidth size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Descrição" fullWidth size="small" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Fonte (ID)" fullWidth size="small" value={form.sourceId} onChange={(e) => setForm({ ...form, sourceId: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Nome da Fonte" fullWidth size="small" value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} />
              </Grid>
            </Grid>
            <TextField
              label="Query SQL" fullWidth multiline rows={4}
              value={form.query}
              onChange={(e) => setForm({ ...form, query: e.target.value })}
              InputProps={{ sx: { fontFamily: "monospace", fontSize: "0.85rem" } }}
              placeholder="SELECT COUNT(*) FROM tabela WHERE condição"
            />
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField label="Resultado Esperado" fullWidth size="small" value={form.expectedResult} onChange={(e) => setForm({ ...form, expectedResult: e.target.value })} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Schedule (cron)" fullWidth size="small" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Severidade</InputLabel>
                  <Select value={form.severity} label="Severidade" onChange={(e: SelectChangeEvent) => setForm({ ...form, severity: e.target.value as SeverityLevel })}>
                    <MenuItem value="CRITICAL">Critical</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="LOW">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField label="Criado por" fullWidth size="small" value={form.createdBy} onChange={(e) => setForm({ ...form, createdBy: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name || !form.query}>Criar Teste</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
