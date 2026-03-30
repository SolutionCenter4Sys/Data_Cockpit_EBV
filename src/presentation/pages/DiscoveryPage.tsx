import { useEffect, useCallback, useState, useMemo, type ReactElement } from "react";
import {
  Box, Card, CardContent, Typography, TextField, InputAdornment,
  Chip, Stack, useTheme, Divider, Avatar, IconButton,
  Collapse, List, ListItemButton, ListItemIcon, ListItemText,
  Select, MenuItem, FormControl, InputLabel, Tooltip,
  LinearProgress, type SelectChangeEvent,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TableChartIcon from "@mui/icons-material/TableChart";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import RuleIcon from "@mui/icons-material/Rule";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CableIcon from "@mui/icons-material/Cable";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import StorageIcon from "@mui/icons-material/Storage";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import CloseIcon from "@mui/icons-material/Close";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import VerifiedIcon from "@mui/icons-material/Verified";
import DraftsIcon from "@mui/icons-material/Drafts";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import SortIcon from "@mui/icons-material/Sort";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useAppDispatch, useAppSelector } from "../../app/store";
import {
  searchArtifacts, setDiscoverySearch, selectAsset,
  setSortMode, setSortDirection,
  setDiscoveryFilter, clearDiscoveryFilters,
  TREE_CATEGORIES,
  type SortMode,
} from "../../app/slices/discoverySlice";
import type { DiscoveryResult, TreeCategory, TreeNode, AssetHealth } from "../../domain/entities";
import PageSkeleton from "../components/PageSkeleton";

type ArtifactType = DiscoveryResult["type"];

const TYPE_ICON: Record<ArtifactType, ReactElement> = {
  TABLE: <TableChartIcon fontSize="small" />,
  COLUMN: <ViewColumnIcon fontSize="small" />,
  QUALITY_RULE: <RuleIcon fontSize="small" />,
  ALERT: <NotificationsActiveIcon fontSize="small" />,
  CONNECTOR: <CableIcon fontSize="small" />,
  PIPELINE: <AccountTreeIcon fontSize="small" />,
};

const TYPE_COLOR: Record<ArtifactType, "primary" | "secondary" | "error" | "warning" | "info" | "success"> = {
  TABLE: "primary",
  COLUMN: "info",
  QUALITY_RULE: "warning",
  ALERT: "error",
  CONNECTOR: "secondary",
  PIPELINE: "success",
};

const TYPE_LABEL: Record<ArtifactType, string> = {
  TABLE: "Tabela", COLUMN: "Coluna", QUALITY_RULE: "Regra", ALERT: "Alerta",
  CONNECTOR: "Conector", PIPELINE: "Pipeline",
};

const HEALTH_COLOR: Record<AssetHealth, string> = {
  healthy: "#4caf50", warning: "#ff9800", error: "#f44336",
};

const TREE_ICON_MAP: Record<string, ReactElement> = {
  storage: <StorageIcon fontSize="small" />,
  account_tree: <AccountTreeIcon fontSize="small" />,
  cable: <CableIcon fontSize="small" />,
  fact_check: <FactCheckIcon fontSize="small" />,
  notifications: <NotificationsActiveIcon fontSize="small" />,
};

const LEFT_WIDTH = 250;
const RIGHT_WIDTH = 340;

type TreeFilterSpec = { service?: string; type?: ArtifactType; pathContains?: string };

const TREE_NODE_FILTER_MAP: Record<string, TreeFilterSpec> = {
  snowflake: { service: "Snowflake" },
  "sf-analytics": { service: "Snowflake", pathContains: "ANALYTICS_DB" },
  "sf-mart": { service: "Snowflake", pathContains: "ANALYTICS_MART5" },
  postgresql: { service: "PostgreSQL" },
  "pg-enterprise": { service: "PostgreSQL", pathContains: "enterprise_dw" },
  "pg-catalog": { service: "PostgreSQL", pathContains: "catalog" },
  oracle: { service: "Oracle" },
  "or-legacy": { service: "Oracle", pathContains: "EBV_PROD" },
  athena: { service: "Athena" },
  "at-raw": { service: "Athena", pathContains: "raw" },
  airflow: { service: "Airflow" },
  "conn-pg": { type: "CONNECTOR", service: "PostgreSQL" },
  "conn-bq": { type: "CONNECTOR", service: "BigQuery" },
  "q-rules": { type: "QUALITY_RULE" },
  "a-active": { type: "ALERT" },
};

