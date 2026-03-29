import { useEffect, useState, useRef } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, useTheme, Button, Stack,
  FormControl, InputLabel, Select, MenuItem,
  Drawer, Divider, IconButton, Table, TableBody, TableCell, TableRow,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import BoltIcon from "@mui/icons-material/Bolt";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchEvents, fetchEventStats, addNewEvent } from "../../app/slices/eventHubSlice";
import type { DataEvent, EventType } from "../../domain/entities";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  INGESTION: "Ingestão", TRANSFORMATION: "Transformação", VALIDATION: "Validação",
  ALERT: "Alerta", QUALITY_CHECK: "Quality Check", SCHEMA_CHANGE: "Schema Change",
};

const STATUS_COLOR: Record<string, "success" | "error" | "warning" | "info" | "default"> = {
  SUCCESS: "success", FAILED: "error", WARNING: "warning", RUNNING: "info", PENDING: "default",
};

function EventRow({ event, onClick }: { event: DataEvent; onClick: () => void }) {
  const theme = useTheme();
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1.5, borderRadius: 1.5, cursor: "pointer",
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: event.status === "FAILED" ? (theme.palette.mode === "light" ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.06)") : "transparent",
        "&:hover": { bgcolor: theme.palette.action.hover },
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}
    >
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flex: 1 }}>
        <Chip label={event.status} size="small" color={STATUS_COLOR[event.status] ?? "default"} sx={{ width: 72, fontSize: "0.6rem", fontWeight: 700 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={600}>{EVENT_TYPE_LABELS[event.type]}</Typography>
          <Typography variant="caption" color="text.secondary">{event.source}</Typography>
        </Box>
        <Chip label={event.layer} size="small" variant="outlined" sx={{ fontSize: "0.6rem" }} />
        {!event.schemaValid && <Chip label="SCHEMA!" size="small" color="error" variant="outlined" sx={{ fontSize: "0.55rem", fontWeight: 700 }} />}
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 50, textAlign: "right" }}>
          {event.processingTimeMs}ms
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ ml: 1.5, minWidth: 65, textAlign: "right" }}>
        {new Date(event.timestamp).toLocaleTimeString("pt-BR")}
      </Typography>
    </Box>
  );
}

