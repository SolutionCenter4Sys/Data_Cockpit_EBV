import { useEffect } from "react";
import {
  Box, Grid, Typography, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Alert as MuiAlert,
  LinearProgress, Accordion, AccordionSummary, AccordionDetails, useTheme,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchAuditorData } from "../../app/slices/auditorSlice";
import type { ModelHealth, DriftType } from "../../app/slices/auditorSlice";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const HEALTH_CONFIG: Record<ModelHealth, { label:string; color:"success"|"warning"|"error"|"default" }> = {
  healthy: { label:"Saudavel", color:"success" },
  degraded: { label:"Degradado", color:"warning" },
  critical: { label:"Critico", color:"error" },
  zero_score: { label:"Score Zero", color:"error" },
  unknown: { label:"Desconhecido", color:"default" },
};

const DRIFT_LABELS: Record<DriftType, string> = {
  feature_drift:"Drift de Feature", target_drift:"Drift de Target",
  concept_drift:"Drift Conceitual", data_quality:"Qualidade de Dado",
};

export default function AuditorPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { models, stats, loading } = useAppSelector((s) => s.auditor);
  useEffect(() => { dispatch(fetchAuditorData()); }, [dispatch]);
  if (loading && models.length === 0) return <PageSkeleton />;

  const criticalModels = models.filter(m => m.health === "critical" || m.health === "zero_score");

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <AssessmentIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box>
          <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
            <Typography variant="h5" fontWeight={700}>AG-07 — Auditor de Modelos</Typography>
            <Chip label="Ativo" color="success" size="small" sx={{ fontWeight:700 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Monitoramento de saude, drift e degradacao dos 1000+ modelos de score
          </Typography>
        </Box>
        <Chip label="WSJF 5.1 — Nivel 3: ENTENDER" size="small" color="secondary" sx={{ ml:"auto" }} />
      </Box>

      {criticalModels.length > 0 && (
        <MuiAlert severity="error" sx={{ mb:2 }}>
          <strong>{criticalModels.length} modelo(s) critico(s) ou com score zero</strong> — re-treinamento ou investigacao imediata necessaria.
        </MuiAlert>
      )}

      {stats && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <KpiCard label="Modelos Monitorados" value={stats.totalModels.toLocaleString("pt-BR")} trend="UP" trendValue={`${stats.coveragePercent}% cobertura`} severity="HEALTHY" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KpiCard label="Com Drift Detectado" value={stats.modelsWithDrift} trend={stats.modelsWithDrift > 100 ? "DOWN" : "STABLE"} trendValue="vs. 82 esperado" severity={stats.modelsWithDrift > 150 ? "CRITICAL" : stats.modelsWithDrift > 100 ? "HIGH" : "HEALTHY"} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KpiCard label="Criticos + Zero Score" value={stats.criticalModels + stats.zeroScoreModels} trend="DOWN" trendValue={`${stats.zeroScoreModels} zero score`} severity={stats.criticalModels > 10 ? "CRITICAL" : "HIGH"} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <KpiCard label="Acuracia Media" value={`${stats.avgAccuracy}%`} trend={stats.avgAccuracy > 85 ? "STABLE" : "DOWN"} trendValue="media ponderada" severity={stats.avgAccuracy > 85 ? "HEALTHY" : stats.avgAccuracy > 75 ? "MEDIUM" : "HIGH"} />
          </Grid>
        </Grid>
      )}

      {/* Global health bar */}
      {stats && (
        <Paper sx={{ borderRadius:2, p:2, mb:3 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={2}>Distribuicao de Saude — {stats.totalModels} Modelos</Typography>
          <Box sx={{ display:"flex", gap:1, mb:1 }}>
            {[
              { label:`Saudaveis (${stats.healthyModels})`, value:Math.round(stats.healthyModels/stats.totalModels*100), color:"success" as const },
              { label:`Degradados (${stats.degradedModels})`, value:Math.round(stats.degradedModels/stats.totalModels*100), color:"warning" as const },
              { label:`Criticos (${stats.criticalModels})`, value:Math.round(stats.criticalModels/stats.totalModels*100), color:"error" as const },
              { label:`Zero Score (${stats.zeroScoreModels})`, value:Math.round(stats.zeroScoreModels/stats.totalModels*100), color:"error" as const },
            ].map((item) => (
              <Box key={item.label} sx={{ flex:1 }}>
                <Box sx={{ display:"flex", justifyContent:"space-between", mb:0.5 }}>
                  <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  <Typography variant="caption" fontWeight={700}>{item.value}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={item.value} color={item.color} sx={{ borderRadius:1, height:8 }} />
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Model details */}
      <Paper sx={{ borderRadius:2, overflow:"hidden" }}>
        <Box sx={{ p:2, borderBottom:`1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Modelos Monitorados (amostra representativa)</Typography>
          <Typography variant="caption" color="text.secondary">Modelos com alertas ativos e criticos sao destacados</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="caption" fontWeight={600}>Modelo</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Saude</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Acuracia</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Drift Score</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Score Zero</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Alertas</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((model) => {
                const hc = HEALTH_CONFIG[model.health];
                return (
                  <TableRow key={model.id} hover sx={{
                    bgcolor: (model.health === "critical" || model.health === "zero_score") ?
                      (theme.palette.mode === "light" ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.06)") : "transparent"
                  }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{model.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{model.cluster}</Typography>
                    </TableCell>
                    <TableCell><Chip label={hc.label} color={hc.color} size="small" /></TableCell>
                    <TableCell sx={{ width:130 }}>
                      <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                        <LinearProgress variant="determinate" value={model.accuracyScore}
                          color={model.accuracyScore > 85 ? "success" : model.accuracyScore > 70 ? "warning" : "error"}
                          sx={{ flex:1, borderRadius:1, height:6 }} />
                        <Typography variant="caption">{model.accuracyScore}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ width:130 }}>
                      <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                        <LinearProgress variant="determinate" value={model.driftScore}
                          color={model.driftScore < 20 ? "success" : model.driftScore < 50 ? "warning" : "error"}
                          sx={{ flex:1, borderRadius:1, height:6 }} />
                        <Typography variant="caption">{model.driftScore}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color={model.scoreZeroCount > 0 ? "error.main" : "text.primary"} fontWeight={model.scoreZeroCount > 0 ? 700 : 400}>
                        {model.scoreZeroCount > 0 ? model.scoreZeroCount.toLocaleString("pt-BR") : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {model.alerts.length > 0 ? (
                        <Accordion disableGutters elevation={0} sx={{ bgcolor:"transparent", "&:before":{ display:"none" } }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize:14 }} />} sx={{ p:0, minHeight:"auto", "& .MuiAccordionSummary-content":{ m:0 } }}>
                            <Chip icon={<WarningAmberIcon sx={{ fontSize:"14px !important" }} />} label={`${model.alerts.length} alerta(s)`}
                              size="small" color="warning" sx={{ cursor:"pointer" }} />
                          </AccordionSummary>
                          <AccordionDetails sx={{ p:0, pt:1 }}>
                            {model.alerts.map((alert, i) => (
                              <Box key={i} sx={{ mb:1, p:1, borderRadius:1, bgcolor: theme.palette.action.hover }}>
                                <Box sx={{ display:"flex", alignItems:"center", gap:0.5, mb:0.5 }}>
                                  {alert.severity === "critical" ? <ErrorOutlineIcon sx={{ fontSize:14, color:"error.main" }} /> : <WarningAmberIcon sx={{ fontSize:14, color:"warning.main" }} />}
                                  <Typography variant="caption" fontWeight={700}>{DRIFT_LABELS[alert.driftType]}</Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" display="block">{alert.description}</Typography>
                                <Box sx={{ mt:0.5, display:"flex", alignItems:"center", gap:0.5 }}>
                                  <CheckCircleIcon sx={{ fontSize:12, color:"success.main" }} />
                                  <Typography variant="caption" color="success.main">{alert.recommendation}</Typography>
                                </Box>
                              </Box>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      ) : (
                        <Box sx={{ display:"flex", alignItems:"center", gap:0.5 }}>
                          <CheckCircleIcon sx={{ fontSize:14, color:"success.main" }} />
                          <Typography variant="caption" color="success.main">Sem alertas</Typography>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ p:1.5, borderTop:`1px solid ${theme.palette.divider}`, display:"flex", alignItems:"center", gap:1 }}>
          <BlockIcon sx={{ fontSize:14, color:"text.disabled" }} />
          <Typography variant="caption" color="text.disabled">
            Exibindo 7 modelos representativos. Total monitorado: {stats?.totalModels.toLocaleString("pt-BR")} modelos (100% de cobertura via auditoria automatica).
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
