import { useEffect } from "react";
import type { ReactElement } from "react";
import {
  Box, Grid, Typography, Chip, Paper, Divider,
  List, ListItem, Alert as MuiAlert, Card, CardContent, useTheme,
  LinearProgress,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LoopIcon from "@mui/icons-material/Loop";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchGuruData } from "../../app/slices/guruSlice";
import type { TrendType, AnalysisStatus } from "../../app/slices/guruSlice";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const TREND_ICON: Record<TrendType, ReactElement> = {
  worsening: <TrendingDownIcon fontSize="small" />,
  improving: <TrendingUpIcon fontSize="small" />,
  stable: <TrendingFlatIcon fontSize="small" />,
  critical: <WarningAmberIcon fontSize="small" />,
};

const TREND_COLOR: Record<TrendType, "error" | "success" | "info" | "warning"> = {
  worsening:"error", improving:"success", stable:"info", critical:"warning",
};

function StatusBadge({ status }: { status: AnalysisStatus }) {
  if (status === "complete") return <Chip icon={<CheckCircleIcon sx={{ fontSize:"14px !important" }} />} label="Completo" color="success" size="small" />;
  if (status === "in_progress") return <Chip icon={<LoopIcon sx={{ fontSize:"14px !important" }} />} label="Em Analise" color="warning" size="small" />;
  return <Chip label="Aguardando dados" size="small" />;
}

