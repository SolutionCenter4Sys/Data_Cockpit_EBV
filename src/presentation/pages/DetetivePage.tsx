import { useEffect } from "react";
import {
  Box, Grid, Typography, Chip, Paper, Divider,
  Alert as MuiAlert, useTheme, LinearProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LinkIcon from "@mui/icons-material/Link";
import ForwardIcon from "@mui/icons-material/Forward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import CancelIcon from "@mui/icons-material/Cancel";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchDetetivoData } from "../../app/slices/detetivoSlice";
import type { CaseStatus } from "../../app/slices/detetivoSlice";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const CORR_COLOR: Record<string, string> = {
  temporal:"#F5A623", causal:"#E31837", process:"#002F6C", data_dependency:"#00873D",
};

function CaseChip({ status }: { status: CaseStatus }) {
  if (status === "open") return <Chip icon={<PendingIcon sx={{ fontSize:"14px !important" }} />} label="Aberto" color="warning" size="small" />;
  if (status === "investigating") return <Chip icon={<SearchIcon sx={{ fontSize:"14px !important" }} />} label="Investigando" color="primary" size="small" />;
  if (status === "confirmed") return <Chip icon={<CheckCircleIcon sx={{ fontSize:"14px !important" }} />} label="Confirmado" color="error" size="small" />;
  if (status === "closed") return <Chip icon={<CheckCircleIcon sx={{ fontSize:"14px !important" }} />} label="Encerrado" color="success" size="small" variant="outlined" />;
  return <Chip icon={<CancelIcon sx={{ fontSize:"14px !important" }} />} label="Falso Positivo" size="small" />;
}

export default function DetetivePage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { cases, loading } = useAppSelector((s) => s.detetivo);
  useEffect(() => { dispatch(fetchDetetivoData()); }, [dispatch]);
  if (loading && cases.length === 0) return <PageSkeleton />;
  const isLight = theme.palette.mode === "light";

  const open = cases.filter(c => c.status === "open" || c.status === "investigating" || c.status === "confirmed").length;
  const critical = cases.filter(c => c.severity === "critical" && c.status !== "closed" && c.status !== "false_positive").length;
  const passedToGuru = cases.filter(c => c.passedToGuru).length;

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <SearchIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box>
          <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
            <Typography variant="h5" fontWeight={700}>AG-02 — Detetive</Typography>
            <Chip label="Ativo" color="success" size="small" sx={{ fontWeight:700 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Deteccao de Anomalias — Investigacao, correlacao e dossiês por caso
          </Typography>
        </Box>
        <Chip label="WSJF 6.6 — Nivel 2: DETECTAR" size="small" color="secondary" sx={{ ml:"auto" }} />
      </Box>

      {critical > 0 && (
        <MuiAlert severity="error" sx={{ mb:2 }}>
          <strong>{critical} caso(s) critico(s)</strong> em investigacao — acao imediata necessaria.
        </MuiAlert>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Casos Abertos" value={open} trend={open > 2 ? "DOWN" : "STABLE"} trendValue={`${critical} criticos`} severity={critical > 0 ? "CRITICAL" : open > 0 ? "HIGH" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Em Investigacao" value={cases.filter(c => c.status === "investigating").length} trend="STABLE" trendValue="Detetive analisando" severity="HIGH" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Passados ao Guru" value={passedToGuru} trend="UP" trendValue="para causa-raiz" severity="MEDIUM" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Encerrados Hoje" value={cases.filter(c => c.status === "closed").length} trend="UP" trendValue="resolvidos" severity="HEALTHY" />
        </Grid>
      </Grid>

      {/* Case list */}
      {cases.map((c) => (
        <Paper key={c.id} sx={{ borderRadius:2, mb:2, overflow:"hidden",
          border: c.severity === "critical" && c.status !== "closed" ?
            `1px solid ${isLight ? "rgba(227,24,55,0.25)" : "rgba(227,24,55,0.30)"}` :
            `1px solid ${theme.palette.divider}` }}>
          {/* Case header */}
          <Box sx={{ p:2, display:"flex", alignItems:"flex-start", gap:1.5,
            bgcolor: c.severity === "critical" && c.status !== "closed" ?
              (isLight ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.06)") : "transparent" }}>
            <Box sx={{ flex:1 }}>
              <Box sx={{ display:"flex", alignItems:"center", gap:1, flexWrap:"wrap", mb:0.5 }}>
                <Typography variant="subtitle1" fontWeight={700}>{c.title}</Typography>
                <CaseChip status={c.status} />
                <Chip label={c.severity.toUpperCase()} size="small"
                  color={c.severity === "critical" ? "error" : c.severity === "high" ? "warning" : "info"} />
                <Chip label={c.layer} size="small" variant="outlined" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb:1 }}>{c.summary}</Typography>
              <Box sx={{ display:"flex", alignItems:"center", gap:1, flexWrap:"wrap" }}>
                <Typography variant="caption" color="text.disabled">
                  Aberto: {new Date(c.openedAt).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                </Typography>
                {c.passedToGuru && (
                  <Chip icon={<ForwardIcon sx={{ fontSize:"12px !important" }} />} label="Passado ao AG-03 Guru" size="small"
                    sx={{ height:18, fontSize:"0.62rem", bgcolor: isLight ? "rgba(0,47,108,0.08)" : "rgba(255,255,255,0.08)" }} />
                )}
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Correlations */}
          <Box sx={{ p:2 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform:"uppercase", letterSpacing:"0.06em" }}>
              Correlacoes ({c.correlations.length})
            </Typography>
            <Box sx={{ display:"flex", flexDirection:"column", gap:1, mt:1 }}>
              {c.correlations.map((corr, i) => (
                <Box key={i} sx={{ display:"flex", alignItems:"flex-start", gap:1.5 }}>
                  <Box sx={{ display:"flex", alignItems:"center", gap:0.5, minWidth:120 }}>
                    <LinkIcon sx={{ fontSize:14, color:CORR_COLOR[corr.correlationType] ?? "#888" }} />
                    <Chip label={corr.correlationType.replace("_"," ")} size="small"
                      sx={{ height:18, fontSize:"0.6rem", bgcolor:(CORR_COLOR[corr.correlationType] ?? "#888") + "20",
                        color:CORR_COLOR[corr.correlationType] ?? "#888", border:"none" }} />
                  </Box>
                  <Box sx={{ flex:1 }}>
                    <Typography variant="caption" fontWeight={600}>{corr.source}</Typography>
                    <Typography variant="caption" color="text.secondary"> — {corr.description}</Typography>
                  </Box>
                  <Box sx={{ minWidth:80, display:"flex", alignItems:"center", gap:0.5 }}>
                    <LinearProgress variant="determinate" value={corr.strength}
                      color={corr.strength > 80 ? "error" : corr.strength > 60 ? "warning" : "success"}
                      sx={{ flex:1, borderRadius:1, height:5 }} />
                    <Typography variant="caption" sx={{ fontSize:"0.62rem" }}>{corr.strength}%</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Affected processes */}
          <Box sx={{ px:2, pb:2 }}>
            <Typography variant="caption" color="text.disabled">Processos afetados: </Typography>
            {c.affectedProcesses.map((p, i) => (
              <Chip key={i} label={p} size="small" variant="outlined" sx={{ mr:0.5, height:18, fontSize:"0.62rem" }} />
            ))}
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
