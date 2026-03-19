import { useEffect } from "react";
import {
  Box, Grid, Typography, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, LinearProgress,
  Alert as MuiAlert, useTheme,
} from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchTrustedChecks, CheckStatus } from "../../app/slices/trustedSlice";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const categoryLabel: Record<string, string> = {
  integrity:"Integridade", consistency:"Consistencia",
  completeness:"Completude", timeliness:"Tempestividade",
};
const categoryColor: Record<string, "primary" | "secondary" | "default"> = {
  integrity:"primary", consistency:"secondary",
  completeness:"default", timeliness:"default",
};

function CheckChip({ status }: { status: CheckStatus }) {
  if (status === "pass") return <Chip icon={<CheckCircleIcon sx={{ fontSize:"14px !important" }} />} label="Pass" color="success" size="small" />;
  if (status === "warning") return <Chip icon={<WarningAmberIcon sx={{ fontSize:"14px !important" }} />} label="Warning" color="warning" size="small" />;
  if (status === "fail") return <Chip icon={<ErrorOutlineIcon sx={{ fontSize:"14px !important" }} />} label="Fail" color="error" size="small" />;
  return <Chip icon={<HourglassEmptyIcon sx={{ fontSize:"14px !important" }} />} label="Executando" size="small" />;
}

export default function TrustedPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { checks, loading } = useAppSelector((s) => s.trusted);
  useEffect(() => { dispatch(fetchTrustedChecks()); }, [dispatch]);
  if (loading && checks.length === 0) return <PageSkeleton />;

  const pass = checks.filter(c => c.status === "pass").length;
  const fail = checks.filter(c => c.status === "fail").length;
  const warn = checks.filter(c => c.status === "warning").length;
  const avgPassRate = checks.filter(c => c.passRate > 0).reduce((a, c) => a + c.passRate, 0) / (checks.filter(c => c.passRate > 0).length || 1);

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <VerifiedUserIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Monitoramento de Trusted</Typography>
          <Typography variant="body2" color="text.secondary">Quality Gates — Validacao de integridade nas transicoes de camada</Typography>
        </Box>
        <Chip label="EP-09 · WSJF 6.8" size="small" color="secondary" sx={{ ml:"auto" }} />
      </Box>

      {fail > 0 && (
        <MuiAlert severity="error" sx={{ mb:2 }}>
          {fail} quality gate(s) falhando — risco de propagacao de dados incorretos para Analytics.
        </MuiAlert>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Checks Passando" value={pass} trend="UP" trendValue={`${pass}/${checks.length}`} severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Checks Falhando" value={fail} trend={fail > 0 ? "DOWN" : "STABLE"} trendValue={`${fail} gates`} severity={fail > 0 ? "CRITICAL" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Com Alertas" value={warn} trend="STABLE" trendValue={`${warn} warnings`} severity={warn > 0 ? "HIGH" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Pass Rate Medio" value={`${avgPassRate.toFixed(1)}%`} trend="STABLE" trendValue="media ponderada" severity={avgPassRate > 95 ? "HEALTHY" : avgPassRate > 85 ? "MEDIUM" : "HIGH"} />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius:2, overflow:"hidden" }}>
        <Box sx={{ p:2, borderBottom:`1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Quality Gates</Typography>
          <Typography variant="caption" color="text.secondary">Verificacoes de qualidade nas fronteiras Ingestion {'=>'} Trusted {'=>'} Analytics</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="caption" fontWeight={600}>Verificacao</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Categoria</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Transicao</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Status</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Verificados</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Falhas</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Pass Rate</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {checks.map((c) => (
                <TableRow key={c.id} hover sx={{ bgcolor: c.status === "fail" ? (theme.palette.mode === "light" ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.06)") : "transparent" }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{c.description}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={categoryLabel[c.category] ?? c.category} size="small"
                      color={categoryColor[c.category] ?? "default"} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{c.transition}</Typography>
                  </TableCell>
                  <TableCell><CheckChip status={c.status} /></TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{c.recordsChecked.toLocaleString("pt-BR")}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color={c.failedRecords > 0 ? "error.main" : "text.primary"}>
                      {c.failedRecords.toLocaleString("pt-BR")}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ width:150 }}>
                    {c.status === "running" ? (
                      <Typography variant="caption" color="text.secondary">executando...</Typography>
                    ) : (
                      <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                        <LinearProgress variant="determinate" value={c.passRate}
                          color={c.passRate > 95 ? "success" : c.passRate > 80 ? "warning" : "error"}
                          sx={{ flex:1, borderRadius:1, height:6 }} />
                        <Typography variant="caption">{c.passRate.toFixed(1)}%</Typography>
                      </Box>
                    )}
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
