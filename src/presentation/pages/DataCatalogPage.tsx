import { useEffect, useState } from "react";
import {
  Box, Grid, Card, CardContent, Typography, TextField, Chip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  InputAdornment, FormControl, InputLabel, Select, MenuItem, Button,
  Collapse, useTheme, Stack, Alert,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import SearchIcon from "@mui/icons-material/Search";
import StorageIcon from "@mui/icons-material/Storage";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { fetchSources, fetchAssets, searchCatalog, setSearchQuery } from "../../app/slices/dataCatalogSlice";
import type { DataSource, DataLayer, DataSourceType } from "../../domain/entities";
import KpiCard from "../components/KpiCard";
import PageSkeleton from "../components/PageSkeleton";

const SOURCE_TYPE_COLORS: Record<DataSourceType, string> = {
  POSTGRESQL: "#336791", BIGQUERY: "#4285F4", GCS: "#FBBC04", ORACLE: "#F80000",
  MYSQL: "#00758F", KAFKA: "#231F20", REST_API: "#10B981",
};

const LAYER_LABELS: Record<DataLayer, string> = { INGESTION: "Ingestão", TRUSTED: "Trusted", ANALYTICS: "Analytics" };

function QualityBar({ score }: { score: number }) {
  const color = score >= 90 ? "success" : score >= 75 ? "warning" : "error";
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 120 }}>
      <LinearProgress variant="determinate" value={score} color={color} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
      <Typography variant="caption" fontWeight={600}>{score}%</Typography>
    </Box>
  );
}

