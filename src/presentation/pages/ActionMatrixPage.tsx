import { useEffect } from "react";
import type { ReactElement } from "react";
import {
  Box, Grid, Typography, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, useTheme,
} from "@mui/material";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import BlockIcon from "@mui/icons-material/Block";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ReplayIcon from "@mui/icons-material/Replay";
import EscalatorWarningIcon from "@mui/icons-material/EscalatorWarning";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchActionRules } from "../../app/slices/actionMatrixSlice";
import type { ActionType, TriggerStatus } from "../../app/slices/actionMatrixSlice";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const ACTION_ICONS: Record<ActionType, ReactElement> = {
  block: <BlockIcon fontSize="small" />,
  notify: <NotificationsIcon fontSize="small" />,
  retry: <ReplayIcon fontSize="small" />,
  escalate: <EscalatorWarningIcon fontSize="small" />,
  auto_fix: <AutoFixHighIcon fontSize="small" />,
};

const ACTION_COLOR: Record<ActionType, "error" | "info" | "warning" | "primary" | "success"> = {
  block: "error", notify: "info", retry: "warning", escalate: "primary", auto_fix: "success",
};

function StatusBadge({ status }: { status: TriggerStatus }) {
  if (status === "triggered") return <Chip label="DISPARADO" color="error" size="small" sx={{ fontWeight:700 }} />;
  if (status === "inactive") return <Chip label="Inativo" size="small" />;
  return <Chip label="Ativo" color="success" size="small" variant="outlined" />;
}

export default function ActionMatrixPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { rules, loading } = useAppSelector((s) => s.actionMatrix);
  useEffect(() => { dispatch(fetchActionRules()); }, [dispatch]);
  if (loading && rules.length === 0) return <PageSkeleton title="Matriz de Acionamento" />;

  const triggered = rules.filter(r => r.status === "triggered").length;
  const withBlock = rules.filter(r => r.autoBlocking).length;
  const totalTriggers = rules.reduce((a, r) => a + r.triggerCount, 0);

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <PlaylistAddCheckIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Matriz de Acionamento</Typography>
          <Typography variant="body2" color="text.secondary">Regras de acao automatica por tipo de anomalia e camada</Typography>
        </Box>
        <Chip label="EP-06 · WSJF 4.3" size="small" color="secondary" sx={{ ml:"auto" }} />
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Regras Ativas" value={rules.filter(r => r.status !== "inactive").length} trend="FLAT" trendValue={`${rules.length} total`} severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Disparadas Agora" value={triggered} trend={triggered > 0 ? "DOWN" : "FLAT"} trendValue={`${triggered} em acao`} severity={triggered > 0 ? "CRITICAL" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Com Bloqueio Auto" value={withBlock} trend="FLAT" trendValue={`${withBlock} regras`} severity="HIGH" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Total de Disparos" value={totalTriggers} trend="UP" trendValue="historico" severity="MEDIUM" />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius:2, overflow:"hidden" }}>
        <Box sx={{ p:2, borderBottom:`1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Regras de Acionamento</Typography>
          <Typography variant="caption" color="text.secondary">Anomalia detectada {'=>'} Acao automatica {'=>'} Notificacao</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="caption" fontWeight={600}>Anomalia</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Camada</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Severidade</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Acao</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Canal</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Status</Typography></TableCell>
                <TableCell align="right"><Typography variant="caption" fontWeight={600}>Disparos</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id} hover sx={{
                  bgcolor: rule.status === "triggered" ? (theme.palette.mode === "light" ? "rgba(227,24,55,0.04)" : "rgba(227,24,55,0.08)") : "transparent"
                }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{rule.anomalyType}</Typography>
                    <Typography variant="caption" color="text.secondary">{rule.actionDescription}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={rule.layer} size="small" variant="outlined"
                      color={rule.layer === "analytics" ? "primary" : rule.layer === "trusted" ? "secondary" : "default"} />
                  </TableCell>
                  <TableCell>
                    <Chip label={rule.severity.toUpperCase()} size="small"
                      color={rule.severity === "critical" ? "error" : rule.severity === "high" ? "warning" : rule.severity === "medium" ? "info" : "default"} />
                  </TableCell>
                  <TableCell>
                    <Chip icon={ACTION_ICONS[rule.action]} label={rule.action.replace("_"," ")}
                      size="small" color={ACTION_COLOR[rule.action]} variant="outlined" />
                    {rule.autoBlocking && (
                      <Chip label="auto-block" size="small" color="error" variant="outlined" sx={{ ml:0.5, fontSize:"0.6rem", height:18 }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{rule.notifyChannel}</Typography>
                  </TableCell>
                  <TableCell><StatusBadge status={rule.status} /></TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={rule.triggerCount > 5 ? 600 : 400}
                      color={rule.triggerCount > 5 ? "warning.main" : "text.primary"}>
                      {rule.triggerCount}x
                    </Typography>
                    {rule.lastTriggeredAt && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(rule.lastTriggeredAt).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                      </Typography>
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
