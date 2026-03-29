import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { QueryBlock, QueryConnection, SavedQuery, BlockType } from "../../domain/entities";

interface QueryBuilderState {
  blocks: QueryBlock[];
  connections: QueryConnection[];
  selectedBlockId: string | null;
  generatedSql: string;
  savedQueries: SavedQuery[];
  resultPreview: Record<string, unknown>[];
  executing: boolean;
  loading: boolean;
  error: string | null;
}

const SQL_TEMPLATES: Record<BlockType, (config: Record<string, string>) => string> = {
  SOURCE: (c) => `FROM ${c.table || "tabela"}`,
  FILTER: (c) => `WHERE ${c.column || "coluna"} ${c.operator || "="} '${c.value || "valor"}'`,
  JOIN: (c) => `JOIN ${c.table || "tabela"} ON ${c.on || "a.id = b.id"}`,
  AGGREGATE: (c) => `GROUP BY ${c.groupBy || "coluna"}\nHAVING ${c.having || "COUNT(*) > 0"}`,
  OUTPUT: (c) => `SELECT ${c.columns || "*"}`,
};

function buildSql(blocks: QueryBlock[], _connections: QueryConnection[]): string {
  if (blocks.length === 0) return "-- Adicione blocos para gerar SQL";
  const output = blocks.find((b) => b.type === "OUTPUT");
  const source = blocks.find((b) => b.type === "SOURCE");
  const filters = blocks.filter((b) => b.type === "FILTER");
  const joins = blocks.filter((b) => b.type === "JOIN");
  const aggs = blocks.filter((b) => b.type === "AGGREGATE");

  const parts: string[] = [];
  parts.push(SQL_TEMPLATES.OUTPUT(output?.config ?? { columns: "*" }));
  if (source) parts.push(SQL_TEMPLATES.SOURCE(source.config));
  joins.forEach((j) => parts.push(SQL_TEMPLATES.JOIN(j.config)));
  filters.forEach((f) => parts.push(SQL_TEMPLATES.FILTER(f.config)));
  aggs.forEach((a) => parts.push(SQL_TEMPLATES.AGGREGATE(a.config)));
  parts.push(";");
  return parts.join("\n");
}

const mockSaved: SavedQuery[] = [
  { id:"sq-01", name:"Clientes com score zerado", description:"Busca clientes PF cujo score de crédito está zerado nos últimos 7 dias", blocks:[], connections:[], generatedSql:"SELECT c.cpf, c.nome, s.score\nFROM clientes c\nJOIN score_credito_pf s ON c.cpf = s.cpf\nWHERE s.score = 0 AND s.data_ref >= CURRENT_DATE - 7;", createdBy:"Ana Silva", createdAt:"2026-03-20T10:00:00Z", lastRunAt:"2026-03-29T08:00:00Z", resultPreview:[{cpf:"123.456.789-00",nome:"João Silva",score:0},{cpf:"987.654.321-00",nome:"Maria Santos",score:0}] },
  { id:"sq-02", name:"Volume de transações por camada", description:"Contagem de transações agrupadas por camada e status", blocks:[], connections:[], generatedSql:"SELECT layer, status, COUNT(*) as total\nFROM transactions\nGROUP BY layer, status\nORDER BY total DESC;", createdBy:"Carlos Mendes", createdAt:"2026-03-18T14:00:00Z", lastRunAt:"2026-03-29T07:00:00Z", resultPreview:[{layer:"INGESTION",status:"SUCCESS",total:45230},{layer:"TRUSTED",status:"SUCCESS",total:38100},{layer:"ANALYTICS",status:"SUCCESS",total:22500}] },
  { id:"sq-03", name:"Fontes com erro nas últimas 24h", description:"Lista fontes de dados que tiveram erros de ingestão nas últimas 24 horas", blocks:[], connections:[], generatedSql:"SELECT source_name, COUNT(*) as errors, MAX(timestamp) as last_error\nFROM ingestion_logs\nWHERE status = 'ERROR' AND timestamp >= NOW() - INTERVAL '24 hours'\nGROUP BY source_name\nORDER BY errors DESC;", createdBy:"Lucia Ferreira", createdAt:"2026-03-22T09:00:00Z", lastRunAt:"2026-03-28T18:00:00Z", resultPreview:[{source_name:"Oracle Legado",errors:14,last_error:"2026-03-29T01:30:00Z"},{source_name:"API Parceiros",errors:3,last_error:"2026-03-29T06:15:00Z"}] },
];