function SourceCard({ source, expanded, onToggle }: { source: DataSource; expanded: boolean; onToggle: () => void }) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { assets, assetsLoading } = useAppSelector((s) => s.dataCatalog);

  useEffect(() => {
    if (expanded) dispatch(fetchAssets(source.id));
  }, [expanded, source.id, dispatch]);

  return (
    <Card sx={{ border: source.hasAlerts ? `1px solid ${theme.palette.warning.main}` : undefined }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: SOURCE_TYPE_COLORS[source.type] + "18",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <StorageIcon sx={{ color: SOURCE_TYPE_COLORS[source.type], fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>{source.name}</Typography>
              <Typography variant="caption" color="text.secondary">{source.description}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            {source.hasAlerts && <WarningAmberIcon color="warning" fontSize="small" />}
            <Chip label={source.type} size="small" sx={{ bgcolor: SOURCE_TYPE_COLORS[source.type] + "20", color: SOURCE_TYPE_COLORS[source.type], fontWeight: 600, fontSize: "0.65rem" }} />
            <Chip label={LAYER_LABELS[source.layer]} size="small" variant="outlined" />
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 1.5 }}>
          <Grid item xs={3}>
            <Typography variant="caption" color="text.secondary">Owner</Typography>
            <Typography variant="body2" fontWeight={600}>{source.owner}</Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="caption" color="text.secondary">Tabelas</Typography>
            <Typography variant="body2" fontWeight={600}>{source.tablesCount || "—"}</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="caption" color="text.secondary">Registros</Typography>
            <Typography variant="body2" fontWeight={600}>{(source.recordsTotal / 1e6).toFixed(1)}M</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">Qualidade</Typography>
            <QualityBar score={source.qualityScore} />
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1 }}>
          {source.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: "0.62rem", height: 20 }} />
          ))}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary">
            Último sync: {new Date(source.lastSync).toLocaleString("pt-BR")}
          </Typography>
          <Button size="small" onClick={onToggle} endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}>
            {expanded ? "Fechar" : "Ver Assets"}
          </Button>
        </Box>
      </CardContent>

      <Collapse in={expanded}>
        <Box sx={{ px: 2.5, pb: 2 }}>
          {assetsLoading ? (
            <LinearProgress sx={{ my: 2 }} />
          ) : assets.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Nenhum asset catalogado para esta fonte.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant="caption" fontWeight={600}>Asset</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={600}>Tipo</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={600}>Schema</Typography></TableCell>
                    <TableCell align="right"><Typography variant="caption" fontWeight={600}>Colunas</Typography></TableCell>
                    <TableCell align="right"><Typography variant="caption" fontWeight={600}>Registros</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={600}>Qualidade</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={600}>PII</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={600}>Testes</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{asset.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{asset.description}</Typography>
                      </TableCell>
                      <TableCell><Chip label={asset.type} size="small" variant="outlined" sx={{ fontSize: "0.6rem" }} /></TableCell>
                      <TableCell><Typography variant="caption">{asset.schema}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2">{asset.columns}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2">{(asset.rows / 1e6).toFixed(2)}M</Typography></TableCell>
                      <TableCell><QualityBar score={asset.qualityScore} /></TableCell>
                      <TableCell>
                        {asset.piiFields.length > 0 ? (
                          <Box sx={{ display: "flex", gap: 0.3, flexWrap: "wrap" }}>
                            {asset.piiFields.map((f) => (
                              <Chip key={f} label={f} size="small" color="warning" variant="outlined" sx={{ fontSize: "0.55rem", height: 18 }} />
                            ))}
                          </Box>
                        ) : <Typography variant="caption" color="text.secondary">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Chip label={asset.hasTests ? "Sim" : "Não"} size="small" color={asset.hasTests ? "success" : "default"} variant="outlined" sx={{ fontSize: "0.6rem" }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Collapse>
    </Card>
  );
}

export default function DataCatalogPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { sources, loading, searchQuery } = useAppSelector((s) => s.dataCatalog);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [layerFilter, setLayerFilter] = useState<string>("ALL");

  useEffect(() => { dispatch(fetchSources()); }, [dispatch]);

  const handleSearch = (value: string) => {
    dispatch(setSearchQuery(value));
    if (value.trim().length > 0) dispatch(searchCatalog(value));
    else dispatch(fetchSources());
  };

  const filtered = sources.filter((s) => {
    if (typeFilter !== "ALL" && s.type !== typeFilter) return false;
    if (layerFilter !== "ALL" && s.layer !== layerFilter) return false;
    return true;
  });

  const totalRecords = sources.reduce((a, s) => a + s.recordsTotal, 0);
  const avgQuality = sources.length > 0 ? Math.round(sources.reduce((a, s) => a + s.qualityScore, 0) / sources.length) : 0;
  const withAlerts = sources.filter((s) => s.hasAlerts).length;

  if (loading && sources.length === 0) return <PageSkeleton cards={4} rows={5} />;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <LibraryBooksIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Catálogo de Dados</Typography>
          <Typography variant="body2" color="text.secondary">Descubra, explore e avalie fontes de dados de toda a plataforma</Typography>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Fontes Catalogadas" value={sources.length} trend="STABLE" trendValue={`${sources.length} conectadas`} severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Total Registros" value={`${(totalRecords / 1e6).toFixed(0)}M`} trend="UP" trendValue="crescendo" severity="HEALTHY" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Qualidade Média" value={`${avgQuality}%`} trend={avgQuality >= 85 ? "UP" : "DOWN"} trendValue="todas as fontes" severity={avgQuality >= 85 ? "HEALTHY" : "MEDIUM"} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KpiCard label="Com Alertas" value={withAlerts} trend={withAlerts > 0 ? "DOWN" : "STABLE"} trendValue={`${withAlerts} fonte(s)`} severity={withAlerts > 0 ? "HIGH" : "HEALTHY"} />
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
            <TextField
              fullWidth size="small" placeholder="Buscar por nome, tag ou descrição..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Tipo</InputLabel>
              <Select value={typeFilter} label="Tipo" onChange={(e: SelectChangeEvent) => setTypeFilter(e.target.value)}>
                <MenuItem value="ALL">Todos</MenuItem>
                <MenuItem value="POSTGRESQL">PostgreSQL</MenuItem>
                <MenuItem value="BIGQUERY">BigQuery</MenuItem>
                <MenuItem value="GCS">GCS</MenuItem>
                <MenuItem value="ORACLE">Oracle</MenuItem>
                <MenuItem value="MYSQL">MySQL</MenuItem>
                <MenuItem value="KAFKA">Kafka</MenuItem>
                <MenuItem value="REST_API">REST API</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Camada</InputLabel>
              <Select value={layerFilter} label="Camada" onChange={(e: SelectChangeEvent) => setLayerFilter(e.target.value)}>
                <MenuItem value="ALL">Todas</MenuItem>
                <MenuItem value="INGESTION">Ingestão</MenuItem>
                <MenuItem value="TRUSTED">Trusted</MenuItem>
                <MenuItem value="ANALYTICS">Analytics</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Alert severity="info">Nenhuma fonte encontrada para os filtros aplicados.</Alert>
      ) : (
        <Stack spacing={2}>
          {filtered.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              expanded={expandedId === source.id}
              onToggle={() => setExpandedId(expandedId === source.id ? null : source.id)}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
