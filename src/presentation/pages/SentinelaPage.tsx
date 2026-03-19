import { useEffect } from "react";
import type { ReactElement } from "react";
import {
  Box, Grid, Typography, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, LinearProgress,
  Alert as MuiAlert, useTheme, Card, CardContent,
} from "@mui/material";
import RadarIcon from "@mui/icons-material/Radar";
import WifiIcon from "@mui/icons-material/Wifi";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchSentinelaData } from "../../app/slices/sentinelaSlice";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const QUALITY_COLOR: Record<string, "success" | "warning" | "error"> = {
  high: "success", medium: "warning", low: "error",
};

const LAYER_COLOR: Record<string, string> = {
  ingestion: "#E31837", trusted: "#002F6C", analytics: "#00873D", batch: "#F5A623",
};

interface StatusItem { icon: ReactElement; title: string; desc: string; ok: boolean; }

export default function SentinelaPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { signals, noiseReduction, anomalyCount, baselineLearned, monitoredSources, signalQuality, loading } = useAppSelector((s) => s.sentinela);
  useEffect(() => { dispatch(fetchSentinelaData()); }, [dispatch]);
  if (loading && signals.length === 0) return <PageSkeleton title="AG-01 Sentinela" />;

  const statusItems: StatusItem[] = [
    { icon:<WifiIcon />, title:"Ingestao Sensorial", desc:"Conectado a 6 sources de ingestion, 1 trusted, 1 batch", ok:true },
    { icon:<FilterAltIcon />, title:"Filtro de Ruido", desc:`${noiseReduction}% de reducao ativa — ${monitoredSources * 47} sinais filtrados/ciclo`, ok:true },
    { icon:<RadarIcon />, title:"Baseline Learning", desc:baselineLearned ? "Baselines consolidados para todos os sources ativos" : "Em aprendizado...", ok:baselineLearned },
    { icon:<WarningAmberIcon />, title:"Saida para AG-02", desc:`${anomalyCount} sinais qualificados como anomalias`, ok:anomalyCount === 0 },
  ];

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <RadarIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box>
          <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
            <Typography variant="h5" fontWeight={700}>AG-01 — Sentinela e Vidente</Typography>
            <Chip label="Ativo" color="success" size="small" sx={{ fontWeight:700 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Curadoria de Sinais — Reducao de ruido, deteccao de baseline e qualificacao de anomalias
          </Typography>
        </Box>
        <Chip label="4CO Nivel 1: OBSERVAR" size="small" color="secondary" sx={{ ml:"auto" }} />
      </Box>

      {anomalyCount > 0 && (
        <MuiAlert severity="warning" icon={<WarningAmberIcon />} sx={{ mb:2 }}>
          <strong>{anomalyCount} anomalia(s)</strong> detectada(s) pelo Sentinela — qualificadas para AG-02 Detetive.
        </MuiAlert>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Reducao de Ruido" value={`${noiseReduction}%`} trend="UP" trendValue="meta: 95%" severity={noiseReduction >= 90 ? "HEALTHY" : "HIGH"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Anomalias Detectadas" value={anomalyCount} trend={anomalyCount > 2 ? "DOWN" : "FLAT"} trendValue="para o Detetive" severity={anomalyCount > 3 ? "CRITICAL" : anomalyCount > 1 ? "HIGH" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Sources Monitorados" value={monitoredSources} trend="FLAT" trendValue="todas as camadas" severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Qualidade de Sinal" value={`${signalQuality}%`} trend={signalQuality > 80 ? "UP" : "FLAT"} trendValue={baselineLearned ? "baseline OK" : "aprendendo..."} severity={signalQuality >= 80 ? "HEALTHY" : "MEDIUM"} />
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={3}>
        {statusItems.map((item, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius:2, height:"100%",
              border:`1px solid ${item.ok ? theme.palette.success.main + "30" : theme.palette.warning.main + "30"}` }}>
              <CardContent sx={{ p:2 }}>
                <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:1 }}>
                  <Box sx={{ color: item.ok ? theme.palette.success.main : theme.palette.warning.main }}>{item.icon}</Box>
                  <Typography variant="subtitle2" fontWeight={700}>{item.title}</Typography>
                  {item.ok
                    ? <CheckCircleIcon sx={{ ml:"auto", color:theme.palette.success.main, fontSize:16 }} />
                    : <WarningAmberIcon sx={{ ml:"auto", color:theme.palette.warning.main, fontSize:16 }} />}
                </Box>
                <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ borderRadius:2, overflow:"hidden" }}>
        <Box sx={{ p:2, borderBottom:`1px solid ${theme.palette.divider}`, display:"flex", alignItems:"center", gap:2 }}>
          <Typography variant="subtitle1" fontWeight={600}>Stream de Sinais — Ciclo Atual</Typography>
          <Chip label="Ao vivo" color="success" size="small" />
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="caption" fontWeight={600}>Source</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Camada</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Valor Atual</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Baseline</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Desvio</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Qualidade</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Classificacao</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {signals.map((sig) => (
                <TableRow key={sig.id} hover sx={{
                  bgcolor: sig.isAnomaly ? (theme.palette.mode === "light" ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.07)") : "transparent"
                }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{sig.source}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={sig.layer} size="small" sx={{
                      bgcolor: (LAYER_COLOR[sig.layer] ?? "#888") + "20",
                      color: LAYER_COLOR[sig.layer] ?? "#888",
                      fontWeight:600, border:"none",
                    }} />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{sig.value.toLocaleString("pt-BR")}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">{sig.baseline.toLocaleString("pt-BR")}</Typography>
                  </TableCell>
                  <TableCell sx={{ width:160 }}>
                    <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                      <LinearProgress variant="determinate"
                        value={Math.min(Math.abs(sig.deviation), 100)}
                        color={Math.abs(sig.deviation) > 50 ? "error" : Math.abs(sig.deviation) > 5 ? "warning" : "success"}
                        sx={{ flex:1, borderRadius:1, height:6 }} />
                      <Typography variant="caption" color={Math.abs(sig.deviation) > 10 ? "error.main" : "text.secondary"}>
                        {sig.deviation > 0 ? "+" : ""}{sig.deviation.toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={sig.quality} size="small" color={QUALITY_COLOR[sig.quality] ?? "default"} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {sig.isAnomaly
                      ? <Chip icon={<WarningAmberIcon sx={{ fontSize:"14px !important" }} />} label="Anomalia" color="error" size="small" />
                      : <Chip icon={<CheckCircleIcon sx={{ fontSize:"14px !important" }} />} label="Normal" color="success" size="small" variant="outlined" />
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
