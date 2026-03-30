import { useEffect, useCallback, useState } from "react";
import {
  Box, Card, CardContent, Typography, TextField, InputAdornment,
  Chip, Grid, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, useTheme, IconButton, Stack, ToggleButton,
  ToggleButtonGroup, Fade,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TableChartIcon from "@mui/icons-material/TableChart";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import RuleIcon from "@mui/icons-material/Rule";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CableIcon from "@mui/icons-material/Cable";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { searchArtifacts, setDiscoverySearch } from "../../app/slices/discoverySlice";
import type { DiscoveryResult } from "../../domain/entities";
import PageSkeleton from "../components/PageSkeleton";

type ArtifactType = DiscoveryResult["type"];

const TYPE_ICON: Record<ArtifactType, React.ReactElement> = {
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
  TABLE: "Tabela",
  COLUMN: "Coluna",
  QUALITY_RULE: "Regra de Qualidade",
  ALERT: "Alerta",
  CONNECTOR: "Conector",
  PIPELINE: "Pipeline",
};

const TYPE_ROUTE: Partial<Record<ArtifactType, string>> = {
  QUALITY_RULE: "/data-quality",
  ALERT: "/alerts",
  CONNECTOR: "/connectors",
  PIPELINE: "/observability",
};

export default function DiscoveryPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const { results, loading, searchTerm } = useAppSelector((s) => s.discovery);
  const [filterType, setFilterType] = useState<ArtifactType | "ALL">("ALL");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  useEffect(() => { dispatch(searchArtifacts("")); }, [dispatch]);

  const handleSearch = useCallback(
    (term: string) => {
      dispatch(setDiscoverySearch(term));
      dispatch(searchArtifacts(term));
    },
    [dispatch]
  );

  const filtered = filterType === "ALL" ? results : results.filter((r) => r.type === filterType);

  const typeCounts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  if (loading && results.length === 0) return <PageSkeleton cards={6} rows={8} />;

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            Busca Global de Artefatos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Pesquise tabelas, colunas, regras de qualidade, alertas, conectores e pipelines em toda a plataforma.
          </Typography>

          <TextField
            fullWidth
            variant="outlined"
            size="medium"
            placeholder="Buscar: tabela, coluna, regra, alerta, conector ou pipeline..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.primary.main }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                fontSize: "1rem",
              },
            }}
          />

          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 0.5 }} alignItems="center">
            <Chip
              label={`Todos (${results.length})`}
              variant={filterType === "ALL" ? "filled" : "outlined"}
              color="primary"
              size="small"
              onClick={() => setFilterType("ALL")}
            />
            {(Object.keys(TYPE_LABEL) as ArtifactType[]).map((t) => (
              <Chip
                key={t}
                icon={TYPE_ICON[t]}
                label={`${TYPE_LABEL[t]} (${typeCounts[t] || 0})`}
                variant={filterType === t ? "filled" : "outlined"}
                color={TYPE_COLOR[t]}
                size="small"
                onClick={() => setFilterType(t)}
              />
            ))}

            <Box sx={{ flex: 1 }} />
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, v) => v && setViewMode(v)}
              size="small"
            >
              <ToggleButton value="table"><ViewListIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="cards"><GridViewIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <SearchIcon sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhum resultado encontrado
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Tente termos como "score", "customer", "pipeline", "alerta" ou "conector"
            </Typography>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Fade in>
          <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant="caption" fontWeight={700}>Tipo</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700}>Nome</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700}>Descrição</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700}>Origem</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700}>Metadados</Typography></TableCell>
                    <TableCell align="center"><Typography variant="caption" fontWeight={700}>Ação</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Chip
                          icon={TYPE_ICON[item.type]}
                          label={TYPE_LABEL[item.type]}
                          size="small"
                          color={TYPE_COLOR[item.type]}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{item.source}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {Object.entries(item.metadata).slice(0, 3).map(([k, v]) => (
                            <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" sx={{ fontSize: "0.62rem", height: 20 }} />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        {TYPE_ROUTE[item.type] && (
                          <IconButton size="small" onClick={() => navigate(TYPE_ROUTE[item.type]!)}>
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Fade>
      ) : (
        <Fade in>
          <Grid container spacing={2}>
            {filtered.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card sx={{
                  height: "100%",
                  cursor: TYPE_ROUTE[item.type] ? "pointer" : "default",
                  "&:hover": { boxShadow: 4 },
                  transition: "box-shadow 0.2s",
                }}
                  onClick={() => TYPE_ROUTE[item.type] && navigate(TYPE_ROUTE[item.type]!)}
                >
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <Chip
                        icon={TYPE_ICON[item.type]}
                        label={TYPE_LABEL[item.type]}
                        size="small"
                        color={TYPE_COLOR[item.type]}
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={700}>{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: 40 }}>
                      {item.description}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block" mb={1}>
                      {item.source}
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {Object.entries(item.metadata).map(([k, v]) => (
                        <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18 }} />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Fade>
      )}
    </Box>
  );
}
