import { useEffect, useState, useMemo } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button, useTheme, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, IconButton, LinearProgress, CircularProgress,
  Tabs, Tab, InputAdornment, alpha,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import SearchIcon from "@mui/icons-material/Search";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { useAppDispatch, useAppSelector } from "../../app/store";
import {
  fetchTests, fetchIndicators, fetchTestSuites, runTest, createTest,
  setSearchTerm, setFilter, clearFilters,
} from "../../app/slices/dataQualitySlice";
import type { TestResult, SeverityLevel, IncidentStatus } from "../../domain/entities";
import PageSkeleton from "../components/PageSkeleton";

const STATUS_CONFIG: Record<TestResult, { label: string; bg: string; color: string; icon: React.ReactElement }> = {
  PASS: { label: "Success", bg: "#E6F4EA", color: "#1E7E34", icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
  FAIL: { label: "Failure", bg: "#FDECEC", color: "#C62828", icon: <CancelIcon sx={{ fontSize: 14 }} /> },
  ERROR: { label: "Aborted", bg: "#FFF8E1", color: "#E65100", icon: <ErrorOutlineIcon sx={{ fontSize: 14 }} /> },
  PENDING: { label: "Pending", bg: "#E3F2FD", color: "#1565C0", icon: <HourglassEmptyIcon sx={{ fontSize: 14 }} /> },
};

const INCIDENT_CONFIG: Record<IncidentStatus, { label: string; color: "success" | "error" | "warning" | "default" }> = {
  RESOLVED: { label: "Resolvido", color: "success" },
  OPEN: { label: "Aberto", color: "error" },
  ACKNOWLEDGED: { label: "Reconhecido", color: "warning" },
  NONE: { label: "---", color: "default" },
};

const PIE_COLORS: Record<string, string> = {
  Success: "#4CAF50",
  Failure: "#F44336",
  Aborted: "#FF9800",
  Pending: "#2196F3",
};

const EMPTY_FORM = {
  name: "", sourceId: "", sourceName: "", query: "", expectedResult: "",
  schedule: "0 * * * *", createdBy: "", severity: "MEDIUM" as SeverityLevel,
  description: "", tableName: "", columnName: "", failureReason: "--",
};

export default function DataQualityPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { tests, indicators, testSuites, loading, searchTerm, filters } = useAppSelector((s) => s.dataQuality);
  const [tabIndex, setTabIndex] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showAdvanced, setShowAdvanced] = useState(true);

  useEffect(() => {
    dispatch(fetchTests());
    dispatch(fetchIndicators());
    dispatch(fetchTestSuites());
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

  const filteredTests = useMemo(() => {
    let result = [...tests];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((t) =>
        t.name.toLowerCase().includes(lower) ||
        t.tableName.toLowerCase().includes(lower) ||
        t.columnName.toLowerCase().includes(lower)
      );
    }
    if (filters.table) result = result.filter((t) => t.tableName === filters.table);
    if (filters.status) result = result.filter((t) => t.lastResult === filters.status);
    return result;
  }, [tests, searchTerm, filters]);

  const uniqueTables = useMemo(() => [...new Set(tests.map((t) => t.tableName))], [tests]);

  const passCount = tests.filter((t) => t.lastResult === "PASS").length;
  const failCount = tests.filter((t) => t.lastResult === "FAIL").length;
  const errorCount = tests.filter((t) => t.lastResult === "ERROR").length;
  const pendingCount = tests.filter((t) => t.lastResult === "PENDING").length;
  const successPct = tests.length > 0 ? Math.round((passCount / tests.length) * 100) : 0;

  const healthyAssets = useMemo(() => {
    const tables = [...new Set(tests.map((t) => t.tableName))];
    const healthy = tables.filter((tbl) => {
      const tblTests = tests.filter((t) => t.tableName === tbl);
      return tblTests.every((t) => t.lastResult === "PASS" || t.lastResult === "PENDING");
    });
    return { total: tables.length, healthy: healthy.length };
  }, [tests]);

  const healthyPct = healthyAssets.total > 0 ? Math.round((healthyAssets.healthy / healthyAssets.total) * 100) : 0;
  const coveragePct = useMemo(() => {
    const totalColumns = 120;
    const testedColumns = [...new Set(tests.filter((t) => t.columnName !== "--").map((t) => t.columnName))].length;
    return ((testedColumns / totalColumns) * 100).toFixed(2);
  }, [tests]);

  const pieData = [
    { name: "Success", value: passCount },
    { name: "Failure", value: failCount },
    { name: "Aborted", value: errorCount },
    { name: "Pending", value: pendingCount },
  ].filter((d) => d.value > 0);

  const healthPieData = [
    { name: "Saudável", value: healthyAssets.healthy },
    { name: "Com falhas", value: healthyAssets.total - healthyAssets.healthy },
  ];

  if (loading && tests.length === 0) return <PageSkeleton cards={3} rows={8} />;

  const isDark = theme.palette.mode === "dark";
  const cardBg = isDark ? "#1E1E2E" : "#FFFFFF";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h5" fontWeight={700}>Qualidade de Dados</Typography>
          <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.secondary", cursor: "pointer" }} />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Adicionar Caso de Teste
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Construa confiança em seus dados com testes de qualidade e crie produtos de dados confiáveis.
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ minHeight: 36 }}>
          <Tab label="Casos de Teste" sx={{ textTransform: "none", fontWeight: 600, minHeight: 36, py: 0.5 }} />
          <Tab label="Conjuntos de Testes" sx={{ textTransform: "none", fontWeight: 600, minHeight: 36, py: 0.5 }} />
        </Tabs>
      </Box>

      {/* Tab 0: Casos de Teste */}
      {tabIndex === 0 && (
        <Box>
          {/* Filters */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
            <Chip
              icon={<TuneIcon sx={{ fontSize: 16 }} />}
              label="Avançado"
              variant={showAdvanced ? "filled" : "outlined"}
              color={showAdvanced ? "primary" : "default"}
              onClick={() => setShowAdvanced(!showAdvanced)}
              size="small"
              sx={{ fontWeight: 600 }}
            />
            {showAdvanced && (
              <>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Tabela</InputLabel>
                  <Select
                    value={filters.table}
                    label="Tabela"
                    onChange={(e: SelectChangeEvent) => dispatch(setFilter({ key: "table", value: e.target.value }))}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {uniqueTables.map((t) => (
                      <MenuItem key={t} value={t}>
                        <Typography variant="caption" noWrap sx={{ maxWidth: 200 }}>{t.split(".").pop()}</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select value={filters.type} label="Tipo" onChange={(e: SelectChangeEvent) => dispatch(setFilter({ key: "type", value: e.target.value }))}>
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="column">Coluna</MenuItem>
                    <MenuItem value="table">Tabela</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={filters.status} label="Status" onChange={(e: SelectChangeEvent) => dispatch(setFilter({ key: "status", value: e.target.value }))}>
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="PASS">Success</MenuItem>
                    <MenuItem value="FAIL">Failure</MenuItem>
                    <MenuItem value="ERROR">Aborted</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small" placeholder="Tags" sx={{ width: 120 }}
                  value={filters.tags}
                  onChange={(e) => dispatch(setFilter({ key: "tags", value: e.target.value }))}
                />
                {(filters.table || filters.status || filters.type || filters.tags) && (
                  <Chip label="Limpar" size="small" variant="outlined" onDelete={() => dispatch(clearFilters())} />
                )}
              </>
            )}
          </Box>

          {/* KPIs - OpenMetadata style */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Total de Testes */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ border: `1px solid ${borderColor}`, bgcolor: cardBg }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: theme.palette.primary.main }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Total de Testes</Typography>
                      </Box>
                      <Typography variant="h3" fontWeight={700} color="text.primary">{tests.length}</Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                        {pieData.map((d) => (
                          <Box key={d.name} sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: PIE_COLORS[d.name] }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                              {d.name} {d.value}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                    <Box sx={{ width: 80, height: 80, position: "relative" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData} dataKey="value" cx="50%" cy="50%"
                            innerRadius={22} outerRadius={36} strokeWidth={0}
                          >
                            {pieData.map((d) => (
                              <Cell key={d.name} fill={PIE_COLORS[d.name]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <Box sx={{
                        position: "absolute", top: "50%", left: "50%",
                        transform: "translate(-50%,-50%)", textAlign: "center",
                      }}>
                        <Typography variant="caption" fontWeight={800} sx={{ fontSize: "0.7rem", lineHeight: 1 }}>
                          {successPct}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Ativos de dados saudáveis */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ border: `1px solid ${borderColor}`, bgcolor: cardBg }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#4CAF50" }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Ativos de dados saudáveis</Typography>
                      </Box>
                      <Typography variant="h3" fontWeight={700} color="text.primary">{healthyAssets.total}</Typography>
                    </Box>
                    <Box sx={{ width: 80, height: 80, position: "relative" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={healthPieData} dataKey="value" cx="50%" cy="50%"
                            innerRadius={22} outerRadius={36} strokeWidth={0}
                          >
                            <Cell fill="#4CAF50" />
                            <Cell fill={isDark ? "#333" : "#E0E0E0"} />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <Box sx={{
                        position: "absolute", top: "50%", left: "50%",
                        transform: "translate(-50%,-50%)", textAlign: "center",
                      }}>
                        <Typography variant="caption" fontWeight={800} sx={{ fontSize: "0.7rem", lineHeight: 1, color: "#4CAF50" }}>
                          {healthyPct}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Cobertura de ativos de dados */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ border: `1px solid ${borderColor}`, bgcolor: cardBg }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: theme.palette.info.main }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Cobertura de ativos de dados</Typography>
                  </Box>
                  <Typography variant="h3" fontWeight={700} color="text.primary">
                    {[...new Set(tests.filter((t) => t.columnName !== "--").map((t) => t.columnName))].length}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(coveragePct)}
                      sx={{
                        flex: 1, height: 8, borderRadius: 4,
                        bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                        "& .MuiLinearProgress-bar": { borderRadius: 4 },
                      }}
                    />
                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                      {coveragePct}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Insights de Casos de Teste */}
          <Card sx={{ border: `1px solid ${borderColor}`, bgcolor: cardBg }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>Insights de Casos de Teste</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Acesse uma visão centralizada de saúde do seu dataset baseada em validações de teste configuradas.
                  </Typography>
                </Box>
                <TextField
                  size="small" placeholder="Pesquisar caso de teste"
                  value={searchTerm}
                  onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 260 }}
                />
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><Typography variant="caption" fontWeight={700}>Status</Typography></TableCell>
                      <TableCell><Typography variant="caption" fontWeight={700}>Motivo da falha/cancelamento</Typography></TableCell>
                      <TableCell><Typography variant="caption" fontWeight={700}>Última Execução</Typography></TableCell>
                      <TableCell><Typography variant="caption" fontWeight={700}>Nome</Typography></TableCell>
                      <TableCell><Typography variant="caption" fontWeight={700}>Tabela</Typography></TableCell>
                      <TableCell><Typography variant="caption" fontWeight={700}>Coluna</Typography></TableCell>
                      <TableCell><Typography variant="caption" fontWeight={700}>Incidente</Typography></TableCell>
                      <TableCell align="center" sx={{ width: 48 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTests.map((test) => {
                      const cfg = STATUS_CONFIG[test.lastResult];
                      const inc = INCIDENT_CONFIG[test.incidentStatus];
                      return (
                        <TableRow key={test.id} hover>
                          <TableCell>
                            <Chip
                              icon={cfg.icon}
                              label={cfg.label}
                              size="small"
                              sx={{
                                bgcolor: alpha(cfg.color, 0.12),
                                color: cfg.color,
                                fontWeight: 700, fontSize: "0.68rem",
                                "& .MuiChip-icon": { color: cfg.color },
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 220, display: "block" }}>
                              {test.failureReason !== "--" ? test.failureReason : "--"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                              {test.lastRunAt
                                ? new Date(test.lastRunAt).toLocaleString("pt-BR", {
                                    day: "numeric", month: "long", year: "numeric",
                                    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
                                  })
                                : "--"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2" fontWeight={600}
                              sx={{ color: theme.palette.primary.main, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                            >
                              {test.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "0.65rem" }}>
                              {test.tableName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">{test.columnName}</Typography>
                          </TableCell>
                          <TableCell>
                            {test.incidentStatus !== "NONE" ? (
                              <Chip label={inc.label} size="small" color={inc.color} variant="outlined" sx={{ fontWeight: 600, fontSize: "0.65rem" }} />
                            ) : (
                              <Typography variant="caption" color="text.disabled">---</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleRun(test.id)} disabled={runningId === test.id}>
                              {runningId === test.id ? <CircularProgress size={14} /> : <PlayArrowIcon sx={{ fontSize: 16 }} />}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredTests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">Nenhum caso de teste encontrado</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab 1: Conjuntos de Testes */}
      {tabIndex === 1 && (
        <Box>
          {/* Test Suites Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {testSuites.map((suite) => (
              <Grid item xs={12} sm={6} md={4} key={suite.id}>
                <Card sx={{ border: `1px solid ${borderColor}`, bgcolor: cardBg, height: "100%" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>{suite.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>{suite.description}</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <LinearProgress
                        variant="determinate" value={suite.passRate}
                        color={suite.passRate >= 80 ? "success" : suite.passRate >= 50 ? "warning" : "error"}
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" fontWeight={700}>{suite.passRate}%</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" color="text.secondary">
                        {suite.passingTests}/{suite.totalTests} testes passando
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {suite.owner}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pipeline Indicators + Radar (existing content relocated) */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Card sx={{ border: `1px solid ${borderColor}`, bgcolor: cardBg }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Indicadores por Pipeline</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><Typography variant="caption" fontWeight={700}>Pipeline</Typography></TableCell>
                          <TableCell><Typography variant="caption" fontWeight={700}>Camada</Typography></TableCell>
                          <TableCell align="center"><Typography variant="caption" fontWeight={700}>Completude</Typography></TableCell>
                          <TableCell align="center"><Typography variant="caption" fontWeight={700}>Acurácia</Typography></TableCell>
                          <TableCell align="center"><Typography variant="caption" fontWeight={700}>Freshness</Typography></TableCell>
                          <TableCell align="center"><Typography variant="caption" fontWeight={700}>Consistência</Typography></TableCell>
                          <TableCell><Typography variant="caption" fontWeight={700}>Score</Typography></TableCell>
                          <TableCell align="center"><Typography variant="caption" fontWeight={700}>Testes</Typography></TableCell>
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
                                <span style={{ color: theme.palette.success.main, fontWeight: 600 }}>{ind.testsPassing}</span>/{ind.testsTotal}
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
              <Card sx={{ height: "100%", border: `1px solid ${borderColor}`, bgcolor: cardBg }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Dimensões de Qualidade</Typography>
                  <ResponsiveContainer width="100%" height={280}>
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
        </Box>
      )}

      {/* Dialog: Adicionar Caso de Teste */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Adicionar Caso de Teste</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nome do Teste" fullWidth size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex: check_name_not_null" />
            <TextField label="Descrição" fullWidth size="small" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Tabela (qualified name)" fullWidth size="small" value={form.tableName} onChange={(e) => setForm({ ...form, tableName: e.target.value })} placeholder="schema.database.table" />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Coluna" fullWidth size="small" value={form.columnName} onChange={(e) => setForm({ ...form, columnName: e.target.value })} placeholder="ex: customer_id" />
              </Grid>
            </Grid>
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
