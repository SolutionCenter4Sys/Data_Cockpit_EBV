import { useEffect } from "react";
import {
  Box, Grid, Typography, Chip, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Alert as MuiAlert, useTheme,
  LinearProgress,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchConselheiroData } from "../../app/slices/conselheiroSlice";
import type { WindowStatus, RecommendationType } from "../../app/slices/conselheiroSlice";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const WINDOW_CONFIG: Record<WindowStatus, { label:string; color:"success"|"warning"|"error" }> = {
  ok:          { label:"OK",          color:"success" },
  at_risk:     { label:"Em Risco",    color:"warning" },
  overloaded:  { label:"Sobrecarregado", color:"error" },
};

const REC_ICONS: Record<RecommendationType, React.ReactElement> = {
  reschedule: <SwapHorizIcon fontSize="small" />,
  split:      <CallSplitIcon fontSize="small" />,
  scale_up:   <AddCircleOutlineIcon fontSize="small" />,
  pause:      <PauseCircleOutlineIcon fontSize="small" />,
};

export default function ConselheiroPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { windows, recommendations, forecast, loading } = useAppSelector((s) => s.conselheiro);
  useEffect(() => { dispatch(fetchConselheiroData()); }, [dispatch]);
  if (loading && windows.length === 0) return <PageSkeleton />;
  const isLight = theme.palette.mode === "light";

  const overloaded = windows.filter(w => w.status === "overloaded").length;
  const atRisk = windows.filter(w => w.status === "at_risk").length;
  const pendingRecs = recommendations.filter(r => !r.applied).length;
  const highPriorityPending = recommendations.filter(r => !r.applied && (r.priority === "critical" || r.priority === "high")).length;

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <AccessTimeIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box>
          <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
            <Typography variant="h5" fontWeight={700}>AG-08 — Conselheiro de Capacidade</Typography>
            <Chip label="Ativo" color="success" size="small" sx={{ fontWeight:700 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Predicao de gargalos batch — reagendamento inteligente de jobs com 48h de antecedencia
          </Typography>
        </Box>
        <Chip label="WSJF 3.9 — Nivel 3: COMUNICAR" size="small" color="secondary" sx={{ ml:"auto" }} />
      </Box>

      {overloaded > 0 && (
        <MuiAlert severity="error" sx={{ mb:2 }}>
          <strong>{overloaded} janela(s) sobrecarregada(s)</strong> — reagendamento necessario agora.
        </MuiAlert>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Janelas Sobrecarregadas" value={overloaded} trend={overloaded > 0 ? "DOWN" : "STABLE"} trendValue={`${atRisk} em risco`} severity={overloaded > 0 ? "CRITICAL" : atRisk > 0 ? "HIGH" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Recomendacoes Pendentes" value={pendingRecs} trend="STABLE" trendValue={`${highPriorityPending} alta prioridade`} severity={highPriorityPending > 0 ? "HIGH" : "MEDIUM"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Reagendamentos Aplicados" value={recommendations.filter(r => r.applied).length} trend="UP" trendValue="aceitos hoje" severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Jobs Criticos em Risco" value={windows.reduce((a, w) => a + (w.status !== "ok" ? w.criticalJobs : 0), 0)} trend="DOWN" trendValue="aguardam reagendamento" severity="HIGH" />
        </Grid>
      </Grid>

      {/* Batch windows */}
      <Paper sx={{ borderRadius:2, overflow:"hidden", mb:3 }}>
        <Box sx={{ p:2, borderBottom:`1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Janelas de Batch — Status Atual</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="caption" fontWeight={600}>Janela</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Horario</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Status</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Utilizacao</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Jobs</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Criticos</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Overflow</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {windows.map((w) => {
                const wc = WINDOW_CONFIG[w.status];
                return (
                  <TableRow key={w.id} hover sx={{
                    bgcolor: w.status === "overloaded" ? (isLight ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.06)") :
                             w.status === "at_risk" ? (isLight ? "rgba(237,108,2,0.03)" : "rgba(237,108,2,0.05)") : "transparent"
                  }}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{w.name}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{w.start} - {w.end}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{ display:"flex", alignItems:"center", gap:0.5 }}>
                        {w.status === "overloaded" ? <ErrorOutlineIcon sx={{ fontSize:14, color:"error.main" }} />
                         : w.status === "at_risk" ? <WarningAmberIcon sx={{ fontSize:14, color:"warning.main" }} />
                         : <CheckCircleIcon sx={{ fontSize:14, color:"success.main" }} />}
                        <Chip label={wc.label} color={wc.color} size="small" />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ width:140 }}>
                      <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                        <LinearProgress variant="determinate" value={w.utilizationPct}
                          color={w.utilizationPct > 90 ? "error" : w.utilizationPct > 75 ? "warning" : "success"}
                          sx={{ flex:1, borderRadius:1, height:6 }} />
                        <Typography variant="caption">{w.utilizationPct}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right"><Typography variant="body2">{w.jobCount}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={w.criticalJobs > 10 ? 700 : 400}
                        color={w.criticalJobs > 20 ? "error.main" : "text.primary"}>{w.criticalJobs}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      {w.projectedOverflowMinutes > 0
                        ? <Chip label={`+${w.projectedOverflowMinutes}min`} size="small" color="error" sx={{ height:18, fontSize:"0.62rem" }} />
                        : <Typography variant="caption" color="success.main">—</Typography>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Recommendations */}
      <Paper sx={{ borderRadius:2, overflow:"hidden", mb:3 }}>
        <Box sx={{ p:2, borderBottom:`1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Recomendacoes de Reagendamento</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="caption" fontWeight={600}>Acao</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Job</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>De</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Para</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Justificativa</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Impacto</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Status</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recommendations.map((rec) => (
                <TableRow key={rec.id} hover sx={{
                  bgcolor: !rec.applied && rec.priority === "critical" ?
                    (isLight ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.06)") : "transparent"
                }}>
                  <TableCell>
                    <Box sx={{ display:"flex", alignItems:"center", gap:0.5, color: theme.palette.text.secondary }}>
                      {REC_ICONS[rec.type]}
                      <Typography variant="caption">{rec.type.replace("_"," ")}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{rec.jobName}</Typography>
                    <Chip label={rec.priority} size="small"
                      color={rec.priority === "critical" ? "error" : rec.priority === "high" ? "warning" : "default"}
                      sx={{ height:16, fontSize:"0.58rem", mt:0.3 }} />
                  </TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{rec.currentWindow}</Typography></TableCell>
                  <TableCell><Typography variant="caption" color="primary.main" fontWeight={600}>{rec.suggestedWindow}</Typography></TableCell>
                  <TableCell sx={{ maxWidth:200 }}><Typography variant="caption" color="text.secondary">{rec.reason}</Typography></TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700}
                      color={rec.estimatedImpactMinutes < 0 ? "success.main" : "text.primary"}>
                      {rec.estimatedImpactMinutes < 0 ? `${rec.estimatedImpactMinutes}min` : "urgente"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {rec.applied
                      ? <Chip icon={<CheckCircleIcon sx={{ fontSize:"12px !important" }} />} label="Aplicado" size="small" color="success" variant="outlined" />
                      : <Chip label="Pendente" size="small" color={rec.priority === "critical" ? "error" : "warning"} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Forecast */}
      {forecast && (
        <Paper sx={{ borderRadius:2, p:2 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={2}>{forecast.windowName}</Typography>
          <Box sx={{ display:"flex", gap:0.5, alignItems:"flex-end", height:80 }}>
            {forecast.hours.map((h, i) => {
              const util = forecast.utilizations[i];
              const color = util > 90 ? "#E31837" : util > 75 ? "#ED6C02" : "#2E7D32";
              return (
                <Box key={h} sx={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:0.5 }}>
                  <Typography variant="caption" sx={{ fontSize:"0.55rem", color:theme.palette.text.disabled }}>{util}%</Typography>
                  <Box sx={{ width:"100%", height:`${util * 0.6}px`, bgcolor:color, borderRadius:"2px 2px 0 0", minHeight:4 }} />
                  <Typography variant="caption" sx={{ fontSize:"0.58rem", color:theme.palette.text.secondary }}>{h}</Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