function TreeNodeItem({ node, depth, onSelect, activeId }: {
  node: TreeNode; depth: number; onSelect: (id: string) => void; activeId: string;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const theme = useTheme();
  const isActive = activeId === node.id;
  return (
    <>
      <ListItemButton
        dense
        sx={{
          pl: 2 + depth * 1.5, py: 0.3, minHeight: 30,
          bgcolor: isActive ? theme.palette.action.selected : "transparent",
          borderRadius: 1,
        }}
        onClick={() => { if (hasChildren) setOpen(!open); onSelect(node.id); }}
      >
        {hasChildren ? (
          <ListItemIcon sx={{ minWidth: 22 }}>
            {open ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />}
          </ListItemIcon>
        ) : <Box sx={{ width: 22 }} />}
        <ListItemText
          primary={
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>{node.label}</Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontSize: "0.65rem" }}>
                ({node.count})
              </Typography>
            </Stack>
          }
        />
      </ListItemButton>
      {hasChildren && (
        <Collapse in={open} timeout="auto">
          {node.children!.map((child) => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1} onSelect={onSelect} activeId={activeId} />
          ))}
        </Collapse>
      )}
    </>
  );
}

function TreeCategoryItem({ cat, onSelect, activeId }: {
  cat: TreeCategory; onSelect: (id: string) => void; activeId: string;
}) {
  const [open, setOpen] = useState(true);
  const theme = useTheme();
  const totalCount = cat.children.reduce((s, c) => s + c.count, 0);
  return (
    <Box sx={{ mb: 0.5 }}>
      <ListItemButton dense sx={{ py: 0.4 }} onClick={() => setOpen(!open)}>
        <ListItemIcon sx={{ minWidth: 28, color: theme.palette.primary.main }}>
          {TREE_ICON_MAP[cat.icon] || <StorageIcon fontSize="small" />}
        </ListItemIcon>
        <ListItemText
          primary={
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.8rem" }}>{cat.label}</Typography>
              <Typography variant="caption" color="text.disabled">({totalCount})</Typography>
            </Stack>
          }
        />
        {open ? <ExpandMoreIcon sx={{ fontSize: 18 }} /> : <ChevronRightIcon sx={{ fontSize: 18 }} />}
      </ListItemButton>
      <Collapse in={open} timeout="auto">
        <List dense disablePadding>
          {cat.children.map((node) => (
            <TreeNodeItem key={node.id} node={node} depth={0} onSelect={onSelect} activeId={activeId} />
          ))}
        </List>
      </Collapse>
    </Box>
  );
}

