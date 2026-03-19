import { useEffect } from "react";
import {
  Box, Grid, Typography, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Divider, useTheme,
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchGovernanceData, RuleStatus, BlockStatus } from "../../app/slices/governanceSlice";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

function RuleStatusChip({ status }: { status: RuleStatus }) {
  if (status === "active") return <Chip label="Ativa" color="success" size="small" variant="outlined" />;
  if (status === "draft") return <Chip label="Rascunho" color="default" size="small" variant="outlined" />;
  return <Chip label="Inativa" size="small" />;
}

function BlockStatusChip({ status }: { status: BlockStatus }) {
  if (status === "blocked") return <Chip icon={<BlockIcon sx={{ fontSize:"14px !important" }} />} label="Bloqueado" color="error" size="small" />;
  if (status === "under_review") return <Chip icon={<HourglassTopIcon sx={{ fontSize:"14px !important" }} />} label="Em Analise" color="warning" size="small" />;
  return <Chip icon={<LockOpenIcon sx={{ fontSize:"14px !important" }} />} label="Liberado" color="success" size="small" />;
}

export default function GovernancePage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { rules, blockedProcesses, loading } = useAppSelector((s) => s.governance);
  useEffect(() => { dispatch(fetchGovernanceData()); }, [dispatch]);
  if (loading && rules.length === 0) return <PageSkeleton />;

  const blocked = blockedProcesses.filter(p => p.status === "blocked" || p.status === "under_review").length;
  const activeRules = rules.filter(r => r.status === "active").length;
  const totalTriggers = rules.reduce((a, r) => a + r.triggerCount, 0);

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <GavelIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Governanca e Regras de Bloqueio</Typography>
          <Typography variant="body2" color="text.secondary">Regras automaticas para travar processos com base em tipo de erro e impacto</Typography>
        </Box>
        <Chip label="EP-07 · WSJF 3.6" size="small" color="secondary" sx={{ ml:"auto" }} />
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Regras Ativas" value={activeRules} trend="STABLE" trendValue={`${rules.length} total`} severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Processos Bloqueados" value={blocked} trend={blocked > 0 ? "DOWN" : "STABLE"} trendValue={`${blocked} ativos`} severity={blocked > 1 ? "CRITICAL" : blocked === 1 ? "HIGH" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Regras em Rascunho" value={rules.filter(r => r.status === "draft").length} trend="STABLE" trendValue="aguardando ativacao" severity="LOW" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Total de Acionamentos" value={totalTriggers} trend="UP" trendValue="historico completo" severity="MEDIUM" />
        </Grid>
      </Grid>

      {/* Blocked processes */}
      <Paper sx={{ borderRadius:2, overflow:"hidden", mb:3 }}>
        <Box sx={{ p:2, borderBottom:`1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Processos Bloqueados / Em Analise</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="caption" fontWeight={600}>Processo</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Camada</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Motivo</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Status</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Bloqueado em</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Regra</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {blockedProcesses.map((p) => (
                <TableRow key={p.id} hover sx={{
                  bgcolor: p.status === "blocked" ? (theme.palette.mode === "light" ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.06)") : "transparent"
                }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{p.processName}</Typography>
                  </TableCell>
                  <TableCell><Chip label={p.layer} size="small" variant="outlined" /></TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{p.reason}</Typography>
                  </TableCell>
                  <TableCell><BlockStatusChip status={p.status} /></TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(p.blockedAt).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                    </Typography>
                    {p.releasedAt && (
                      <Typography variant="caption" color="success.main" display="block">
                        Liberado: {new Date(p.releasedAt).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell><Chip label={p.blockedBy} size="small" variant="outlined" color="primary" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Rules */}
      <Paper sx={{ borderRadius:2, overflow:"hidden" }}>
        <Box sx={{ p:2, borderBottom:`1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Regras de Governanca</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="caption" fontWeight={600}>Regra</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Camada</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Condicao</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Acao</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Status</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Disparos</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{rule.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{rule.description}</Typography>
                  </TableCell>
                  <TableCell><Chip label={rule.layer} size="small" variant="outlined" /></TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily:"monospace", bgcolor: theme.palette.action.hover, px:0.5, borderRadius:0.5 }}>
                      {rule.condition}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="primary.main" fontWeight={600}>{rule.action}</Typography>
                  </TableCell>
                  <TableCell><RuleStatusChip status={rule.status} /></TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={rule.triggerCount > 3 ? 600 : 400}>{rule.triggerCount}x</Typography>
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
