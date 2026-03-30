import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  useTheme,
  Stack,
  TextField,
  Button,
  Slider,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchPipelineRuns, fetchPipelineDetail, clearSelected } from '../../app/slices/lineageSlice';
import StatusBadge from '../components/StatusBadge';
import PageSkeleton from '../components/PageSkeleton';
import type { PipelineRun, LineageNode, LineageEdge, DataLayer, BottleneckAnalysis, RedundancyReport } from '../../domain/entities';

const LAYER_LABELS: Record<string, string> = {
  INGESTION: 'Ingestão', TRUSTED: 'Trusted', ANALYTICS: 'Analytics',
};
const LAYER_ORDER = ['INGESTION', 'TRUSTED', 'ANALYTICS'];

interface E2ENode {
  id: string;
  label: string;
  stage: string;
  color: string;
  x: number;
  y: number;
  status: 'ok' | 'warn' | 'error';
}

interface E2EEdge {
  from: string;
  to: string;
  animated?: boolean;
}

const E2E_NODES: E2ENode[] = [
  { id: 'src-oracle', label: 'Oracle Legado', stage: 'Fontes', color: '#78909C', x: 30, y: 60, status: 'ok' },
  { id: 'src-kafka', label: 'Kafka Events', stage: 'Fontes', color: '#78909C', x: 30, y: 140, status: 'ok' },
  { id: 'src-api', label: 'API Rest', stage: 'Fontes', color: '#78909C', x: 30, y: 220, status: 'warn' },
  { id: 'ing-etl', label: 'ETL-047 FFT', stage: 'Ingestão', color: '#1565C0', x: 220, y: 60, status: 'ok' },
  { id: 'ing-cdc', label: 'CDC Stream', stage: 'Ingestão', color: '#1565C0', x: 220, y: 140, status: 'ok' },
  { id: 'ing-batch', label: 'Batch Load', stage: 'Ingestão', color: '#1565C0', x: 220, y: 220, status: 'error' },
  { id: 'gov-golden', label: 'Golden Record', stage: 'Governança', color: '#6A1B9A', x: 420, y: 100, status: 'ok' },
  { id: 'gov-mdm', label: 'MDM Engine', stage: 'Governança', color: '#6A1B9A', x: 420, y: 200, status: 'ok' },
  { id: 'dw-bronze', label: 'Bronze Layer', stage: 'DW', color: '#00695C', x: 620, y: 50, status: 'ok' },
  { id: 'dw-silver', label: 'Silver Layer', stage: 'DW', color: '#00695C', x: 620, y: 140, status: 'ok' },
  { id: 'dw-gold', label: 'Gold Layer', stage: 'DW', color: '#00695C', x: 620, y: 230, status: 'warn' },
  { id: 'an-score', label: 'Score Crédito', stage: 'Analytics', color: '#E65100', x: 820, y: 80, status: 'ok' },
  { id: 'an-fraude', label: 'Score Fraude', stage: 'Analytics', color: '#E65100', x: 820, y: 180, status: 'error' },
  { id: 'del-batch', label: 'Batch Delivery', stage: 'Delivery', color: '#283593', x: 1010, y: 80, status: 'ok' },
  { id: 'del-api', label: 'API Gateway', stage: 'Delivery', color: '#283593', x: 1010, y: 180, status: 'ok' },
  { id: 'prod-portal', label: 'Portal Online', stage: 'Produtos', color: '#AD1457', x: 1190, y: 80, status: 'ok' },
  { id: 'prod-app', label: 'App Mobile', stage: 'Produtos', color: '#AD1457', x: 1190, y: 180, status: 'ok' },
];

const E2E_EDGES: E2EEdge[] = [
  { from: 'src-oracle', to: 'ing-etl' },
  { from: 'src-kafka', to: 'ing-cdc', animated: true },
  { from: 'src-api', to: 'ing-batch' },
  { from: 'ing-etl', to: 'gov-golden' },
  { from: 'ing-cdc', to: 'gov-golden' },
  { from: 'ing-batch', to: 'gov-mdm' },
  { from: 'gov-golden', to: 'dw-bronze' },
  { from: 'gov-mdm', to: 'dw-bronze' },
  { from: 'dw-bronze', to: 'dw-silver' },
  { from: 'dw-silver', to: 'dw-gold' },
  { from: 'dw-gold', to: 'an-score' },
  { from: 'dw-gold', to: 'an-fraude' },
  { from: 'an-score', to: 'del-batch' },
  { from: 'an-fraude', to: 'del-api' },
  { from: 'del-batch', to: 'prod-portal' },
  { from: 'del-api', to: 'prod-app' },
  { from: 'del-api', to: 'prod-portal' },
];