function AssetCard({ item, isSelected, onSelect }: {
  item: DiscoveryResult; isSelected: boolean; onSelect: () => void;
}) {
  const theme = useTheme();
  return (
    <Card
      onClick={onSelect}
      sx={{
        mb: 1.5, cursor: "pointer", transition: "all 0.15s",
        border: isSelected ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
        "&:hover": { boxShadow: 3 },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem", display: "block", mb: 0.5 }}>
          {item.path}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.5 }}>
          <Chip icon={TYPE_ICON[item.type]} label={TYPE_LABEL[item.type]} size="small" color={TYPE_COLOR[item.type]} variant="outlined" sx={{ height: 22, "& .MuiChip-label": { fontSize: "0.68rem" } }} />
          <FiberManualRecordIcon sx={{ fontSize: 10, color: HEALTH_COLOR[item.healthStatus] }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>{item.name}</Typography>
          {item.certification === "certified" && (
            <Tooltip title="Certificado"><VerifiedIcon sx={{ fontSize: 16, color: theme.palette.success.main }} /></Tooltip>
          )}
          {item.certification === "draft" && (
            <Tooltip title="Rascunho"><DraftsIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} /></Tooltip>
          )}
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.78rem", mb: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {item.description}
        </Typography>

        <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: "wrap", gap: 0.5 }}>
          {item.tags.slice(0, 4).map((tag) => (
            <Chip key={tag} label={tag} size="small" sx={{ height: 20, fontSize: "0.62rem", bgcolor: theme.palette.action.hover }} />
          ))}
          {item.tags.length > 4 && (
            <Chip label={`+${item.tags.length - 4}`} size="small" sx={{ height: 20, fontSize: "0.62rem" }} />
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
            Bron: {item.source}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={-0.6}>
            {item.owners.slice(0, 3).map((o, i) => (
              <Tooltip key={i} title={o.name}>
                <Avatar sx={{ width: 22, height: 22, fontSize: "0.6rem", bgcolor: o.avatarColor, border: `2px solid ${theme.palette.background.paper}` }}>
                  {o.name.charAt(0)}
                </Avatar>
              </Tooltip>
            ))}
          </Stack>
          <Chip label={item.tier} size="small" variant="outlined"
            sx={{ height: 20, fontSize: "0.6rem", borderColor: item.tier === "Tier1" ? theme.palette.primary.main : item.tier === "Tier2" ? theme.palette.warning.main : theme.palette.text.disabled }}
          />
          {item.stats.queries > 0 && (
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem" }}>
              {item.stats.queries} queries
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function DetailPanel({ item, onClose }: { item: DiscoveryResult; onClose: () => void }) {
  const theme = useTheme();
  const sections: { label: string; value: string | number }[] = [
    { label: "Tipo", value: TYPE_LABEL[item.type] },
    { label: "Consultas", value: item.stats.queries },
    { label: "Colunas", value: item.stats.columns },
    { label: "Incidentes", value: item.stats.incidents },
    { label: "Total de Testes", value: item.stats.tests },
  ];
  if (item.stats.rows) sections.push({ label: "Registros", value: item.stats.rows.toLocaleString("pt-BR") });

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <FiberManualRecordIcon sx={{ fontSize: 12, color: HEALTH_COLOR[item.healthStatus] }} />
        <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>{item.name}</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </Stack>

      {item.certification === "certified" && (
        <Chip icon={<VerifiedIcon />} label="Certificado" color="success" size="small" variant="outlined" sx={{ mb: 1.5 }} />
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: "0.82rem" }}>
        {item.description}
      </Typography>

      <Divider sx={{ mb: 1.5 }} />
      <Typography variant="overline" color="text.disabled" sx={{ fontSize: "0.65rem" }}>Visão Geral</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mt: 1, mb: 2 }}>
        {sections.map((s) => (
          <Box key={s.label} sx={{ p: 1, borderRadius: 1, bgcolor: theme.palette.action.hover }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem", display: "block" }}>{s.label}</Typography>
            <Typography variant="body2" fontWeight={600}>{s.value}</Typography>
          </Box>
        ))}
      </Box>

      <Divider sx={{ mb: 1.5 }} />
      <Typography variant="overline" color="text.disabled" sx={{ fontSize: "0.65rem" }}>Linhagem</Typography>
      <Stack direction="row" spacing={2} sx={{ mt: 1, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <ArrowUpwardIcon sx={{ fontSize: 14, color: theme.palette.info.main }} />
          <Typography variant="body2">{item.lineage.upstreamCount} upstream</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <ArrowDownwardIcon sx={{ fontSize: 14, color: theme.palette.warning.main }} />
          <Typography variant="body2">{item.lineage.downstreamCount} downstream</Typography>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />
      <Typography variant="overline" color="text.disabled" sx={{ fontSize: "0.65rem" }}>Proprietários</Typography>
      <Stack spacing={1} sx={{ mt: 1, mb: 2 }}>
        {item.owners.map((o, i) => (
          <Stack key={i} direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ width: 26, height: 26, fontSize: "0.7rem", bgcolor: o.avatarColor }}>{o.name.charAt(0)}</Avatar>
            <Typography variant="body2">{o.name}</Typography>
          </Stack>
        ))}
      </Stack>

      <Divider sx={{ mb: 1.5 }} />
      <Typography variant="overline" color="text.disabled" sx={{ fontSize: "0.65rem" }}>Domínio</Typography>
      <Typography variant="body2" sx={{ mt: 0.5, mb: 2 }}>{item.domain}</Typography>

      <Divider sx={{ mb: 1.5 }} />
      <Typography variant="overline" color="text.disabled" sx={{ fontSize: "0.65rem" }}>Camada (Tier)</Typography>
      <Box sx={{ mt: 0.5, mb: 2 }}>
        <Chip label={item.tier} size="small" color={item.tier === "Tier1" ? "primary" : item.tier === "Tier2" ? "warning" : "default"} variant="outlined" />
      </Box>

      <Divider sx={{ mb: 1.5 }} />
      <Typography variant="overline" color="text.disabled" sx={{ fontSize: "0.65rem" }}>Serviço</Typography>
      <Typography variant="body2" sx={{ mt: 0.5, mb: 2 }}>{item.service}</Typography>

      {item.glossaryTerms.length > 0 && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="overline" color="text.disabled" sx={{ fontSize: "0.65rem" }}>Termos de Glossário</Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 1, mb: 2, flexWrap: "wrap", gap: 0.5 }}>
            {item.glossaryTerms.map((g) => (
              <Chip key={g} label={g} size="small" variant="outlined" sx={{ fontSize: "0.68rem" }} />
            ))}
          </Stack>
        </>
      )}

      {item.tags.length > 0 && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="overline" color="text.disabled" sx={{ fontSize: "0.65rem" }}>Tags</Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
            {item.tags.map((t) => (
              <Chip key={t} label={t} size="small" sx={{ fontSize: "0.68rem", bgcolor: theme.palette.action.hover }} />
            ))}
          </Stack>
        </>
      )}

      <Divider sx={{ my: 1.5 }} />
      <Typography variant="overline" color="text.disabled" sx={{ fontSize: "0.65rem" }}>Caminho</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", wordBreak: "break-all" }}>
        {item.path}
      </Typography>
    </Box>
  );
}

