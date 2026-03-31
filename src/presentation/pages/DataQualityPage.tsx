import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button, useTheme, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, IconButton, LinearProgress, CircularProgress,
  Tabs, Tab, InputAdornment, alpha, Avatar, Tooltip,
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
import AddAlertIcon from "@mui/icons-material/AddAlert";
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { useAppDispatch, useAppSelector } from "../../app/store";
import {
  fetchTests, fetchIndicators, fetchTestSuites, runTest, createTest,
  setSearchTerm, setFilter, clearFilters, setSuiteSearchTerm, setSuiteOwnerFilter,
} from "../../app/slices/dataQualitySlice";
import type { TestResult, SeverityLevel, IncidentStatus, SuiteType } from "../../domain/entities";
import PageSkeleton from "../components/PageSkeleton";

const STATUS_CONFIG: Record<TestResult, { label: string; bg: string; color: string; icon: React.ReactElement }> = {
  PASS: { label: "Success", bg: "#E6F4EA", color: "#1E7E34", icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
  FAIL: { label: "Failure", bg: "#FDECEC", color: "#C62828", icon: <CancelIcon sx={{ fontSize: 14 }} /> },
  ERROR: { label: "Aborted", bg: "#FFF8E1", color: "#E65100", icon: <ErrorOutlineIcon sx={{ fontSize: 14 }} /> },
  PENDING: { label: "Pending", bg: "#E3F2FD", color: "#1565C0", icon: <HourglassEmptyIcon sx={{ fontSize: 14 }} /> },
};

const INCIDENT_CONFIG: Record<IncidentStatus, { label: string; color: "success" | "error" | "warning" | "default" | "secondary" }> = {
  RESOLVED: { label: "ServiceNow: Resolvido", color: "success" },
  OPEN: { label: "ServiceNow: Aberto", color: "error" },
  ACKNOWLEDGED: { label: "ServiceNow: Em progresso", color: "warning" },
  NONE: { label: "---", color: "default" },
};

const MOCK_CONNECTORS = [
  { id: "conn-01", name: "EBV Core Database (PostgreSQL)" },
  { id: "conn-02", name: "BigQuery Analytics" },
  { id: "conn-03", name: "Oracle Legado" },
  { id: "conn-04", name: "Kafka Events Stream" },
  { id: "conn-05", name: "GCS Data Lake" },
];

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
  const navigate = useNavigate();
  const theme = useTheme();
  const { tests, indicators, testSuites, loading, searchTerm, filters, suiteSearchTerm, suiteOwnerFilter } = useAppSelector((s) => s.dataQuality);
  const [tabIndex, setTabIndex] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [suiteSubTab, setSuiteSubTab] = useState<SuiteType>("table");

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
                      <TableCell align="center" sx={{ width: 48 }} />
                      <TableCell><Typography variant="caption" fontWeight={700}>Status</Typography></TableCell>
                      <TableCell><Typography variant="caption" fontWeight={700}>Motivo da falha/cancelamento</Typography></TableCell>
                      <TableCell><Typography variant="caption" fontWeight={700}>Última Execução</Typography></TableCell>
                      <TableCell><Typography variant="caption" fontWeight={700}>Nome</Typography></TableCell>
                      <TableCell><Typography variant="caption" fontWeight={700}>Tabela</Typography></TableCell>
                      <TableCell><Typography variant="caption" fontWeight={700}>Coluna</Typography></TableCell>
                      <TableCell><Typography variant="caption" fontWeight={700}>ServiceNow</Typography></TableCell>
                      <TableCell align="center" sx={{ width: 48 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTests.map((test) => {
                      const cfg = STATUS_CONFIG[test.lastResult];
                      const inc = INCIDENT_CONFIG[test.incidentStatus];
                      return (
                        <TableRow key={test.id} hover>
                          <TableCell align="center">
                            {(test.lastResult === "FAIL" || test.lastResult === "ERROR") && (
                              <Tooltip title="Criar alerta na Central de Alertas">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => navigate("/action-matrix", {
                                    state: {
                                      fromQuality: true,
                                      testName: test.name,
                                      testId: test.id,
                                      tableName: test.tableName,
                                      columnName: test.columnName,
                                      failureReason: test.failureReason,
                                      lastResult: test.lastResult,
                                    },
                                  })}
                                >
                                  <AddAlertIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
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
                              <Chip label={inc.label} size="small" color={inc.color as "success" | "error" | "warning" | "default"} variant="outlined" sx={{ fontWeight: 600, fontSize: "0.6rem" }} />
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
                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
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
      {tabIndex === 1 && (() => {
        const suiteOwners = [...new Set(testSuites.map((s) => s.owner))];
        const filteredSuites = testSuites.filter((s) => {
          if (s.suiteType !== suiteSubTab) return false;
          if (suiteOwnerFilter && s.owner !== suiteOwnerFilter) return false;
          if (suiteSearchTerm) {
            const lower = suiteSearchTerm.toLowerCase();
            return s.name.toLowerCase().includes(lower) || s.fullPath.toLowerCase().includes(lower);
          }
          return true;
        });

        return (
        <Box>
          {/* Owner filter */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">Proprietário:</Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={suiteOwnerFilter}
                displayEmpty
                onChange={(e: SelectChangeEvent) => dispatch(setSuiteOwnerFilter(e.target.value))}
                sx={{ fontSize: "0.8rem", height: 32 }}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {suiteOwners.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* KPIs */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
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
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>{d.name} {d.value}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                    <Box sx={{ width: 80, height: 80, position: "relative" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={22} outerRadius={36} strokeWidth={0}>{pieData.map((d) => <Cell key={d.name} fill={PIE_COLORS[d.name]} />)}</Pie></PieChart>
                      </ResponsiveContainer>
                      <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                        <Typography variant="caption" fontWeight={800} sx={{ fontSize: "0.7rem", lineHeight: 1 }}>{successPct}%</Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
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
                        <PieChart><Pie data={healthPieData} dataKey="value" cx="50%" cy="50%" innerRadius={22} outerRadius={36} strokeWidth={0}><Cell fill="#4CAF50" /><Cell fill={isDark ? "#333" : "#E0E0E0"} /></Pie></PieChart>
                      </ResponsiveContainer>
                      <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                        <Typography variant="caption" fontWeight={800} sx={{ fontSize: "0.7rem", lineHeight: 1, color: "#4CAF50" }}>{healthyPct}%</Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
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
                    <LinearProgress variant="determinate" value={parseFloat(coveragePct)} sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", "& .MuiLinearProgress-bar": { borderRadius: 4 } }} />
                    <Typography variant="caption" fontWeight={700} color="text.secondary">{coveragePct}%</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Sub-tabs: Suítes de Tabela / Suítes de Padrões */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Tabs
              value={suiteSubTab}
              onChange={(_, v) => setSuiteSubTab(v as SuiteType)}
              sx={{ minHeight: 32 }}
            >
              <Tab value="table" label={`Suítes de Tabela (${testSuites.filter((s) => s.suiteType === "table").length})`} sx={{ textTransform: "none", fontWeight: 600, minHeight: 32, py: 0.5, fontSize: "0.82rem" }} />
              <Tab value="pattern" label={`Suítes de Padrões (${testSuites.filter((s) => s.suiteType === "pattern").length})`} sx={{ textTransform: "none", fontWeight: 600, minHeight: 32, py: 0.5, fontSize: "0.82rem" }} />
            </Tabs>
            <TextField
              size="small"
              placeholder={suiteSubTab === "table" ? "Pesquisar Suítes de Tabela" : "Pesquisar Suítes de Padrões"}
              value={suiteSearchTerm}
              onChange={(e) => dispatch(setSuiteSearchTerm(e.target.value))}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} /></InputAdornment> }}
              sx={{ width: 280 }}
            />
          </Box>

          {/* Suites Table */}
          <Card sx={{ border: `1px solid ${borderColor}`, bgcolor: cardBg, mb: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant="caption" fontWeight={700}>Nome</Typography></TableCell>
                    <TableCell align="center"><Typography variant="caption" fontWeight={700}>Testes</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700}>Sucesso %</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700}>Proprietários</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSuites.map((suite) => (
                    <TableRow key={suite.id} hover>
                      <TableCell>
                        <Typography
                          variant="body2" fontWeight={600}
                          sx={{ color: theme.palette.primary.main, cursor: "pointer", "&:hover": { textDecoration: "underline" }, fontSize: "0.82rem" }}
                        >
                          {suite.fullPath}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{suite.totalTests}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 140 }}>
                          <LinearProgress
                            variant="determinate"
                            value={suite.passRate}
                            color={suite.passRate >= 80 ? "success" : suite.passRate >= 50 ? "warning" : "error"}
                            sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
                          />
                          <Typography variant="caption" fontWeight={700} sx={{ minWidth: 30 }}>{suite.passRate}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={-0.5}>
                          <Tooltip title={suite.owner}>
                            <Avatar sx={{ width: 26, height: 26, fontSize: "0.65rem", bgcolor: suite.ownerAvatarColor, border: `2px solid ${cardBg}` }}>
                              {suite.owner.charAt(0)}
                            </Avatar>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredSuites.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">Nenhuma suíte encontrada</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Pipeline Indicators + Radar */}
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
        );
      })()}

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
            <FormControl fullWidth size="small">
              <InputLabel>Conector</InputLabel>
              <Select
                value={form.sourceId}
                label="Conector"
                onChange={(e: SelectChangeEvent) => {
                  const conn = MOCK_CONNECTORS.find((c) => c.id === e.target.value);
                  setForm({ ...form, sourceId: e.target.value, sourceName: conn?.name || "" });
                }}
              >
                {MOCK_CONNECTORS.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