const MOCK_BOTTLENECKS: BottleneckAnalysis[] = [
  { nodeId: "n-etl-047", nodeName: "ETL-047 FFT Copy", layer: "INGESTION", avgLatencyMs: 4500, volumePerHour: 125000, severity: "HIGH", suggestion: "Considerar particionamento do arquivo FFT ou processamento paralelo" },
  { nodeId: "n-oracle-sync", nodeName: "Oracle Legacy Sync", layer: "INGESTION", avgLatencyMs: 8900, volumePerHour: 45000, severity: "CRITICAL", suggestion: "Migrar para CDC (Change Data Capture) em vez de full dump periódico" },
  { nodeId: "n-score-calc", nodeName: "Score Calculation", layer: "ANALYTICS", avgLatencyMs: 3200, volumePerHour: 89000, severity: "MEDIUM", suggestion: "Avaliar caching de features intermediárias para reduzir recalculação" },
];

const MOCK_REDUNDANCIES: RedundancyReport[] = [
  { id: "red-01", type: "REDUNDANT_FLOW", description: "Pipeline duplicado: ETL-047 e ETL-048 processam o mesmo arquivo FFT com transformações idênticas", affectedNodes: ["ETL-047", "ETL-048"], impact: "MEDIUM", recommendation: "Unificar em um único pipeline com saída para ambos destinos" },
  { id: "red-02", type: "DEPRECATED_SOURCE", description: "Oracle Legacy Sync usa fonte depreciada (EBVPROD schema v1) que será desativada em Jun/2026", affectedNodes: ["Oracle Legacy Sync", "TB_CLIENTE_HIST"], impact: "HIGH", recommendation: "Migrar para nova API de dados antes do deadline" },
  { id: "red-03", type: "MISSING_FLOW", description: "Não existe pipeline de reconciliação entre dados Trusted e Analytics para tabela score_fraude", affectedNodes: ["score_fraude_trusted", "score_fraude_analytics"], impact: "HIGH", recommendation: "Criar pipeline de validação cruzada com checagem de contagem e hash" },
];

interface PositionedNode {
  node: LineageNode;
  x: number;
  y: number;
}

interface TraceStep {
  order: number;
  nodeName: string;
  layer: DataLayer;
  status: string;
  timestamp: string;
  detail: string;
}

const LAYER_INDEX: Record<DataLayer, number> = {
  INGESTION: 0,
  TRUSTED: 1,
  ANALYTICS: 2,
};

const getStatusColor = (status: string, isLight: boolean): string => {
  if (status === 'SUCCESS') return isLight ? '#00873D' : '#10B981';
  if (status === 'RUNNING') return '#3399FF';
  if (status === 'FAILED') return '#E31837';
  if (status === 'WARNING') return '#F5A623';
  return '#6B7280';
};

const getLayerColor = (layer: DataLayer): string => {
  if (layer === 'INGESTION') return '#0066CC';
  if (layer === 'TRUSTED') return '#E31837';
  return '#F5A623';
};