export default function GuruPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { analyses, trends, loading } = useAppSelector((s) => s.guru);
  useEffect(() => { dispatch(fetchGuruData()); }, [dispatch]);
  if (loading && analyses.length === 0) return <PageSkeleton />;
  const isLight = theme.palette.mode === "light";

  const complete = analyses.filter(a => a.status === "complete").length;
  const criticalTrends = trends.filter(t => t.trend === "critical" || t.trend === "worsening").length;

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <AutoAwesomeIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box>
          <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
            <Typography variant="h5" fontWeight={700}>AG-03 — Guru e Vidente</Typography>
            <Chip label="Ativo" color="success" size="small" sx={{ fontWeight:700 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Diagnostico Cognitivo — Causa-raiz, tendencias e retroalimentacao do Sentinela
          </Typography>
        </Box>
        <Chip label="WSJF 3.7 — Nivel 3: ENTENDER" size="small" color="secondary" sx={{ ml:"auto" }} />
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Analises Completas" value={complete} trend="UP" trendValue={`${analyses.length} total`} severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Em Andamento" value={analyses.filter(a => a.status === "in_progress").length} trend="STABLE" trendValue="Guru processando" severity="MEDIUM" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Tendencias Criticas" value={criticalTrends} trend={criticalTrends > 2 ? "DOWN" : "STABLE"} trendValue={`${trends.length} total`} severity={criticalTrends > 2 ? "CRITICAL" : "HIGH"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Feedback ao Sentinela" value={analyses.filter(a => a.feedbackToSentinela).length} trend="UP" trendValue="novos padroes" severity="HEALTHY" />
        </Grid>
      </Grid>

      {/* Trends */}
      <Paper sx={{ borderRadius:2, mb:3, overflow:"hidden" }}>
        <Box sx={{ p:2, borderBottom:`1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Previsoes e Tendencias</Typography>
          <Typography variant="caption" color="text.secondary">Analise preditiva baseada em historico e padroes atuais</Typography>
        </Box>
        <Box sx={{ p:2 }}>
          <Grid container spacing={2}>
            {trends.map((t) => (
              <Grid item xs={12} sm={6} key={t.id}>
                <Card variant="outlined" sx={{ borderRadius:2,
                  borderColor: (t.trend === "critical" || t.trend === "worsening") ?
                    (isLight ? "rgba(227,24,55,0.3)" : "rgba(227,24,55,0.4)") : theme.palette.divider }}>
                  <CardContent sx={{ p:1.5, "&:last-child":{ pb:1.5 } }}>
                    <Box sx={{ display:"flex", alignItems:"flex-start", gap:1, mb:1 }}>
                      <Box sx={{ color: theme.palette[TREND_COLOR[t.trend]].main, mt:0.25 }}>
                        {TREND_ICON[t.trend]}
                      </Box>
                      <Box sx={{ flex:1 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight:1.3 }}>{t.title}</Typography>
                        <Box sx={{ display:"flex", gap:0.5, mt:0.5, flexWrap:"wrap" }}>
                          <Chip label={t.layer} size="small" variant="outlined" sx={{ height:18, fontSize:"0.62rem" }} />
                          <Chip label={t.horizon} size="small" sx={{ height:18, fontSize:"0.62rem" }} />
                          <Chip icon={TREND_ICON[t.trend]} label={t.trend.replace("_"," ")} size="small" color={TREND_COLOR[t.trend]} sx={{ height:18, fontSize:"0.62rem" }} />
                        </Box>
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{t.description}</Typography>
                    <Box sx={{ mt:1, display:"flex", alignItems:"center", gap:1 }}>
                      <Typography variant="caption" color="text.disabled">Confianca:</Typography>
                      <LinearProgress variant="determinate" value={t.confidence}
                        color={t.confidence > 80 ? "success" : t.confidence > 60 ? "warning" : "error"}
                        sx={{ flex:1, borderRadius:1, height:4 }} />
                      <Typography variant="caption" fontWeight={700}>{t.confidence}%</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>

      {/* Root cause analyses */}
      {analyses.map((analysis) => (
        <Paper key={analysis.id} sx={{ borderRadius:2, mb:2, overflow:"hidden",
          border: analysis.severity === "critical" ?
            `1px solid ${isLight ? "rgba(227,24,55,0.20)" : "rgba(227,24,55,0.25)"}` :
            `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ p:2, bgcolor: analysis.severity === "critical" ?
            (isLight ? "rgba(227,24,55,0.02)" : "rgba(227,24,55,0.04)") : "transparent" }}>
            <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:1, flexWrap:"wrap" }}>
              <AutoAwesomeIcon sx={{ fontSize:18, color:theme.palette.secondary.main }} />
              <Typography variant="subtitle1" fontWeight={700}>{analysis.caseTitle}</Typography>
              <StatusBadge status={analysis.status} />
              <Chip label={analysis.severity.toUpperCase()} size="small"
                color={analysis.severity === "critical" ? "error" : analysis.severity === "high" ? "warning" : "info"} />
              <Box sx={{ ml:"auto", display:"flex", alignItems:"center", gap:0.5 }}>
                <Typography variant="caption" color="text.disabled">Confianca:</Typography>
                <Typography variant="caption" fontWeight={700} color={analysis.confidence > 80 ? "success.main" : "warning.main"}>
                  {analysis.confidence}%
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ p:2 }}>
            <Grid container spacing={2}>
              {/* Root cause */}
              <Grid item xs={12} md={6}>
                <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  Causa Raiz Identificada
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt:0.5 }}>{analysis.rootCause}</Typography>
              </Grid>

              {/* Contributing factors */}
              <Grid item xs={12} md={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  Fatores Contribuintes
                </Typography>
                <List dense sx={{ mt:0.5, p:0 }}>
                  {analysis.contributingFactors.map((f, i) => (
                    <ListItem key={i} sx={{ px:0, py:0.25 }}>
                      <Box sx={{ width:6, height:6, borderRadius:"50%", bgcolor:"warning.main", mr:1, flexShrink:0 }} />
                      <Typography variant="caption" color="text.secondary">{f}</Typography>
                    </ListItem>
                  ))}
                </List>
              </Grid>

              {/* Historical pattern */}
              <Grid item xs={12}>
                <MuiAlert severity="info" icon={false} sx={{ py:0.5, fontSize:"0.78rem" }}>
                  <Typography variant="caption" fontWeight={700}>Padrao Historico: </Typography>
                  <Typography variant="caption">{analysis.historicalPattern}</Typography>
                </MuiAlert>
              </Grid>

              {/* Prevention & feedback */}
              <Grid item xs={12} md={6}>
                <Typography variant="caption" fontWeight={700} color="success.main" sx={{ textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  Medidas de Prevencao
                </Typography>
                <List dense sx={{ mt:0.5, p:0 }}>
                  {analysis.preventionMeasures.map((m, i) => (
                    <ListItem key={i} sx={{ px:0, py:0.25 }}>
                      <CheckCircleIcon sx={{ fontSize:12, color:"success.main", mr:1, flexShrink:0 }} />
                      <Typography variant="caption">{m}</Typography>
                    </ListItem>
                  ))}
                </List>
              </Grid>

              {/* Feedback to Sentinela */}
              <Grid item xs={12} md={6}>
                <Box sx={{ p:1.5, borderRadius:1.5, border:`1px solid ${theme.palette.divider}`,
                  bgcolor: isLight ? "rgba(0,47,108,0.03)" : "rgba(255,255,255,0.03)" }}>
                  <Box sx={{ display:"flex", alignItems:"center", gap:0.5, mb:0.5 }}>
                    <LoopIcon sx={{ fontSize:14, color:"secondary.main" }} />
                    <Typography variant="caption" fontWeight={700} color="secondary.main">
                      Retroalimentacao ao AG-01 Sentinela
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">{analysis.feedbackToSentinela}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
