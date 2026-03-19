import { useEffect } from "react";
import {
  Box, Grid, Typography, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, useTheme, LinearProgress,
} from "@mui/material";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchAnalyticsExpandido } from "../../app/slices/analyticsExpandidoSlice";
import type { ClusterHealth } from "../../app/slices/analyticsExpandidoSlice";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const HEALTH_CONFIG: Record<ClusterHealth, { label:string; color:"success"|"warning"|"error"|"default"; icon: React.ReactElement }> = {
  healthy:     { label:"Saudavel",    color:"success", icon:<CheckCircleIcon sx={{ fontSize:14 }} /> },
  degraded:    { label:"Degradado",   color:"warning", icon:<WarningAmberIcon sx={{ fontSize:14 }} /> },
  critical:    { label:"Critico",     color:"error",   icon:<ErrorOutlineIcon sx={{ fontSize:14 }} /> },
  unmonitored: { label:"Sem cobertura", color:"default", icon:<VisibilityOffIcon sx={{ fontSize:14 }} /> },
};

export default function AnalyticsExpandidoPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { clusters, coverage, loading } = useAppSelector((s) => s.analyticsExpandido);
  useEffect(() => { dispatch(fetchAnalyticsExpandido()); }, [dispatch]);
  if (loading && clusters.length === 0) return <PageSkeleton />;

  const totalModels = clusters.reduce((a, c) => a + c.totalModels, 0);
  const monitored = clusters.reduce((a, c) => a + c.monitoredModels, 0);
  const coveragePct = totalModels > 0 ? Math.round(monitored / totalModels * 100) : 0;

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <AnalyticsIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box>
          <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
            <Typography variant="h5" fontWeight={700}>EP-10 — Analytics Expandido</Typography>
            <Chip label="Fase 3" color="secondary" size="small" sx={{ fontWeight:700 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Cobertura completa dos 1.000+ modelos de score — saude, drift e score zero por cluster
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Total de Modelos" value={totalModels.toLocaleString("pt-BR")} trend="UP" trendValue="cobertura total" severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Cobertura Atual" value={`${coveragePct}%`} trend={coveragePct < 100 ? "UP" : "STABLE"} trendValue={`${monitored.toLocaleString("pt-BR")} monitorados`} severity={coveragePct < 80 ? "HIGH" : coveragePct < 95 ? "MEDIUM" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Criticos ou Zerados" value={clusters.reduce((a, c) => a + (c.health === "critical" ? 1 : 0) + c.zeroScoreCount, 0)} trend="DOWN" trendValue="requerem atencao" severity="CRITICAL" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Expansao vs. MVP" value={`${coverage ? Math.round(coverage.current / coverage.previousMonth * 100) - 100 : 0}%`} trend="UP" trendValue={`${coverage?.previousMonth ?? 0} no MVP`} severity="HEALTHY" />
        </Grid>
      </Grid>

      {/* Coverage Progress */}
      {coverage && (
        <Paper sx={{ borderRadius:2, p:2, mb:3 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1}>
            Progresso de Cobertura: {coverage.current.toLocaleString("pt-BR")} / {coverage.target.toLocaleString("pt-BR")} modelos
          </Typography>
          <LinearProgress variant="determinate" value={Math.round(coverage.current / coverage.target * 100)}
            color={coveragePct >= 95 ? "success" : coveragePct >= 80 ? "warning" : "error"}
            sx={{ height:12, borderRadius:2, mb:1 }} />
          <Box sx={{ display:"flex", justifyContent:"space-between" }}>
            <Typography variant="caption" color="text.secondary">MVP: {coverage.previousMonth} modelos</Typography>
            <Typography variant="caption" fontWeight={700}>{Math.round(coverage.current / coverage.target * 100)}% do objetivo Fase 3</Typography>
            <Typography variant="caption" color="text.secondary">Meta: {coverage.target.toLocaleString("pt-BR")}</Typography>
          </Box>
        </Paper>
      )}

      {/* Cluster table */}
      <Paper sx={{ borderRadius:2, overflow:"hidden" }}>
        <Box sx={{ p:2, borderBottom:`1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Saude por Cluster</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="caption" fontWeight={600}>Cluster</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Saude</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Cobertura</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Acuracia Media</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Drift</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Score Zero</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clusters.map((cl) => {
                const hc = HEALTH_CONFIG[cl.health];
                const covPct = cl.totalModels > 0 ? Math.round(cl.monitoredModels / cl.totalModels * 100) : 0;
                return (
                  <TableRow key={cl.id} hover sx={{
                    bgcolor: cl.health === "critical" ? (theme.palette.mode === "light" ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.06)") : "transparent"
                  }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{cl.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{cl.totalModels} modelos</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display:"flex", alignItems:"center", gap:0.5 }}>
                        <Box sx={{ color: hc.color === "default" ? theme.palette.text.secondary : theme.palette[hc.color].main }}>
                          {hc.icon}
                        </Box>
                        <Chip label={hc.label} color={hc.color} size="small" />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ width:160 }}>
                      <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                        <LinearProgress variant="determinate" value={covPct}
                          color={covPct === 100 ? "success" : covPct > 50 ? "warning" : "error"}
                          sx={{ flex:1, borderRadius:1, height:6 }} />
                        <Typography variant="caption">{covPct}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ width:140 }}>
                      {cl.monitoredModels > 0 ? (
                        <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                          <LinearProgress variant="determinate" value={cl.avgAccuracy}
                            color={cl.avgAccuracy > 85 ? "success" : cl.avgAccuracy > 70 ? "warning" : "error"}
                            sx={{ flex:1, borderRadius:1, height:6 }} />
                          <Typography variant="caption">{cl.avgAccuracy}%</Typography>
                        </Box>
                      ) : <Typography variant="caption" color="text.disabled">N/A</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color={cl.driftCount > 50 ? "error.main" : cl.driftCount > 20 ? "warning.main" : "text.primary"} fontWeight={cl.driftCount > 50 ? 700 : 400}>
                        {cl.driftCount > 0 ? cl.driftCount : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color={cl.zeroScoreCount > 0 ? "error.main" : "text.primary"} fontWeight={cl.zeroScoreCount > 0 ? 700 : 400}>
                        {cl.zeroScoreCount > 0 ? cl.zeroScoreCount : "—"}
                      </Typography>
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