const downloadTextFile = (filename: string, content: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const buildPositions = (nodes: LineageNode[]): PositionedNode[] => {
  const layerBuckets = nodes.reduce<Record<DataLayer, LineageNode[]>>(
    (acc, node) => {
      acc[node.layer].push(node);
      return acc;
    },
    { INGESTION: [], TRUSTED: [], ANALYTICS: [] }
  );

  return (['INGESTION', 'TRUSTED', 'ANALYTICS'] as DataLayer[]).flatMap((layer) => {
    return layerBuckets[layer].map((node, index) => ({
      node,
      x: 60 + LAYER_INDEX[layer] * 330,
      y: 50 + index * 92,
    }));
  });
};

const findPosition = (positions: PositionedNode[], nodeId: string): PositionedNode | undefined =>
  positions.find((item) => item.node.id === nodeId);

const buildTrace = (identifier: string, run: PipelineRun | null): TraceStep[] => {
  if (!run || !identifier.trim()) return [];
  if (identifier.toLowerCase().includes('nao')) return [];

  const sortedNodes = [...run.nodes].sort((a, b) => {
    const layerDiff = LAYER_INDEX[a.layer] - LAYER_INDEX[b.layer];
    if (layerDiff !== 0) return layerDiff;
    return a.name.localeCompare(b.name);
  });

  return sortedNodes.map((node, index) => ({
    order: index + 1,
    nodeName: node.name,
    layer: node.layer,
    status: node.status,
    timestamp: node.lastUpdated || run.startTime,
    detail: `${identifier} passou por ${node.type} (${node.status})`,
  }));
};

export default function LineagePage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { runs, selectedRun, loading } = useAppSelector((s) => s.lineage);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [traceIdentifier, setTraceIdentifier] = useState('');
  const [traceResult, setTraceResult] = useState<TraceStep[]>([]);

  useEffect(() => {
    dispatch(fetchPipelineRuns());
    return () => { dispatch(clearSelected()); };
  }, [dispatch]);

  useEffect(() => {
    if (!selectedRun) {
      setSelectedNodeId('');
      return;
    }
    if (!selectedNodeId || !selectedRun.nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(selectedRun.nodes[0]?.id ?? '');
    }
  }, [selectedRun, selectedNodeId]);

  const handleSelectRun = (runId: string) => {
    if (selectedId === runId) {
      setSelectedId(null);
      dispatch(clearSelected());
      setTraceResult([]);
      setTraceIdentifier('');
    } else {
      setSelectedId(runId);
      dispatch(fetchPipelineDetail(runId));
      setTraceResult([]);
    }
  };

  const failedRuns = runs.filter((r) => r.status === 'FAILED');
  const chipBg = isLight ? 'rgba(0,47,108,0.06)' : 'rgba(255,255,255,0.06)';

  const positionedNodes = useMemo(
    () => (selectedRun ? buildPositions(selectedRun.nodes) : []),
    [selectedRun]
  );

  const selectedNode = useMemo(
    () => selectedRun?.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [selectedRun, selectedNodeId]
  );

  if (loading && runs.length === 0) return <PageSkeleton />;

  const runCompletionPct = selectedRun && selectedRun.stepsTotal > 0
    ? (selectedRun.stepsCompleted / selectedRun.stepsTotal) * 100
    : 0;

  const runCompletionColor = !selectedRun
    ? theme.palette.info.main
    : selectedRun.stepsFailled > 0
      ? theme.palette.error.main
      : runCompletionPct === 100
        ? theme.palette.success.main
        : theme.palette.warning.main;

  const handleTraceSearch = (): void => {
    setTraceResult(buildTrace(traceIdentifier, selectedRun));
  };

  const handleExportSvg = (): void => {
    const svg = document.getElementById('lineage-dag-svg');
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    downloadTextFile('lineage-dag.svg', serialized, 'image/svg+xml;charset=utf-8;');
  };

  const handleExportTraceCsv = (): void => {
    if (traceResult.length === 0) return;
    const rows = [
      'ordem;node;camada;status;timestamp;detalhe',
      ...traceResult.map((step) =>
        [
          step.order,
          step.nodeName,
          step.layer,
          step.status,
          step.timestamp,
          step.detail.replace(/;/g, ','),
        ].join(';')
      ),
    ];
    downloadTextFile(`lineage-trace-${Date.now()}.csv`, rows.join('\n'), 'text/csv;charset=utf-8;');
  };

  const handleExportAuditPdf = (): void => {
    if (traceResult.length === 0) return;
    const popup = window.open('', '_blank', 'width=1024,height=768');
    if (!popup) return;

    const html = `
      <html>
      <head>
        <title>Auditoria Lineage</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
          th { background: #f3f3f3; text-align: left; }
          h1 { font-size: 20px; margin-bottom: 6px; }
          .meta { color: #666; font-size: 12px; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <h1>Relatório de Auditoria de Lineage</h1>
        <div class="meta">
          Pipeline: ${selectedRun?.pipelineName ?? '-'} | Run: ${selectedRun?.runId ?? '-'} | Identificador: ${traceIdentifier}
        </div>
        <table>
          <thead>
            <tr>
              <th>Ordem</th><th>Nó</th><th>Camada</th><th>Status</th><th>Timestamp</th><th>Detalhe</th>
            </tr>
          </thead>
          <tbody>
            ${traceResult
              .map(
                (step) => `
                  <tr>
                    <td>${step.order}</td>
                    <td>${step.nodeName}</td>
                    <td>${step.layer}</td>
                    <td>${step.status}</td>
                    <td>${new Date(step.timestamp).toLocaleString('pt-BR')}</td>
                    <td>${step.detail}</td>
                  </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const e2eNodeMap = E2E_NODES.reduce<Record<string, E2ENode>>((acc, n) => { acc[n.id] = n; return acc; }, {});

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>Mapa Visual — Jornada End-to-End do Dado</Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 2 }}>
            Fontes → Ingestão → Governança → DW → Analytics → Delivery → Produtos
          </Typography>
          <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 1, overflow: 'auto' }}>
            <svg width={1380} height={290} role="img" aria-label="Mapa end-to-end de linhagem">
              {(() => {
                const stages = ['Fontes', 'Ingestão', 'Governança', 'DW', 'Analytics', 'Delivery', 'Produtos'];
                const stageColors = ['#78909C', '#1565C0', '#6A1B9A', '#00695C', '#E65100', '#283593', '#AD1457'];
                return stages.map((s, i) => (
                  <text key={s} x={30 + i * 195} y={18} fill={stageColors[i]} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const }}>{s}</text>
                ));
              })()}

              {E2E_EDGES.map((edge) => {
                const from = e2eNodeMap[edge.from];
                const to = e2eNodeMap[edge.to];
                if (!from || !to) return null;
                const x1 = from.x + 150;
                const y1 = from.y + 20;
                const x2 = to.x;
                const y2 = to.y + 20;
                const mx = (x1 + x2) / 2;
                return (
                  <path
                    key={`${edge.from}-${edge.to}`}
                    d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                    fill="none"
                    stroke={theme.palette.text.disabled}
                    strokeWidth={1.5}
                    strokeDasharray={edge.animated ? '6 3' : undefined}
                    opacity={0.5}
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}

              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill={theme.palette.text.disabled} opacity={0.6} />
                </marker>
              </defs>

              {E2E_NODES.map((node) => {
                const statusColor = node.status === 'ok' ? '#10B981' : node.status === 'warn' ? '#F5A623' : '#E31837';
                return (
                  <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                    <rect width={150} height={40} rx={6} fill={`${node.color}14`} stroke={node.color} strokeWidth={1.5} />
                    <circle cx={138} cy={8} r={5} fill={statusColor} />
                    <text x={10} y={17} fill={theme.palette.text.primary} style={{ fontSize: '11px', fontWeight: 600 }}>{node.label}</text>
                    <text x={10} y={32} fill={theme.palette.text.secondary} style={{ fontSize: '9px' }}>{node.stage}</text>
                  </g>
                );
              })}
            </svg>
          </Box>
        </CardContent>
      </Card>

      {failedRuns.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>{failedRuns.length} pipeline(s) falharam:</strong>{' '}
          {failedRuns.map((r) => r.pipelineName).join(', ')}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Pipelines', value: runs.length, color: theme.palette.text.secondary },
          { label: 'Com Falha', value: failedRuns.length, color: failedRuns.length > 0 ? theme.palette.error.main : theme.palette.success.main },
          { label: 'Em Execução', value: runs.filter((r) => r.status === 'RUNNING').length, color: theme.palette.info.main },
          { label: 'Concluídos', value: runs.filter((r) => r.status === 'SUCCESS').length, color: theme.palette.success.main },
        ].map((k) => (
          <Grid item xs={6} md={3} key={k.label}>
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>{k.label}</Typography>
                <Typography variant="h3" sx={{ color: k.color, fontWeight: 700 }}>{k.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ width: '100%' }}>
              <TextField
                fullWidth
                size="small"
                label="Rastrear identificador (CPF/ID)"
                value={traceIdentifier}
                onChange={(event) => setTraceIdentifier(event.target.value)}
                placeholder="Ex: CPF-12345678900"
              />
              <Button
                variant="contained"
                size="small"
                startIcon={<SearchIcon fontSize="small" />}
                onClick={handleTraceSearch}
                disabled={!selectedRun}
              >
                Rastrear
              </Button>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button size="small" startIcon={<DownloadIcon fontSize="small" />} onClick={handleExportSvg} disabled={!selectedRun}>
                SVG
              </Button>
              <Button size="small" startIcon={<FileDownloadOutlinedIcon fontSize="small" />} onClick={handleExportTraceCsv} disabled={traceResult.length === 0}>
                CSV
              </Button>
              <Button size="small" variant="contained" onClick={handleExportAuditPdf} disabled={traceResult.length === 0}>
                PDF auditoria
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {selectedRun && selectedId && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 1.5 }}>
              <Box>
                <Typography variant="h5">{selectedRun.pipelineName}</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: 'monospace' }}>
                  {selectedRun.runId}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 220 }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  Zoom DAG: {(zoom * 100).toFixed(0)}%
                </Typography>
                <Slider
                  size="small"
                  min={0.8}
                  max={1.6}
                  step={0.05}
                  value={zoom}
                  onChange={(_, value) => {
                    if (typeof value === 'number') setZoom(value);
                  }}
                />
              </Box>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={runCompletionPct}
              sx={{ mb: 2.2, height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { backgroundColor: runCompletionColor } }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 1, overflow: 'auto' }}>
                  <svg id="lineage-dag-svg" width={1080} height={420} role="img" aria-label="DAG de lineage">
                    <g transform={`scale(${zoom})`}>
                      {LAYER_ORDER.map((layer, index) => (
                        <text
                          key={layer}
                          x={70 + index * 330}
                          y={22}
                          fill={getLayerColor(layer as DataLayer)}
                          style={{ fontSize: '12px', fontWeight: 700 }}
                        >
                          {LAYER_LABELS[layer]}
                        </text>
                      ))}

                      {selectedRun.edges.map((edge: LineageEdge) => {
                        const source = findPosition(positionedNodes, edge.sourceId);
                        const target = findPosition(positionedNodes, edge.targetId);
                        if (!source || !target) return null;
                        const color = getStatusColor(edge.status, isLight);

                        return (
                          <line
                            key={edge.id}
                            x1={source.x + 220}
                            y1={source.y + 26}
                            x2={target.x}
                            y2={target.y + 26}
                            stroke={color}
                            strokeWidth={2}
                            opacity={0.9}
                          />
                        );
                      })}

                      {positionedNodes.map((item) => {
                        const isSelected = item.node.id === selectedNodeId;
                        const color = getStatusColor(item.node.status, isLight);
                        return (
                          <g
                            key={item.node.id}
                            transform={`translate(${item.x}, ${item.y})`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedNodeId(item.node.id)}
                          >
                            <rect
                              width={220}
                              height={52}
                              rx={8}
                              fill={isSelected ? `${color}26` : `${color}14`}
                              stroke={color}
                              strokeWidth={isSelected ? 2.2 : 1.3}
                            />
                            <text x={10} y={20} fill={theme.palette.text.primary} style={{ fontSize: '11px', fontWeight: 700 }}>
                              {item.node.name}
                            </text>
                            <text x={10} y={36} fill={theme.palette.text.secondary} style={{ fontSize: '10px' }}>
                              {item.node.type} · {item.node.recordCount?.toLocaleString('pt-BR') ?? '--'} registros
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  </svg>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 0.8 }}>Detalhes do nó selecionado</Typography>
                    {selectedNode ? (
                      <>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedNode.name}</Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                          {selectedNode.type} · {LAYER_LABELS[selectedNode.layer]}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <StatusBadge status={selectedNode.status} />
                        </Box>
                        <Divider sx={{ my: 1.2 }} />
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                          Última atualização: {selectedNode.lastUpdated ? new Date(selectedNode.lastUpdated).toLocaleString('pt-BR') : '--'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                          Volume processado: {selectedNode.recordCount?.toLocaleString('pt-BR') ?? '--'}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Selecione um nó no DAG para visualizar detalhes.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {traceIdentifier.trim().length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ mb: 0.8 }}>
              Trilha de rastreabilidade
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1.5 }}>
              Identificador: {traceIdentifier}
            </Typography>

            {traceResult.length === 0 ? (
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Nenhuma trilha encontrada para o identificador informado.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ordem</TableCell>
                    <TableCell>Nó</TableCell>
                    <TableCell>Camada</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {traceResult.map((step) => (
                    <TableRow key={`${step.order}-${step.nodeName}`}>
                      <TableCell>{step.order}</TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{step.nodeName}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary }}>
                          {step.detail}
                        </Typography>
                      </TableCell>
                      <TableCell>{LAYER_LABELS[step.layer]}</TableCell>
                      <TableCell>{step.status}</TableCell>
                      <TableCell>{new Date(step.timestamp).toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h5" sx={{ mb: 0.5 }}>Execuções de Pipelines</Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 2 }}>
            Clique em uma linha para ver o grafo de lineage e detalhes
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Pipeline</TableCell>
                  <TableCell>Camada</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Passos</TableCell>
                  <TableCell>Progresso</TableCell>
                  <TableCell>Início</TableCell>
                  <TableCell>Nós</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {runs.map((run) => {
                  const isSelected = selectedId === run.runId;
                  const pct = run.stepsTotal > 0 ? (run.stepsCompleted / run.stepsTotal) * 100 : 0;
                  const pctColor =
                    run.stepsFailled > 0 ? theme.palette.error.main
                    : pct === 100 ? theme.palette.success.main
                    : theme.palette.warning.main;

                  return (
                    <TableRow
                      key={run.runId}
                      onClick={() => handleSelectRun(run.runId)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: isSelected
                          ? (isLight ? 'rgba(227,24,55,0.05)' : 'rgba(227,24,55,0.08)')
                          : 'transparent',
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{run.pipelineName}</Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontFamily: 'monospace' }}>
                          {run.runId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={LAYER_LABELS[run.layer]} size="small"
                          sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary, backgroundColor: chipBg }} />
                      </TableCell>
                      <TableCell><StatusBadge status={run.status} /></TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          <span style={{ color: theme.palette.success.main, fontWeight: 600 }}>{run.stepsCompleted}</span>
                          {' / '}{run.stepsTotal}
                          {run.stepsFailled > 0 && (
                            <span style={{ color: theme.palette.error.main }}> · {run.stepsFailled}✗</span>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 100 }}>
                        <LinearProgress variant="determinate" value={pct}
                          sx={{ height: 5, borderRadius: 3,
                            '& .MuiLinearProgress-bar': { backgroundColor: pctColor } }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {new Date(run.startTime).toLocaleString('pt-BR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {run.nodes.length} nós · {run.edges.length} conexões
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5, color: theme.palette.error.main }}>
                Análise de Gargalos
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Nós com latência ou volume acima do limiar identificados automaticamente
              </Typography>
              <Stack spacing={1.5}>
                {MOCK_BOTTLENECKS.map((bn) => (
                  <Box key={bn.nodeId} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${bn.severity === "CRITICAL" ? theme.palette.error.main : bn.severity === "HIGH" ? theme.palette.warning.main : theme.palette.divider}`, bgcolor: bn.severity === "CRITICAL" ? (theme.palette.mode === "light" ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.06)") : "transparent" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={700}>{bn.nodeName}</Typography>
                      <Chip label={bn.severity} size="small" color={bn.severity === "CRITICAL" ? "error" : bn.severity === "HIGH" ? "warning" : "info"} sx={{ fontWeight: 700, fontSize: "0.6rem" }} />
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">Latência: <strong>{bn.avgLatencyMs}ms</strong></Typography>
                      <Typography variant="caption" color="text.secondary">Volume: <strong>{(bn.volumePerHour / 1000).toFixed(0)}k/h</strong></Typography>
                      <Chip label={LAYER_LABELS[bn.layer]} size="small" variant="outlined" sx={{ fontSize: "0.55rem", height: 18 }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>{bn.suggestion}</Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5, color: theme.palette.warning.main }}>
                Fluxos Redundantes & Fontes Depreciadas
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Otimizações identificadas na topologia de pipelines
              </Typography>
              <Stack spacing={1.5}>
                {MOCK_REDUNDANCIES.map((rd) => {
                  const typeLabel = rd.type === "REDUNDANT_FLOW" ? "Redundância" : rd.type === "DEPRECATED_SOURCE" ? "Fonte Depreciada" : "Fluxo Ausente";
                  const typeColor = rd.type === "REDUNDANT_FLOW" ? "warning" as const : rd.type === "DEPRECATED_SOURCE" ? "error" as const : "info" as const;
                  return (
                    <Box key={rd.id} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Chip label={typeLabel} size="small" color={typeColor} variant="outlined" sx={{ fontWeight: 600, fontSize: "0.6rem" }} />
                        <Chip label={rd.impact} size="small" color={rd.impact === "HIGH" ? "error" : "warning"} sx={{ fontSize: "0.55rem", height: 18 }} />
                      </Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>{rd.description}</Typography>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 0.5 }}>
                        {rd.affectedNodes.map((n) => (
                          <Chip key={n} label={n} size="small" variant="outlined" sx={{ fontSize: "0.55rem", height: 18 }} />
                        ))}
                      </Box>
                      <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>{rd.recommendation}</Typography>
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