export default function DiscoveryPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { results, loading, searchTerm, selectedId, sortMode, sortDirection, filters } = useAppSelector((s) => s.discovery);

  const [activeTreeNode, setActiveTreeNode] = useState("");

  useEffect(() => { dispatch(searchArtifacts("")); }, [dispatch]);

  const handleSearch = useCallback(
    (term: string) => { dispatch(setDiscoverySearch(term)); dispatch(searchArtifacts(term)); },
    [dispatch],
  );

  const uniqueDomains = useMemo(() => [...new Set(results.map((r) => r.domain))], [results]);
  const uniqueOwners = useMemo(() => [...new Set(results.flatMap((r) => r.owners.map((o) => o.name)))], [results]);
  const uniqueTags = useMemo(() => [...new Set(results.flatMap((r) => r.tags))], [results]);
  const uniqueServices = useMemo(() => [...new Set(results.map((r) => r.service))], [results]);

  const filtered = useMemo(() => {
    let list = results;
    if (filters.domain) list = list.filter((r) => r.domain === filters.domain);
    if (filters.owner) list = list.filter((r) => r.owners.some((o) => o.name === filters.owner));
    if (filters.tier) list = list.filter((r) => r.tier === filters.tier);
    if (filters.tag) list = list.filter((r) => r.tags.includes(filters.tag));
    if (filters.certification) list = list.filter((r) => r.certification === filters.certification);
    if (filters.service) list = list.filter((r) => r.service === filters.service);
    if (filters.area) list = list.filter((r) => r.domain === filters.area);

    if (activeTreeNode) {
      const spec = TREE_NODE_FILTER_MAP[activeTreeNode];
      if (spec) {
        list = list.filter((r) => {
          if (spec.type && r.type !== spec.type) return false;
          if (spec.service && r.service !== spec.service) return false;
          if (spec.pathContains && !r.path.toLowerCase().includes(spec.pathContains.toLowerCase())) return false;
          return true;
        });
      }
    }

    const sorted = [...list];
    const dir = sortDirection === "asc" ? 1 : -1;
    if (sortMode === "relevance") sorted.sort((a, b) => (b.relevance - a.relevance) * dir);
    else if (sortMode === "popularity") sorted.sort((a, b) => (b.stats.queries - a.stats.queries) * dir);
    else sorted.sort((a, b) => a.name.localeCompare(b.name) * dir);
    return sorted;
  }, [results, filters, sortMode, sortDirection, activeTreeNode]);

  const selectedItem = useMemo(
    () => (selectedId ? results.find((r) => r.id === selectedId) ?? null : null),
    [results, selectedId],
  );

  const hasAnyFilter = Object.values(filters).some(Boolean);

  if (loading && results.length === 0) return <PageSkeleton cards={6} rows={8} />;

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 120px)", gap: 0 }}>
      {/* ── Left Panel: Tree Navigation ── */}
      <Box sx={{
        width: LEFT_WIDTH, minWidth: LEFT_WIDTH, height: "100%", overflowY: "auto",
        borderRight: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper,
        borderRadius: "8px 0 0 8px",
      }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>Ativos de Dados</Typography>
          <Typography variant="caption" color="text.disabled">
            {results.length} artefatos encontrados
          </Typography>
        </Box>
        <Divider />
        <List dense disablePadding sx={{ pt: 0.5 }}>
          {TREE_CATEGORIES.map((cat) => (
            <TreeCategoryItem key={cat.id} cat={cat} onSelect={setActiveTreeNode} activeId={activeTreeNode} />
          ))}
        </List>
      </Box>

      {/* ── Center Panel: Search + Filters + Cards ── */}
      <Box sx={{ flex: 1, height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {/* Search bar */}
        <Box sx={{ p: 2, pb: 1, bgcolor: theme.palette.background.paper }}>
          <TextField
            fullWidth variant="outlined" size="small"
            placeholder="Pesquisar por Ativos de Dados..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: theme.palette.primary.main }} /></InputAdornment>,
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.88rem" } }}
          />
        </Box>

        {/* Filters */}
        <Box sx={{ px: 2, pb: 1.5, bgcolor: theme.palette.background.paper }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", gap: 0.5 }}>
            <FilterListIcon sx={{ fontSize: 18, color: theme.palette.text.disabled }} />

            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel sx={{ fontSize: "0.75rem" }}>Domínio</InputLabel>
              <Select value={filters.domain} label="Domínio" sx={{ fontSize: "0.75rem", height: 32 }}
                onChange={(e: SelectChangeEvent) => dispatch(setDiscoveryFilter({ key: "domain", value: e.target.value }))}>
                <MenuItem value=""><em>Todos</em></MenuItem>
                {uniqueDomains.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel sx={{ fontSize: "0.75rem" }}>Proprietário</InputLabel>
              <Select value={filters.owner} label="Proprietário" sx={{ fontSize: "0.75rem", height: 32 }}
                onChange={(e: SelectChangeEvent) => dispatch(setDiscoveryFilter({ key: "owner", value: e.target.value }))}>
                <MenuItem value=""><em>Todos</em></MenuItem>
                {uniqueOwners.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 88 }}>
              <InputLabel sx={{ fontSize: "0.75rem" }}>Tag</InputLabel>
              <Select value={filters.tag} label="Tag" sx={{ fontSize: "0.75rem", height: 32 }}
                onChange={(e: SelectChangeEvent) => dispatch(setDiscoveryFilter({ key: "tag", value: e.target.value }))}>
                <MenuItem value=""><em>Todas</em></MenuItem>
                {uniqueTags.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 88 }}>
              <InputLabel sx={{ fontSize: "0.75rem" }}>Camada</InputLabel>
              <Select value={filters.tier} label="Camada" sx={{ fontSize: "0.75rem", height: 32 }}
                onChange={(e: SelectChangeEvent) => dispatch(setDiscoveryFilter({ key: "tier", value: e.target.value }))}>
                <MenuItem value=""><em>Todas</em></MenuItem>
                <MenuItem value="Tier1">Tier 1</MenuItem>
                <MenuItem value="Tier2">Tier 2</MenuItem>
                <MenuItem value="Tier3">Tier 3</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel sx={{ fontSize: "0.75rem" }}>Certificação</InputLabel>
              <Select value={filters.certification} label="Certificação" sx={{ fontSize: "0.75rem", height: 32 }}
                onChange={(e: SelectChangeEvent) => dispatch(setDiscoveryFilter({ key: "certification", value: e.target.value }))}>
                <MenuItem value=""><em>Todas</em></MenuItem>
                <MenuItem value="certified">Certificado</MenuItem>
                <MenuItem value="draft">Rascunho</MenuItem>
                <MenuItem value="none">Nenhuma</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel sx={{ fontSize: "0.75rem" }}>Serviço</InputLabel>
              <Select value={filters.service} label="Serviço" sx={{ fontSize: "0.75rem", height: 32 }}
                onChange={(e: SelectChangeEvent) => dispatch(setDiscoveryFilter({ key: "service", value: e.target.value }))}>
                <MenuItem value=""><em>Todos</em></MenuItem>
                {uniqueServices.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel sx={{ fontSize: "0.75rem" }}>Área</InputLabel>
              <Select value={filters.area} label="Área" sx={{ fontSize: "0.75rem", height: 32 }}
                onChange={(e: SelectChangeEvent) => dispatch(setDiscoveryFilter({ key: "area", value: e.target.value }))}>
                <MenuItem value=""><em>Todas</em></MenuItem>
                {uniqueDomains.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>

            {hasAnyFilter && (
              <Chip label="Limpar" size="small" onDelete={() => dispatch(clearDiscoveryFilters())}
                sx={{ height: 26, fontSize: "0.7rem" }} />
            )}

            <Box sx={{ flex: 1 }} />

            <Stack direction="row" spacing={0.5} alignItems="center">
              <SortIcon sx={{ fontSize: 16, color: theme.palette.text.disabled }} />
              <Select size="small" variant="standard" value={sortMode}
                onChange={(e) => dispatch(setSortMode(e.target.value as SortMode))}
                sx={{ fontSize: "0.72rem", minWidth: 90, "&:before": { display: "none" } }}>
                <MenuItem value="relevance">Relevância</MenuItem>
                <MenuItem value="popularity">Popularidade</MenuItem>
                <MenuItem value="name">Nome</MenuItem>
              </Select>
              <IconButton size="small" onClick={() => dispatch(setSortDirection(sortDirection === "asc" ? "desc" : "asc"))}>
                {sortDirection === "desc" ? <ArrowDownwardIcon sx={{ fontSize: 16 }} /> : <ArrowUpwardIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        <Divider />

        {loading && <LinearProgress sx={{ height: 2 }} />}

        {/* Results */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          {filtered.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <SearchIcon sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Nenhum resultado encontrado</Typography>
              <Typography variant="body2" color="text.disabled">
                Tente termos como "score", "customer", "pipeline" ou ajuste os filtros
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="caption" color="text.disabled" sx={{ display: "block", mb: 1.5, fontSize: "0.7rem" }}>
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              </Typography>
              {filtered.map((item) => (
                <AssetCard
                  key={item.id}
                  item={item}
                  isSelected={selectedId === item.id}
                  onSelect={() => dispatch(selectAsset(selectedId === item.id ? null : item.id))}
                />
              ))}
            </>
          )}
        </Box>
      </Box>

      {/* ── Right Panel: Detail ── */}
      {selectedItem && (
        <Box sx={{
          width: RIGHT_WIDTH, minWidth: RIGHT_WIDTH, height: "100%", overflowY: "auto",
          borderLeft: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper,
          borderRadius: "0 8px 8px 0",
        }}>
          <DetailPanel item={selectedItem} onClose={() => dispatch(selectAsset(null))} />
        </Box>
      )}
    </Box>
  );
}
