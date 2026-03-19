import { useEffect } from "react";
import type { ReactElement } from "react";
import {
  Box, Grid, Typography, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Alert as MuiAlert, useTheme,
} from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import BackupTableIcon from "@mui/icons-material/BackupTable";
import DataObjectIcon from "@mui/icons-material/DataObject";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchGuardiaoData } from "../../app/slices/guardiaoSlice";
import type { BoundaryCheck, IssueType } from "../../app/slices/guardiaoSlice";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const ISSUE_ICONS: Record<IssueType, ReactElement> = {
  fft_copy: <FingerprintIcon fontSize="small" />,
  truncation: <FormatAlignLeftIcon fontSize="small" />,
  null_field: <DataObjectIcon fontSize="small" />,
  schema: <BackupTableIcon fontSize="small" />,
  checksum: <FingerprintIcon fontSize="small" />,
  other: <ErrorOutlineIcon fontSize="small" />,
};

const ISSUE_LABELS: Record<IssueType, string> = {
  fft_copy:"Copia FFT", truncation:"Truncamento", null_field:"Campo Nulo",
  schema:"Schema", checksum:"Checksum", other:"Outro",
};

function GateChip({ status }: { status: BoundaryCheck }) {
  if (status === "pass") return <Chip icon={<CheckCircleIcon sx={{ fontSize:"14px !important" }} />} label="Pass" color="success" size="small" />;
  if (status === "warning") return <Chip icon={<WarningAmberIcon sx={{ fontSize:"14px !important" }} />} label="Alerta" color="warning" size="small" />;
  if (status === "fail") return <Chip icon={<ErrorOutlineIcon sx={{ fontSize:"14px !important" }} />} label="Falha" color="error" size="small" />;
  return <Chip label="Executando" size="small" />;
}

export default function GuardiaoPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { gates, violations, loading } = useAppSelector((s) => s.guardiao);
  useEffect(() => { dispatch(fetchGuardiaoData()); }, [dispatch]);
  if (loading && gates.length === 0) return <PageSkeleton />;

  const failing = gates.filter(g => g.status === "fail").length;
  const openViolations = violations.filter(v => v.status === "open").length;
  const critical = violations.filter(v => v.severity === "critical" && v.status === "open").length;
  const ing2tru = gates.filter(g => g.boundary === "ingestion_to_trusted");
  const tru2ana = gates.filter(g => g.boundary === "trusted_to_analytics");

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <ShieldIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box>
          <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
            <Typography variant="h5" fontWeight={700}>AG-06 — Guardiao de Qualidade</Typography>
            <Chip label="Ativo" color="success" size="small" sx={{ fontWeight:700 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Quality Gates — Integridade nas fronteiras Ingestion, Trusted e Analytics
          </Typography>
        </Box>
        <Chip label="WSJF 9.2 — Nivel 2: DETECTAR" size="small" color="secondary" sx={{ ml:"auto" }} />
      </Box>

      {critical > 0 && (
        <MuiAlert severity="error" sx={{ mb:2 }}>
          <strong>{critical} violacao(es) critica(s)</strong> detectada(s) — propagacao de dados incorretos pode estar ocorrendo.
        </MuiAlert>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Gates Passando" value={gates.filter(g => g.status === "pass").length} trend="STABLE" trendValue={`${gates.length} total`} severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Gates Falhando" value={failing} trend={failing > 0 ? "DOWN" : "STABLE"} trendValue={`${failing} gates`} severity={failing > 0 ? "CRITICAL" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Violacoes Abertas" value={openViolations} trend={openViolations > 0 ? "DOWN" : "STABLE"} trendValue={`${critical} criticas`} severity={critical > 0 ? "CRITICAL" : openViolations > 0 ? "HIGH" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Violacoes Resolvidas" value={violations.filter(v => v.status === "resolved").length} trend="UP" trendValue="historico de hoje" severity="HEALTHY" />
        </Grid>
      </Grid>

      {/* Gates por boundary */}
      <Grid container spacing={2} mb={3}>
        {[
          { label:"Ingestion para Trusted", gates:ing2tru, color:"#E31837" },
          { label:"Trusted para Analytics", gates:tru2ana, color:"#002F6C" },
        ].map((group) => (
          <Grid item xs={12} md={6} key={group.label}>
            <Paper sx={{ borderRadius:2, overflow:"hidden", height:"100%" }}>
              <Box sx={{ p:1.5, borderBottom:`1px solid ${theme.palette.divider}`, display:"flex", alignItems:"center", gap:1 }}>
                <Box sx={{ width:10, height:10, borderRadius:"50%", bgcolor:group.color }} />
                <Typography variant="subtitle2" fontWeight={700}>{group.label}</Typography>
              </Box>
              <Table size="small">
                <TableBody>
                  {group.gates.map((gate) => (
                    <TableRow key={gate.id} hover sx={{
                      bgcolor: gate.status === "fail" ? (theme.palette.mode === "light" ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.06)") : "transparent"
                    }}>
                      <TableCell><Typography variant="body2">{gate.name}</Typography></TableCell>
                      <TableCell><GateChip status={gate.status} /></TableCell>
                      <TableCell align="right">
                        <Typography variant="caption" color="text.secondary">{gate.checksPassed}/{gate.checksTotal}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {gate.activeViolations > 0 && (
                          <Chip label={`${gate.activeViolations} viol.`} color="error" size="small" sx={{ height:18, fontSize:"0.62rem" }} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Violations */}
      <Paper sx={{ borderRadius:2, overflow:"hidden" }}>
        <Box sx={{ p:2, borderBottom:`1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Violacoes Detectadas</Typography>
          <Typography variant="caption" color="text.secondary">FFT incorreto, truncamentos, campos nulos, schema invalido</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="caption" fontWeight={600}>Tipo</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Fronteira</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Severidade</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Descricao</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Afetados</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Status</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {violations.map((v) => (
                <TableRow key={v.id} hover sx={{
                  bgcolor: v.severity === "critical" && v.status === "open" ? (theme.palette.mode === "light" ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.06)") : "transparent"
                }}>
                  <TableCell>
                    <Box sx={{ display:"flex", alignItems:"center", gap:0.5 }}>
                      <Box sx={{ color: theme.palette.text.secondary }}>{ISSUE_ICONS[v.issueType]}</Box>
                      <Typography variant="body2">{ISSUE_LABELS[v.issueType]}</Typography>
                    </Box>
                    {v.field && <Typography variant="caption" color="text.secondary" sx={{ fontFamily:"monospace" }}>{v.field}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {v.layer === "ingestion_to_trusted" ? "Ing. a Trusted" : "Trusted a Ana."}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={v.severity.toUpperCase()} size="small"
                      color={v.severity === "critical" ? "error" : v.severity === "high" ? "warning" : "info"} />
                  </TableCell>
                  <TableCell sx={{ maxWidth:280 }}>
                    <Typography variant="caption" color="text.secondary">{v.description}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color={v.affectedRecords > 1000 ? "error.main" : "text.primary"}>
                      {v.affectedRecords.toLocaleString("pt-BR")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {v.status === "open" ? <Chip label="Aberto" color="error" size="small" />
                     : v.status === "resolved" ? <Chip label="Resolvido" color="success" size="small" variant="outlined" />
                     : <Chip label="Suprimido" size="small" />}
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
