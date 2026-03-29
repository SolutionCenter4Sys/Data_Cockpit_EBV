import { useEffect, useState } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button, useTheme, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, IconButton, CircularProgress,
  LinearProgress, Switch, FormControlLabel,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import CableIcon from "@mui/icons-material/Cable";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import SyncIcon from "@mui/icons-material/Sync";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchConnectors, fetchCredentials, testConnector, createConnector, deleteConnector } from "../../app/slices/connectorsSlice";
import type { Connector, ConnectorType, ConnectorStatus, DataLayer } from "../../domain/entities";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const STATUS_CONFIG: Record<ConnectorStatus, { color: "success" | "error" | "warning" | "info"; icon: React.ReactElement; label: string }> = {
  CONNECTED: { color: "success", icon: <CheckCircleIcon fontSize="small" />, label: "Conectado" },
  DISCONNECTED: { color: "warning", icon: <RemoveCircleIcon fontSize="small" />, label: "Desconectado" },
  ERROR: { color: "error", icon: <ErrorIcon fontSize="small" />, label: "Erro" },
  TESTING: { color: "info", icon: <SyncIcon fontSize="small" />, label: "Testando..." },
};

const TYPE_ICONS: Record<string, string> = {
  POSTGRESQL: "PG", MYSQL: "My", ORACLE: "Or", SQLSERVER: "MS", BIGQUERY: "BQ", GCS: "GC", KAFKA: "Kf", REST_API: "API", SDK: "SDK",
};

