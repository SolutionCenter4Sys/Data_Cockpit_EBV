import { useEffect } from "react";
import {
  Box, Grid, Typography, Chip, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, useTheme,
} from "@mui/material";
import ForumIcon from "@mui/icons-material/Forum";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SendIcon from "@mui/icons-material/Send";
import ScheduleIcon from "@mui/icons-material/Schedule";
import BlockIcon from "@mui/icons-material/Block";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import SlackIcon from "@mui/icons-material/Tag";
import EmailIcon from "@mui/icons-material/Email";
import BugReportIcon from "@mui/icons-material/BugReport";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchComunicadorData } from "../../app/slices/comunicadorSlice";
import type { Channel, NotifStatus } from "../../app/slices/comunicadorSlice";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const CHANNEL_ICONS: Record<Channel, React.ReactElement> = {
  slack:     <SlackIcon sx={{ fontSize:14 }} />,
  email:     <EmailIcon sx={{ fontSize:14 }} />,
  teams:     <ForumIcon sx={{ fontSize:14 }} />,
  jira:      <BugReportIcon sx={{ fontSize:14 }} />,
  pagerduty: <NotificationsActiveIcon sx={{ fontSize:14 }} />,
};

const STATUS_CONFIG: Record<NotifStatus, { label:string; color:"success"|"warning"|"error"|"default" }> = {
  sent:       { label:"Enviada",    color:"success" },
  pending:    { label:"Pendente",   color:"warning" },
  failed:     { label:"Falhou",     color:"error" },
  suppressed: { label:"Suprimida",  color:"default" },
};

