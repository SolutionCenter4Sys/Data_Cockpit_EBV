import { useEffect, useState, useRef } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button, useTheme, Stack,
  Paper, IconButton, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Divider, CircularProgress,
} from "@mui/material";
import BuildIcon from "@mui/icons-material/Build";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import StorageIcon from "@mui/icons-material/Storage";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import JoinInnerIcon from "@mui/icons-material/JoinInner";
import FunctionsIcon from "@mui/icons-material/Functions";
import OutputIcon from "@mui/icons-material/Output";
import HistoryIcon from "@mui/icons-material/History";
import { useAppDispatch, useAppSelector } from "../../app/store";
import {
  addBlock, moveBlock, removeBlock, selectBlock, updateBlockConfig,
  clearCanvas, executeQuery, fetchSavedQueries,
} from "../../app/slices/queryBuilderSlice";
import type { BlockType, QueryBlock } from "../../domain/entities";

const BLOCK_PALETTE: { type: BlockType; label: string; icon: React.ReactElement; color: string }[] = [
  { type: "SOURCE", label: "Fonte", icon: <StorageIcon fontSize="small" />, color: "#336791" },
  { type: "FILTER", label: "Filtro", icon: <FilterAltIcon fontSize="small" />, color: "#F5A623" },
  { type: "JOIN", label: "Join", icon: <JoinInnerIcon fontSize="small" />, color: "#10B981" },
  { type: "AGGREGATE", label: "Agregação", icon: <FunctionsIcon fontSize="small" />, color: "#8B5CF6" },
  { type: "OUTPUT", label: "Saída", icon: <OutputIcon fontSize="small" />, color: "#E31837" },
];

const BLOCK_COLORS: Record<BlockType, string> = { SOURCE: "#336791", FILTER: "#F5A623", JOIN: "#10B981", AGGREGATE: "#8B5CF6", OUTPUT: "#E31837" };

const CONFIG_FIELDS: Record<BlockType, { key: string; label: string; placeholder: string }[]> = {
  SOURCE: [{ key: "table", label: "Tabela", placeholder: "public.clientes" }],
  FILTER: [
    { key: "column", label: "Coluna", placeholder: "score" },
    { key: "operator", label: "Operador", placeholder: "=" },
    { key: "value", label: "Valor", placeholder: "0" },
  ],
  JOIN: [
    { key: "table", label: "Tabela", placeholder: "score_credito_pf" },
    { key: "on", label: "Condição", placeholder: "a.cpf = b.cpf" },
  ],
  AGGREGATE: [
    { key: "groupBy", label: "Group By", placeholder: "camada, status" },
    { key: "having", label: "Having", placeholder: "COUNT(*) > 0" },
  ],
  OUTPUT: [{ key: "columns", label: "Colunas", placeholder: "cpf, nome, score" }],
};