export default function EventHubPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { events, stats, loading } = useAppSelector((s) => s.eventHub);
  const [live, setLive] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [layerFilter, setLayerFilter] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<DataEvent | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    dispatch(fetchEvents());
    dispatch(fetchEventStats());
  }, [dispatch]);

  useEffect(() => {
    if (live) {
      intervalRef.current = setInterval(() => dispatch(addNewEvent()), 3000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [live, dispatch]);

  const filtered = events.filter((e) => {
    if (typeFilter !== "ALL" && e.type !== typeFilter) return false;
    if (layerFilter !== "ALL" && e.layer !== layerFilter) return false;
    return true;
  });

  const volumeData = (() => {
    const buckets: Record<string, number> = {};
    events.forEach((e) => {
      const min = new Date(e.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      buckets[min] = (buckets[min] ?? 0) + 1;
    });
    return Object.entries(buckets).map(([time, count]) => ({ time, count })).slice(-15);
  })();

  if (loading && events.length === 0) return <PageSkeleton cards={4} rows={8} />;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <BoltIcon sx={{ color: theme.palette.warning.main, fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>Hub de Eventos</Typography>
          <Typography variant="body2" color="text.secondary">Monitoramento de eventos em tempo real com validação de schema</Typography>
        </Box>
        <Button
          variant={live ? "contained" : "outlined"}
          color={live ? "success" : "inherit"}
          size="small"
          startIcon={live ? <PauseIcon /> : <PlayArrowIcon />}
          onClick={() => setLive(!live)}
        >
          {live ? "Live" : "Pausado"}
        </Button>
      </Box>

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={2.4}>
            <KpiCard label="Eventos Hoje" value={stats.totalToday.toLocaleString()} trend="UP" trendValue="acumulado" severity="HEALTHY" />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <KpiCard label="Eventos/min" value={stats.eventsPerMinute} trend="STABLE" trendValue="média" severity="HEALTHY" />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <KpiCard label="Falhas" value={stats.failedEvents} trend={stats.failedEvents > 100 ? "DOWN" : "STABLE"} trendValue="hoje" severity={stats.failedEvents > 100 ? "HIGH" : "HEALTHY"} />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <KpiCard label="Violações Schema" value={stats.schemaViolations} trend={stats.schemaViolations > 10 ? "DOWN" : "STABLE"} trendValue="hoje" severity={stats.schemaViolations > 10 ? "CRITICAL" : "HEALTHY"} />
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <KpiCard label="Latência Média" value={`${stats.avgProcessingMs}ms`} trend="STABLE" trendValue="processamento" severity={stats.avgProcessingMs > 300 ? "MEDIUM" : "HEALTHY"} />
          </Grid>
        </Grid>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: 280 }}>
            <CardContent sx={{ p: 2, height: "100%" }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Volume por Minuto</Typography>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                  <YAxis tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="count" stroke={theme.palette.primary.main} fill={theme.palette.primary.main + "30"} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>Feed de Eventos</Typography>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select value={typeFilter} label="Tipo" onChange={(e: SelectChangeEvent) => setTypeFilter(e.target.value)}>
                    <MenuItem value="ALL">Todos</MenuItem>
                    {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Camada</InputLabel>
                  <Select value={layerFilter} label="Camada" onChange={(e: SelectChangeEvent) => setLayerFilter(e.target.value)}>
                    <MenuItem value="ALL">Todas</MenuItem>
                    <MenuItem value="INGESTION">Ingestão</MenuItem>
                    <MenuItem value="TRUSTED">Trusted</MenuItem>
                    <MenuItem value="ANALYTICS">Analytics</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Stack spacing={0.75} sx={{ maxHeight: 400, overflowY: "auto" }}>
                {filtered.slice(0, 30).map((ev) => (
                  <EventRow key={ev.id} event={ev} onClick={() => setSelectedEvent(ev)} />
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>
                Exibindo {Math.min(filtered.length, 30)} de {filtered.length} eventos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Drawer anchor="right" open={!!selectedEvent} onClose={() => setSelectedEvent(null)}
        PaperProps={{ sx: { width: 420, p: 3 } }}>
        {selectedEvent && (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>Detalhe do Evento</Typography>
              <IconButton onClick={() => setSelectedEvent(null)}><CloseIcon /></IconButton>
            </Box>
            <Table size="small">
              <TableBody>
                <TableRow><TableCell><strong>ID</strong></TableCell><TableCell>{selectedEvent.id}</TableCell></TableRow>
                <TableRow><TableCell><strong>Tipo</strong></TableCell><TableCell>{EVENT_TYPE_LABELS[selectedEvent.type]}</TableCell></TableRow>
                <TableRow><TableCell><strong>Fonte</strong></TableCell><TableCell>{selectedEvent.source}</TableCell></TableRow>
                <TableRow><TableCell><strong>Camada</strong></TableCell><TableCell>{selectedEvent.layer}</TableCell></TableRow>
                <TableRow><TableCell><strong>Status</strong></TableCell><TableCell><Chip label={selectedEvent.status} size="small" color={STATUS_COLOR[selectedEvent.status]} /></TableCell></TableRow>
                <TableRow><TableCell><strong>Schema Válido</strong></TableCell><TableCell><Chip label={selectedEvent.schemaValid ? "Sim" : "Não"} size="small" color={selectedEvent.schemaValid ? "success" : "error"} /></TableCell></TableRow>
                <TableRow><TableCell><strong>Processamento</strong></TableCell><TableCell>{selectedEvent.processingTimeMs}ms</TableCell></TableRow>
                <TableRow><TableCell><strong>Timestamp</strong></TableCell><TableCell>{new Date(selectedEvent.timestamp).toLocaleString("pt-BR")}</TableCell></TableRow>
              </TableBody>
            </Table>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Payload</Typography>
            <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: theme.palette.action.hover, fontFamily: "monospace", fontSize: "0.75rem", whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto" }}>
              {JSON.stringify(selectedEvent.payload, null, 2)}
            </Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2, mb: 1 }}>Metadata</Typography>
            <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: theme.palette.action.hover, fontFamily: "monospace", fontSize: "0.75rem", whiteSpace: "pre-wrap" }}>
              {JSON.stringify(selectedEvent.metadata, null, 2)}
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
