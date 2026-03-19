import { useEffect } from "react";
import type { ReactElement } from "react";
import {
  Box, Grid, Typography, Chip, Paper, Alert as MuiAlert,
  List, ListItem, useTheme, LinearProgress,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StorageIcon from "@mui/icons-material/Storage";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import SpeedIcon from "@mui/icons-material/Speed";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchPredictivoData } from "../../app/slices/predictivoSlice";
import type { RiskLevel, Prediction } from "../../app/slices/predictivoSlice";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const RISK_CONFIG: Record<RiskLevel, { color:"error"|"warning"|"info"|"success"; label:string }> = {
  critical:{ color:"error",   label:"Critico" },
  high:    { color:"warning", label:"Alto" },
  medium:  { color:"info",    label:"Medio" },
  low:     { color:"success", label:"Baixo" },
};

const TYPE_ICONS: Record<Prediction["type"], ReactElement> = {
  batch_failure: <StorageIcon fontSize="small" />,
  score_zero:    <QueryStatsIcon fontSize="small" />,
  model_drift:   <TrendingUpIcon fontSize="small" />,
  capacity:      <SpeedIcon fontSize="small" />,
  cascade:       <AccountTreeIcon fontSize="small" />,
};

export default function PreditivoPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { predictions, stats, loading } = useAppSelector((s) => s.preditivoIA);
  useEffect(() => { dispatch(fetchPredictivoData()); }, [dispatch]);
  if (loading && predictions.length === 0) return <PageSkeleton />;
  const isLight = theme.palette.mode === "light";
  const active = predictions.filter(p => p.status === "active");
  const criticalActive = active.filter(p => p.riskLevel === "critical");

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <TrendingUpIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box>
          <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
            <Typography variant="h5" fontWeight={700}>EP-12 — IA Preditiva</Typography>
            <Chip label="Fase 3" color="secondary" size="small" sx={{ fontWeight:700 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Antecipacao de falhas com ML — prever score zero, estouro de batch e degradacao de modelo
          </Typography>
        </Box>
        {stats && (
          <Chip label={`${stats.avgLeadTime} de antecedencia media`} size="small" color="success" sx={{ ml:"auto", fontWeight:700 }} />
        )}
      </Box>

      {criticalActive.length > 0 && (
        <MuiAlert severity="error" sx={{ mb:2 }}>
          <strong>{criticalActive.length} predicao(oes) de risco critico</strong> nas proximas horas — acao preventiva necessaria.
        </MuiAlert>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Predicoes Ativas" value={stats?.activePredictions ?? 0} trend={stats && stats.activePredictions > 3 ? "DOWN" : "STABLE"} trendValue="requerem atencao" severity={stats && stats.highRiskNext24h > 2 ? "CRITICAL" : "HIGH"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Risco Alto em 24h" value={stats?.highRiskNext24h ?? 0} trend="DOWN" trendValue="proximas 24 horas" severity={stats && stats.highRiskNext24h > 2 ? "CRITICAL" : "HIGH"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Prevencoes Hoje" value={stats?.preventedToday ?? 0} trend="UP" trendValue="falhas evitadas" severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Acuracia do Modelo" value={`${stats?.accuracyRate ?? 0}%`} trend="STABLE" trendValue="predicoes corretas" severity={stats && stats.accuracyRate > 80 ? "HEALTHY" : "MEDIUM"} />
        </Grid>
      </Grid>

      {/* Predictions */}
      {predictions.map((pred) => {
        const rc = RISK_CONFIG[pred.riskLevel];
        const isPrevented = pred.status === "prevented";
        return (
          <Paper key={pred.id} sx={{
            borderRadius:2, mb:2, overflow:"hidden", opacity: isPrevented ? 0.7 : 1,
            border: pred.riskLevel === "critical" && pred.status === "active" ?
              `1px solid ${isLight ? "rgba(227,24,55,0.3)" : "rgba(227,24,55,0.4)"}` :
              `1px solid ${theme.palette.divider}`,
          }}>
            <Box sx={{ p:2, bgcolor: pred.riskLevel === "critical" && pred.status === "active" ?
              (isLight ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.05)") : "transparent" }}>
              <Box sx={{ display:"flex", alignItems:"flex-start", gap:1.5 }}>
                <Box sx={{ color: theme.palette[rc.color].main, mt:0.25 }}>{TYPE_ICONS[pred.type]}</Box>
                <Box sx={{ flex:1 }}>
                  <Box sx={{ display:"flex", alignItems:"center", gap:1, flexWrap:"wrap", mb:0.5 }}>
                    <Typography variant="subtitle1" fontWeight={700}>{pred.title}</Typography>
                    <Chip label={rc.label} color={rc.color} size="small" />
                    <Chip label={`${pred.probability}% probabilidade`} size="small" variant="outlined" />
                    <Chip label={`Horizonte: ${pred.horizon}`} size="small"
                      sx={{ bgcolor: isLight ? "rgba(0,47,108,0.06)" : "rgba(255,255,255,0.06)" }} />
                    {isPrevented && <Chip icon={<CheckCircleIcon sx={{ fontSize:"12px !important" }} />} label="Prevencao Aplicada" size="small" color="success" />}
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>{pred.description}</Typography>
                  <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:1 }}>
                    <Typography variant="caption" color="text.disabled">Confianca:</Typography>
                    <LinearProgress variant="determinate" value={pred.probability}
                      color={rc.color}
                      sx={{ width:100, borderRadius:1, height:5 }} />
                    <Typography variant="caption" fontWeight={700}>[{pred.confidenceInterval[0]}% - {pred.confidenceInterval[1]}%]</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display:"flex", gap:0, borderTop:`1px solid ${theme.palette.divider}` }}>
              <Box sx={{ flex:1, p:1.5, borderRight:`1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" fontWeight={700} color="warning.main" sx={{ textTransform:"uppercase", fontSize:"0.62rem" }}>
                  Sinais de Disparo
                </Typography>
                <List dense sx={{ p:0, mt:0.5 }}>
                  {pred.triggerSignals.map((s, i) => (
                    <ListItem key={i} sx={{ px:0, py:0.2 }}>
                      <WarningAmberIcon sx={{ fontSize:11, color:"warning.main", mr:0.5, flexShrink:0 }} />
                      <Typography variant="caption" color="text.secondary">{s}</Typography>
                    </ListItem>
                  ))}
                </List>
              </Box>
              <Box sx={{ flex:1, p:1.5 }}>
                <Typography variant="caption" fontWeight={700} color="success.main" sx={{ textTransform:"uppercase", fontSize:"0.62rem" }}>
                  Acao Sugerida
                </Typography>
                <Box sx={{ display:"flex", alignItems:"flex-start", gap:0.5, mt:0.5 }}>
                  {isPrevented
                    ? <CheckCircleIcon sx={{ fontSize:12, color:"success.main", mt:0.2, flexShrink:0 }} />
                    : <ErrorOutlineIcon sx={{ fontSize:12, color:"warning.main", mt:0.2, flexShrink:0 }} />}
                  <Typography variant="caption" color={isPrevented ? "success.main" : "text.secondary"}>
                    {pred.suggestedAction}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        );
      })}
      <Paper sx={{ borderRadius:2, p:2, mt:2 }}>
        <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
          <VisibilityIcon sx={{ fontSize:16, color:"text.disabled" }} />
          <Typography variant="caption" color="text.disabled">
            Modelos preditivos treinados com 30 dias de dados historicos de batch, ingestion e analytics. Acuracia atual: {stats?.accuracyRate ?? 0}% (precision-recall).
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