function CanvasBlock({ block, selected, onSelect, onRemove, onDrag }: {
  block: QueryBlock; selected: boolean; onSelect: () => void; onRemove: () => void;
  onDrag: (x: number, y: number) => void;
}) {
  const color = BLOCK_COLORS[block.type];
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX - block.position.x, y: e.clientY - block.position.y };
    const handleMouseMove = (ev: MouseEvent) => {
      if (dragging.current) onDrag(ev.clientX - offset.current.x, ev.clientY - offset.current.y);
    };
    const handleMouseUp = () => { dragging.current = false; window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <Paper
      elevation={selected ? 6 : 2}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      sx={{
        position: "absolute", left: block.position.x, top: block.position.y,
        width: 140, p: 1, cursor: "grab", userSelect: "none",
        border: `2px solid ${selected ? color : "transparent"}`,
        borderRadius: 2, transition: "border 0.15s",
        "&:hover": { borderColor: color },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Chip label={block.type} size="small" sx={{ bgcolor: color + "20", color, fontWeight: 700, fontSize: "0.6rem" }} />
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
          <DeleteOutlineIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
      <Typography variant="caption" fontWeight={600} sx={{ display: "block", mt: 0.5 }}>{block.label}</Typography>
      {Object.entries(block.config).map(([k, v]) => (
        <Typography key={k} variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.6rem" }}>
          {k}: {v}
        </Typography>
      ))}
    </Paper>
  );
}

export default function QueryBuilderPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { blocks, generatedSql, selectedBlockId, savedQueries, resultPreview, executing } = useAppSelector((s) => s.queryBuilder);
  const [tab, setTab] = useState<"canvas" | "saved">("canvas");

  useEffect(() => { dispatch(fetchSavedQueries()); }, [dispatch]);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const configFields = selectedBlock ? CONFIG_FIELDS[selectedBlock.type] : [];

  const handleAddBlock = (type: BlockType) => {
    const x = 40 + (blocks.filter((b) => b.type === type).length * 30);
    const y = 40 + (blocks.length * 20);
    dispatch(addBlock({ type, x, y }));
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <BuildIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>Query Builder</Typography>
          <Typography variant="body2" color="text.secondary">Construtor visual de consultas com drag-and-drop e preview SQL</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant={tab === "canvas" ? "contained" : "outlined"} size="small" onClick={() => setTab("canvas")}>Canvas</Button>
          <Button variant={tab === "saved" ? "contained" : "outlined"} size="small" onClick={() => setTab("saved")} startIcon={<HistoryIcon />}>Salvas ({savedQueries.length})</Button>
        </Stack>
      </Box>

      {tab === "saved" ? (
        <Stack spacing={2}>
          {savedQueries.map((q) => (
            <Card key={q.id}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={700}>{q.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{q.description}</Typography>
                <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: theme.palette.action.hover, fontFamily: "monospace", fontSize: "0.8rem", whiteSpace: "pre-wrap", mb: 1.5 }}>
                  {q.generatedSql}
                </Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Typography variant="caption" color="text.secondary">Por: {q.createdBy}</Typography>
                  <Typography variant="caption" color="text.secondary">|</Typography>
                  <Typography variant="caption" color="text.secondary">Última exec: {new Date(q.lastRunAt).toLocaleString("pt-BR")}</Typography>
                </Box>
                {q.resultPreview.length > 0 && (
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 1.5 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {Object.keys(q.resultPreview[0]).map((k) => (
                            <TableCell key={k}><Typography variant="caption" fontWeight={600}>{k}</Typography></TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {q.resultPreview.map((row, i) => (
                          <TableRow key={i}>
                            {Object.values(row).map((v, j) => (
                              <TableCell key={j}><Typography variant="caption">{String(v)}</Typography></TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="caption" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em", mb: 1, display: "block" }}>Blocos</Typography>
                <Stack spacing={0.5}>
                  {BLOCK_PALETTE.map((bp) => (
                    <Button
                      key={bp.type}
                      fullWidth size="small" variant="outlined"
                      startIcon={bp.icon}
                      onClick={() => handleAddBlock(bp.type)}
                      sx={{ justifyContent: "flex-start", borderColor: bp.color + "40", color: bp.color, fontSize: "0.72rem" }}
                    >
                      {bp.label}
                    </Button>
                  ))}
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Button fullWidth size="small" color="error" variant="text" startIcon={<ClearAllIcon />} onClick={() => dispatch(clearCanvas())}>
                  Limpar
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ minHeight: 400 }}>
              <CardContent sx={{ p: 0, position: "relative", height: 400, overflow: "hidden" }}
                onClick={() => dispatch(selectBlock(null))}>
                {blocks.length === 0 ? (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: theme.palette.text.disabled }}>
                    <Typography variant="body2">Adicione blocos da paleta para construir sua query</Typography>
                  </Box>
                ) : (
                  blocks.map((block) => (
                    <CanvasBlock
                      key={block.id}
                      block={block}
                      selected={selectedBlockId === block.id}
                      onSelect={() => dispatch(selectBlock(block.id))}
                      onRemove={() => dispatch(removeBlock(block.id))}
                      onDrag={(x, y) => dispatch(moveBlock({ id: block.id, x, y }))}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              {selectedBlock && (
                <Card>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                      Configurar: {selectedBlock.label}
                    </Typography>
                    <Stack spacing={1.5}>
                      {configFields.map((f) => (
                        <TextField
                          key={f.key} label={f.label} placeholder={f.placeholder}
                          size="small" fullWidth
                          value={selectedBlock.config[f.key] ?? ""}
                          onChange={(e) => dispatch(updateBlockConfig({ id: selectedBlock.id, config: { [f.key]: e.target.value } }))}
                          InputProps={{ sx: { fontFamily: "monospace", fontSize: "0.85rem" } }}
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>SQL Gerado</Typography>
                    <Button size="small" variant="contained" startIcon={executing ? <CircularProgress size={14} /> : <PlayArrowIcon />}
                      onClick={() => dispatch(executeQuery())} disabled={executing || blocks.length === 0}>
                      Executar
                    </Button>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: theme.palette.action.hover, fontFamily: "monospace", fontSize: "0.8rem", whiteSpace: "pre-wrap", minHeight: 80 }}>
                    {generatedSql}
                  </Box>
                </CardContent>
              </Card>

              {resultPreview.length > 0 && (
                <Card>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Resultado ({resultPreview.length} registros)</Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            {Object.keys(resultPreview[0]).map((k) => (
                              <TableCell key={k}><Typography variant="caption" fontWeight={600}>{k}</Typography></TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {resultPreview.map((row, i) => (
                            <TableRow key={i}>
                              {Object.values(row).map((v, j) => (
                                <TableCell key={j}><Typography variant="caption">{String(v)}</Typography></TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