const mockResults: Record<string, unknown>[] = [
  { id: 1, cpf: "123.456.789-00", nome: "João Silva", score: 750, status: "ATIVO" },
  { id: 2, cpf: "987.654.321-00", nome: "Maria Santos", score: 820, status: "ATIVO" },
  { id: 3, cpf: "456.789.123-00", nome: "Pedro Oliveira", score: 0, status: "BLOQUEADO" },
  { id: 4, cpf: "321.654.987-00", nome: "Ana Costa", score: 690, status: "ATIVO" },
  { id: 5, cpf: "789.123.456-00", nome: "Carlos Souza", score: 0, status: "PENDENTE" },
];

export const fetchSavedQueries = createAsyncThunk("queryBuilder/fetchSaved", async () => {
  await new Promise((r) => setTimeout(r, 400));
  return mockSaved;
});

export const executeQuery = createAsyncThunk("queryBuilder/execute", async (_: void) => {
  await new Promise((r) => setTimeout(r, 1200));
  return mockResults;
});

let blockCounter = 0;
let connCounter = 0;

const queryBuilderSlice = createSlice({
  name: "queryBuilder",
  initialState: {
    blocks: [], connections: [], selectedBlockId: null, generatedSql: "-- Adicione blocos para gerar SQL",
    savedQueries: [], resultPreview: [], executing: false, loading: false, error: null,
  } as QueryBuilderState,
  reducers: {
    addBlock(state, { payload }: PayloadAction<{ type: BlockType; x: number; y: number }>) {
      blockCounter++;
      const labels: Record<BlockType, string> = { SOURCE: "Fonte", FILTER: "Filtro", JOIN: "Join", AGGREGATE: "Agregação", OUTPUT: "Saída" };
      state.blocks.push({ id: `blk-${blockCounter}`, type: payload.type, label: `${labels[payload.type]} ${blockCounter}`, config: {}, position: { x: payload.x, y: payload.y } });
      state.generatedSql = buildSql(state.blocks, state.connections);
    },
    moveBlock(state, { payload }: PayloadAction<{ id: string; x: number; y: number }>) {
      const b = state.blocks.find((b) => b.id === payload.id);
      if (b) { b.position = { x: payload.x, y: payload.y }; }
    },
    removeBlock(state, { payload }: PayloadAction<string>) {
      state.blocks = state.blocks.filter((b) => b.id !== payload);
      state.connections = state.connections.filter((c) => c.fromId !== payload && c.toId !== payload);
      if (state.selectedBlockId === payload) state.selectedBlockId = null;
      state.generatedSql = buildSql(state.blocks, state.connections);
    },
    addConnection(state, { payload }: PayloadAction<{ fromId: string; toId: string }>) {
      connCounter++;
      state.connections.push({ id: `conn-${connCounter}`, fromId: payload.fromId, toId: payload.toId });
      state.generatedSql = buildSql(state.blocks, state.connections);
    },
    selectBlock(state, { payload }: PayloadAction<string | null>) { state.selectedBlockId = payload; },
    updateBlockConfig(state, { payload }: PayloadAction<{ id: string; config: Record<string, string> }>) {
      const b = state.blocks.find((b) => b.id === payload.id);
      if (b) { b.config = { ...b.config, ...payload.config }; }
      state.generatedSql = buildSql(state.blocks, state.connections);
    },
    clearCanvas(state) { state.blocks = []; state.connections = []; state.selectedBlockId = null; state.generatedSql = "-- Adicione blocos para gerar SQL"; state.resultPreview = []; },
  },
  extraReducers: (b) => {
    b.addCase(fetchSavedQueries.pending, (s) => { s.loading = true; })
     .addCase(fetchSavedQueries.fulfilled, (s, { payload }) => { s.loading = false; s.savedQueries = payload; })
     .addCase(fetchSavedQueries.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? "Erro"; })
     .addCase(executeQuery.pending, (s) => { s.executing = true; })
     .addCase(executeQuery.fulfilled, (s, { payload }) => { s.executing = false; s.resultPreview = payload; })
     .addCase(executeQuery.rejected, (s) => { s.executing = false; });
  },
});

export const { addBlock, moveBlock, removeBlock, addConnection, selectBlock, updateBlockConfig, clearCanvas } = queryBuilderSlice.actions;
export default queryBuilderSlice.reducer;