export default function ComunicadorPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { notifications, routingRules, stats, loading } = useAppSelector((s) => s.comunicador);
  useEffect(() => { dispatch(fetchComunicadorData()); }, [dispatch]);
  if (loading && notifications.length === 0) return <PageSkeleton />;
  const isLight = theme.palette.mode === "light";

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <ForumIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box>
          <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
            <Typography variant="h5" fontWeight={700}>AG-04 — Comunicador</Typography>
            <Chip label="Ativo" color="success" size="small" sx={{ fontWeight:700 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            ChatOps inteligente — roteamento contextualizado, atribuicao automatica e reducao de ruido
          </Typography>
        </Box>
        <Chip label="WSJF 3.3 — Nivel 4: COMUNICAR" size="small" color="secondary" sx={{ ml:"auto" }} />
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Enviadas Hoje" value={stats?.sentToday ?? 0} trend="STABLE" trendValue="notificacoes" severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Suprimidas" value={stats?.suppressed ?? 0} trend="UP" trendValue="ruido evitado" severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Atribuicao Automatica" value={`${stats?.autoAssignedPct ?? 0}%`} trend="UP" trendValue="sem intervencao manual" severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Tempo de Roteamento" value={`${stats?.avgRoutingTimeSec ?? 0}s`} trend="DOWN" trendValue="media por notificacao" severity="HEALTHY" />
        </Grid>
      </Grid>

      {/* Channel stats */}
      {stats && (
        <Paper sx={{ borderRadius:2, p:2, mb:3 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Canais Utilizados Hoje</Typography>
          <Box sx={{ display:"flex", flexWrap:"wrap", gap:1.5 }}>
            {(Object.entries(stats.channelBreakdown) as [Channel, number][]).map(([ch, count]) => (
              count > 0 && (
                <Box key={ch} sx={{ display:"flex", alignItems:"center", gap:0.5,
                  px:1.5, py:0.75, borderRadius:2,
                  bgcolor: isLight ? "rgba(0,47,108,0.05)" : "rgba(255,255,255,0.05)" }}>
                  <Box sx={{ color: theme.palette.text.secondary }}>{CHANNEL_ICONS[ch]}</Box>
                  <Typography variant="body2" fontWeight={600}>{ch}</Typography>
                  <Chip label={count} size="small" color="primary" sx={{ height:18, fontSize:"0.65rem", ml:0.5 }} />
                </Box>
              )
            ))}
          </Box>
        </Paper>
      )}

      {/* Notifications */}
      <Paper sx={{ borderRadius:2, overflow:"hidden", mb:3 }}>
        <Box sx={{ p:2, borderBottom:`1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Notificacoes do Dia</Typography>
          <Typography variant="caption" color="text.secondary">Contextualizadas pelo AG-04 com causa-raiz identificada</Typography>
        </Box>
        {notifications.map((notif) => {
          const sc = STATUS_CONFIG[notif.status];
          const isSuppressed = notif.status === "suppressed";
          return (
            <Box key={notif.id} sx={{
              borderBottom:`1px solid ${theme.palette.divider}`, p:2,
              opacity: isSuppressed ? 0.6 : 1,
              bgcolor: notif.priority === "urgent" && !isSuppressed ?
                (isLight ? "rgba(227,24,55,0.02)" : "rgba(227,24,55,0.04)") : "transparent"
            }}>
              <Box sx={{ display:"flex", alignItems:"flex-start", gap:1, mb:0.75 }}>
                <Box sx={{ flex:1 }}>
                  <Box sx={{ display:"flex", alignItems:"center", gap:0.75, flexWrap:"wrap", mb:0.25 }}>
                    <Typography variant="subtitle2" fontWeight={700}>{notif.title}</Typography>
                    <Chip label={notif.priority.toUpperCase()} size="small"
                      color={notif.priority === "urgent" ? "error" : notif.priority === "high" ? "warning" : notif.priority === "normal" ? "info" : "default"} />
                    <Chip label={sc.label} color={sc.color} size="small" variant="outlined" />
                    {notif.status === "sent" && <Chip icon={<SendIcon sx={{ fontSize:"10px !important" }} />} label="Enviado" size="small" color="success" variant="outlined" sx={{ height:20, fontSize:"0.62rem" }} />}
                    {notif.status === "suppressed" && <Chip icon={<BlockIcon sx={{ fontSize:"10px !important" }} />} label="Ruido eliminado" size="small" sx={{ height:20, fontSize:"0.62rem" }} />}
                    {notif.status === "pending" && <Chip icon={<ScheduleIcon sx={{ fontSize:"10px !important" }} />} label="Agendada" size="small" color="warning" sx={{ height:20, fontSize:"0.62rem" }} />}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb:0.5 }}>{notif.message}</Typography>
                  <Box sx={{ p:1, borderRadius:1, bgcolor: isLight ? "rgba(0,47,108,0.04)" : "rgba(255,255,255,0.04)", mb:0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Contexto IA: </strong>{notif.aiContextSummary}
                    </Typography>
                  </Box>
                  <Box sx={{ display:"flex", gap:1, flexWrap:"wrap" }}>
                    <Box sx={{ display:"flex", gap:0.5 }}>
                      {notif.channels.map(ch => (
                        <Box key={ch} sx={{ display:"flex", alignItems:"center", gap:0.25, color:theme.palette.text.secondary }}>
                          {CHANNEL_ICONS[ch]}
                        </Box>
                      ))}
                    </Box>
                    {notif.assignedTo && (
                      <Chip label={`Atribuido: ${notif.assignedTo}`} size="small" variant="outlined" sx={{ height:18, fontSize:"0.62rem" }} />
                    )}
                    {notif.ticketId && (
                      <Chip label={notif.ticketId} size="small" icon={<BugReportIcon sx={{ fontSize:"10px !important" }} />}
                        sx={{ height:18, fontSize:"0.62rem", bgcolor: isLight ? "rgba(0,47,108,0.06)" : "rgba(255,255,255,0.06)" }} />
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Paper>

      {/* Routing rules */}
      <Paper sx={{ borderRadius:2, overflow:"hidden" }}>
        <Box sx={{ p:2, borderBottom:`1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Regras de Roteamento</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="caption" fontWeight={600}>Condicao</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Audiencia</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Canais</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Descricao</Typography></TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>Status</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {routingRules.map((rule) => (
                <TableRow key={rule.id} hover>
                  <TableCell><Typography variant="caption" sx={{ fontFamily:"monospace", fontSize:"0.68rem" }}>{rule.condition}</Typography></TableCell>
                  <TableCell><Chip label={rule.audience.replace("_"," ")} size="small" variant="outlined" /></TableCell>
                  <TableCell>
                    <Box sx={{ display:"flex", gap:0.5 }}>
                      {rule.channels.length > 0 ? rule.channels.map(ch => (
                        <Box key={ch} sx={{ color:theme.palette.text.secondary }}>{CHANNEL_ICONS[ch]}</Box>
                      )) : <Chip label="nenhum (suprimido)" size="small" sx={{ height:18, fontSize:"0.6rem" }} />}
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{rule.description}</Typography></TableCell>
                  <TableCell>
                    {rule.active
                      ? <Chip icon={<CheckCircleIcon sx={{ fontSize:"12px !important" }} />} label="Ativa" size="small" color="success" variant="outlined" />
                      : <Chip icon={<ErrorOutlineIcon sx={{ fontSize:"12px !important" }} />} label="Inativa" size="small" />}
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
