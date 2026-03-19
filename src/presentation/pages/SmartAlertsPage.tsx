import { useEffect } from "react";
import {
  Box, Grid, Typography, Chip, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Alert as MuiAlert, useTheme,
  LinearProgress,
} from "@mui/material";
import PsychologyIcon from "@mui/icons-material/Psychology";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import RuleIcon from "@mui/icons-material/Rule";
import HubIcon from "@mui/icons-material/Hub";
import TimelineIcon from "@mui/icons-material/Timeline";
import BlockIcon from "@mui/icons-material/Block";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchSmartAlerts } from "../../app/slices/smartAlertsSlice";
import type { AlertMethod } from "../../app/slices/smartAlertsSlice";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const METHOD_CONFIG: Record<AlertMethod, { label:string; color:string; icon: React.ReactElement }> = {
  ai_baseline:   { label:"IA Baseline",    color:"#002F6C", icon:<TimelineIcon sx={{ fontSize:14 }} /> },
  ai_drift:      { label:"IA Drift",       color:"#E31837", icon:<AutoFixHighIcon sx={{ fontSize:14 }} /> },
  ai_correlation:{ label:"IA Correlacao",  color:"#7B1FA2", icon:<HubIcon sx={{ fontSize:14 }} /> },
  rule_based:    { label:"Regra",          color:"#E65100", icon:<RuleIcon sx={{ fontSize:14 }} /> },
};

export default function SmartAlertsPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { alerts, stats, loading } = useAppSelector((s) => s.smartAlerts);
  useEffect(() => { dispatch(fetchSmartAlerts()); }, [dispatch]);
  if (loading && alerts.length === 0) return <PageSkeleton />;
  const isLight = theme.palette.mode === "light";
  const critical = alerts.filter(a => a.severity === "critical" && a.status !== "suppressed").length;

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <PsychologyIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box>
          <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
            <Typography variant="h5" fontWeight={700}>EP-11 — Alertas Inteligentes com IA</Typography>
            <Chip label="Fase 3" color="secondary" size="small" sx={{ fontWeight:700 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Deteccao por baseline estatistico, drift e correlacao entre streams — reducao de ruido de 87%
          </Typography>
        </Box>
      </Box>

      {critical > 0 && (
        <MuiAlert severity="error" sx={{ mb:2 }}>
          <strong>{critical} alerta(s) critico(s) ativos</strong> detectados por IA.
        </MuiAlert>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Alertas Hoje" value={stats?.totalToday ?? 0} trend="STABLE" trendValue="total disparados" severity="MEDIUM" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Detectados por IA" value={stats?.aiDetected ?? 0} trend="UP" trendValue={`${stats ? Math.round(stats.aiDetected/stats.totalToday*100) : 0}% do total`} severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Reducao de Ruido" value={`${stats?.noiseReductionPct ?? 0}%`} trend="UP" trendValue="vs. threshold fixo" severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Taxa Falso Positivo" value={`${stats?.falsePositiveRate ?? 0}%`} trend="DOWN" trendValue={`confianca media ${stats?.avgConfidence ?? 0}%`} severity={stats && stats.falsePositiveRate < 5 ? "HEALTHY" : "MEDIUM"} />
        </Grid>
      </Grid>

      {/* Method legend */}
      <Paper sx={{ borderRadius:2, p:1.5, mb:2 }}>
        <Box sx={{ display:"flex", flexWrap:"wrap", gap:1, alignItems:"center" }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" mr={1}>Metodos de deteccao:</Typography>
          {(Object.entries(METHOD_CONFIG) as [AlertMethod, typeof METHOD_CONFIG[AlertMethod]][]).map(([k, v]) => (
            <Chip key={k} icon={v.icon} label={v.label} size="small"
              sx={{ bgcolor: v.color + "15", color:v.color, border:`1px solid ${v.color}40`, height:22, fontSize:"0.68rem" }} />
          ))}
        </Box>
      </Paper>

      <Paper sx={{ borderRadius:2, overflow:"hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width:40 }}><Typography variant="caption" fontWeight={600}>Sev.</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Alerta</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Metodo</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Confianca</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Desvio</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Status</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert) => {
                const mc = METHOD_CONFIG[alert.method];
                const isSuppressed = alert.status === "suppressed";
                return (
                  <TableRow key={alert.id} hover sx={{
                    opacity: isSuppressed ? 0.55 : 1,
                    bgcolor: alert.severity === "critical" && !isSuppressed ?
                      (isLight ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.06)") : "transparent"
                  }}>
                    <TableCell>
                      <Chip label={alert.severity.substring(0,3).toUpperCase()} size="small"
                        color={alert.severity === "critical" ? "error" : alert.severity === "high" ? "warning" : alert.severity === "medium" ? "info" : "default"} />
                    </TableCell>
                    <TableCell sx={{ maxWidth:260 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ lineHeight:1.3 }}>{alert.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{alert.aiExplanation.substring(0,90)}...</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip icon={mc.icon} label={mc.label} size="small"
                        sx={{ bgcolor: mc.color + "15", color:mc.color, border:`1px solid ${mc.color}40`, height:20, fontSize:"0.62rem" }} />
                    </TableCell>
                    <TableCell sx={{ width:120 }}>
                      <Box sx={{ display:"flex", alignItems:"center", gap:0.5 }}>
                        <LinearProgress variant="determinate" value={alert.confidence}
                          color={alert.confidence > 90 ? "success" : alert.confidence > 70 ? "warning" : "error"}
                          sx={{ flex:1, borderRadius:1, height:5 }} />
                        <Typography variant="caption" sx={{ fontSize:"0.62rem" }}>{alert.confidence}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {alert.deviationPct !== null ? (
                        <Typography variant="body2" fontWeight={700}
                          color={Math.abs(alert.deviationPct) > 100 ? "error.main" : Math.abs(alert.deviationPct) > 50 ? "warning.main" : "text.primary"}>
                          {alert.deviationPct > 0 ? "+" : ""}{alert.deviationPct}%
                        </Typography>
                      ) : <Typography variant="caption" color="text.disabled">correlacao</Typography>}
                    </TableCell>
                    <TableCell>
                      {alert.status === "suppressed" ? (
                        <Chip icon={<BlockIcon sx={{ fontSize:"12px !important" }} />} label="Suprimido" size="small" sx={{ height:18, fontSize:"0.62rem" }} />
                      ) : alert.status === "acknowledged" ? (
                        <Chip label="Reconhecido" size="small" color="warning" />
                      ) : alert.status === "resolved" ? (
                        <Chip label="Resolvido" size="small" color="success" variant="outlined" />
                      ) : <Chip label="Novo" size="small" color="error" />}
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