function ConnectorCard({ connector, onTest, onDelete, testing, credential }: {
  connector: Connector; onTest: () => void; onDelete: () => void; testing: boolean;
  credential?: { name: string; status: string; type: string; lastRotated: string; expiresAt: string | null };
}) {
  const theme = useTheme();
  const cfg = STATUS_CONFIG[connector.status];
  const poolPercent = connector.poolSize > 0 ? Math.round((connector.activeConnections / connector.poolSize) * 100) : 0;

  return (
    <Card sx={{ border: `1px solid ${connector.status === "ERROR" ? theme.palette.error.main : connector.status === "DISCONNECTED" ? theme.palette.warning.main : theme.palette.divider}` }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: theme.palette.action.hover, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography variant="caption" fontWeight={900} sx={{ fontSize: "0.7rem" }}>{TYPE_ICONS[connector.type] ?? "?"}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>{connector.name}</Typography>
              <Typography variant="caption" color="text.secondary">{connector.host}:{connector.port}</Typography>
            </Box>
          </Box>
          <Chip icon={cfg.icon} label={cfg.label} size="small" color={cfg.color} sx={{ fontWeight: 700 }} />
        </Box>

        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">Database</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.78rem" }}>{connector.database}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">Latência</Typography>
            <Typography variant="body2" fontWeight={600} color={connector.latencyMs > 500 ? "error.main" : connector.latencyMs > 100 ? "warning.main" : "success.main"}>
              {connector.latencyMs > 0 ? `${connector.latencyMs}ms` : "—"}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">Camada</Typography>
            <Chip label={connector.layer} size="small" variant="outlined" sx={{ fontSize: "0.6rem" }} />
          </Grid>
        </Grid>

        {connector.poolSize > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.3 }}>
              <Typography variant="caption" color="text.secondary">Pool de Conexões</Typography>
              <Typography variant="caption" fontWeight={600}>{connector.activeConnections}/{connector.poolSize}</Typography>
            </Box>
            <LinearProgress variant="determinate" value={poolPercent} color={poolPercent > 80 ? "error" : poolPercent > 50 ? "warning" : "primary"} sx={{ height: 5, borderRadius: 3 }} />
          </Box>
        )}

        {credential && (
          <Box sx={{ p: 1, borderRadius: 1, bgcolor: theme.palette.action.hover, mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.3 }}>
              <VpnKeyIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption" fontWeight={600}>{credential.name}</Typography>
              <Chip label={credential.status} size="small" color={credential.status === "VALID" ? "success" : credential.status === "EXPIRED" ? "warning" : "error"} sx={{ fontSize: "0.55rem", height: 18, ml: "auto" }} />
            </Box>
            <Typography variant="caption" color="text.secondary">{credential.type} · Rotação: {new Date(credential.lastRotated).toLocaleDateString("pt-BR")}</Typography>
            {credential.expiresAt && (
              <Typography variant="caption" color={new Date(credential.expiresAt) < new Date() ? "error.main" : "text.secondary"} display="block">
                Expira: {new Date(credential.expiresAt).toLocaleDateString("pt-BR")}
              </Typography>
            )}
          </Box>
        )}

        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={testing ? <CircularProgress size={14} /> : <PlayArrowIcon />}
            onClick={onTest} disabled={testing} fullWidth>
            Testar
          </Button>
          <IconButton size="small" color="error" onClick={onDelete}><DeleteOutlineIcon fontSize="small" /></IconButton>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>
          {connector.autoReconnect ? "Auto-reconnect ativo" : "Auto-reconnect desativado"} · {connector.lastHealthCheck ? `Último check: ${new Date(connector.lastHealthCheck).toLocaleTimeString("pt-BR")}` : "Sem health check"}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function ConnectorsPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { connectors, credentials, testingId, loading } = useAppSelector((s) => s.connectors);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "POSTGRESQL" as ConnectorType, host: "", port: 5432, database: "", poolSize: 10, credentialId: "", autoReconnect: true, layer: "INGESTION" as DataLayer });

  useEffect(() => {
    dispatch(fetchConnectors());
    dispatch(fetchCredentials());
  }, [dispatch]);

  const handleCreate = () => {
    dispatch(createConnector(form));
    setDialogOpen(false);
    setForm({ name: "", type: "POSTGRESQL", host: "", port: 5432, database: "", poolSize: 10, credentialId: "", autoReconnect: true, layer: "INGESTION" });
  };

  const connected = connectors.filter((c) => c.status === "CONNECTED").length;
  const errors = connectors.filter((c) => c.status === "ERROR").length;
  const avgLatency = connectors.filter((c) => c.latencyMs > 0).length > 0
    ? Math.round(connectors.filter((c) => c.latencyMs > 0).reduce((a, c) => a + c.latencyMs, 0) / connectors.filter((c) => c.latencyMs > 0).length)
    : 0;
  const expiredCreds = credentials.filter((c) => c.status !== "VALID").length;

  if (loading && connectors.length === 0) return <PageSkeleton cards={4} rows={4} />;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <CableIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>Conectores & Credenciais</Typography>
          <Typography variant="body2" color="text.secondary">Gestão de conexões, pool, health check e credential vault</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => setDialogOpen(true)}>Novo Conector</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Total Conectores" value={connectors.length} trend="STABLE" trendValue="registrados" severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Conectados" value={connected} trend="STABLE" trendValue={`${connectors.length - connected} offline`} severity={connected === connectors.length ? "HEALTHY" : "MEDIUM"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Latência Média" value={`${avgLatency}ms`} trend={avgLatency > 200 ? "DOWN" : "STABLE"} trendValue="health check" severity={avgLatency > 200 ? "HIGH" : "HEALTHY"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Credenciais Expiradas" value={expiredCreds} trend={expiredCreds > 0 ? "DOWN" : "STABLE"} trendValue={`${credentials.length} total`} severity={expiredCreds > 0 ? "CRITICAL" : "HEALTHY"} />
        </Grid>
      </Grid>

      {errors > 0 && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: theme.palette.error.main + "10", border: `1px solid ${theme.palette.error.main}30` }}>
          <Typography variant="body2" color="error.main" fontWeight={600}>
            {errors} conector(es) com erro — verifique credenciais e conectividade de rede
          </Typography>
        </Box>
      )}

      <Grid container spacing={2}>
        {connectors.map((cn) => {
          const cred = credentials.find((c) => c.connectorId === cn.id);
          return (
            <Grid item xs={12} sm={6} md={4} key={cn.id}>
              <ConnectorCard
                connector={cn}
                testing={testingId === cn.id}
                onTest={() => dispatch(testConnector(cn.id))}
                onDelete={() => dispatch(deleteConnector(cn.id))}
                credential={cred ? { name: cred.name, status: cred.status, type: cred.type, lastRotated: cred.lastRotated, expiresAt: cred.expiresAt } : undefined}
              />
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Conector</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nome" fullWidth size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select value={form.type} label="Tipo" onChange={(e: SelectChangeEvent) => setForm({ ...form, type: e.target.value as ConnectorType })}>
                    {["POSTGRESQL","MYSQL","ORACLE","SQLSERVER","BIGQUERY","GCS","KAFKA","REST_API","SDK"].map((t) => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Camada</InputLabel>
                  <Select value={form.layer} label="Camada" onChange={(e: SelectChangeEvent) => setForm({ ...form, layer: e.target.value as DataLayer })}>
                    <MenuItem value="INGESTION">Ingestão</MenuItem>
                    <MenuItem value="TRUSTED">Trusted</MenuItem>
                    <MenuItem value="ANALYTICS">Analytics</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={8}>
                <TextField label="Host" fullWidth size="small" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="db.example.com" />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Porta" fullWidth size="small" type="number" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} />
              </Grid>
            </Grid>
            <TextField label="Database" fullWidth size="small" value={form.database} onChange={(e) => setForm({ ...form, database: e.target.value })} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Pool Size" fullWidth size="small" type="number" value={form.poolSize} onChange={(e) => setForm({ ...form, poolSize: Number(e.target.value) })} />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel control={<Switch checked={form.autoReconnect} onChange={(e) => setForm({ ...form, autoReconnect: e.target.checked })} />} label="Auto-reconnect" />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name || !form.host}>Criar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
