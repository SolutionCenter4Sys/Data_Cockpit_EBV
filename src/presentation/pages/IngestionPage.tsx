import { useEffect } from "react";
import {
  Box, Grid, Typography, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, LinearProgress,
  Alert as MuiAlert, useTheme,
} from "@mui/material";
import InputIcon from "@mui/icons-material/Input";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchIngestionSources, IngestionStatus } from "../../app/slices/ingestionSlice";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

function StatusChip({ status }: { status: IngestionStatus }) {
  if (status === "ok") return <Chip icon={<CheckCircleIcon sx={{ fontSize:"14px !important" }} />} label="OK" color="success" size="small" />;
  if (status === "warning") return <Chip icon={<WarningAmberIcon sx={{ fontSize:"14px !important" }} />} label="Alerta" color="warning" size="small" />;
  if (status === "error") return <Chip icon={<ErrorOutlineIcon sx={{ fontSize:"14px !important" }} />} label="Erro" color="error" size="small" />;
  return <Chip label="Inativo" size="small" />;
}

export default function IngestionPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { sources, loading } = useAppSelector((s) => s.ingestion);
  useEffect(() => { dispatch(fetchIngestionSources()); }, [dispatch]);
  if (loading && sources.length === 0) return <PageSkeleton />;

  const ok = sources.filter(s => s.status === "ok").length;
  const err = sources.filter(s => s.status === "error").length;
  const warn = sources.filter(s => s.status === "warning").length;
  const totalRec = sources.reduce((a, s) => a + s.recordsProcessed, 0);
  const totalErr = sources.reduce((a, s) => a + s.errorCount, 0);

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <InputIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Monitoramento de Ingestion</Typography>
          <Typography variant="body2" color="text.secondary">Enriquecimento — Endereco, E-mail, Historico Financeiro, Identidade</Typography>
        </Box>
        <Chip label="EP-08 · WSJF 6.8" size="small" color="secondary" sx={{ ml:"auto" }} />
      </Box>

      {err > 0 && (
        <MuiAlert severity="error" sx={{ mb:2 }}>
          {err} source(s) com erro critico — verificar imediatamente.
        </MuiAlert>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Sources Totais" value={sources.length} trend="STABLE" trendValue="+0" severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Operacionais" value={ok} trend="UP" trendValue={`${ok}/${sources.length}`} severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Com Problemas" value={warn + err} trend={err > 0 ? "DOWN" : "STABLE"} trendValue={`${warn} alerta · ${err} erro`} severity={err > 0 ? "CRITICAL" : warn > 0 ? "HIGH" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Registros/Ciclo" value={totalRec.toLocaleString("pt-BR")} trend="UP" trendValue={`${totalErr} erros`} severity="MEDIUM" />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius:2, overflow:"hidden" }}>
        <Box sx={{ p:2, borderBottom:`1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Sources de Ingestion</Typography>
          <Typography variant="caption" color="text.secondary">Monitoramento em tempo real por fonte de dados</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="caption" fontWeight={600}>Source</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Tipo</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Status</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Registros</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Erros</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Taxa Erro</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Latencia</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sources.map((src) => (
                <TableRow key={src.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{src.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{src.description}</Typography>
                  </TableCell>
                  <TableCell><Chip label={src.type} size="small" variant="outlined" /></TableCell>
                  <TableCell><StatusChip status={src.status} /></TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{src.recordsProcessed.toLocaleString("pt-BR")}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color={src.errorCount > 100 ? "error.main" : "text.primary"}>
                      {src.errorCount.toLocaleString("pt-BR")}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ width:160 }}>
                    <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                      <LinearProgress variant="determinate" value={Math.min(src.errorRate, 100)}
                        color={src.errorRate > 5 ? "error" : src.errorRate > 1 ? "warning" : "success"}
                        sx={{ flex:1, borderRadius:1, height:6 }} />
                      <Typography variant="caption">{src.errorRate.toFixed(2)}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color={src.latencyMs > 500 ? "warning.main" : "text.primary"}>
                      {src.latencyMs > 0 ? `${src.latencyMs}ms` : "—"}
                    </Typography>
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
