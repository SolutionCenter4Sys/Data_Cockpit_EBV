import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAppDispatch } from '../../app/store';
import { fetchDashboard } from '../../app/slices/dashboardSlice';
import { fetchAlerts } from '../../app/slices/alertSlice';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard Executivo', subtitle: 'Visão consolidada de saúde por área da esteira: Ingestão, Governança, DW, Analytics, Produtos, Delivery' },
  '/discovery': { title: 'Discovery', subtitle: 'Exploração de ativos de dados com navegação hierárquica, filtros avançados e detalhamento inline — padrão OpenMetadata' },
  '/lineage': { title: 'Linhagem de Dados', subtitle: 'Mapa visual end-to-end do dado: Fontes → Ingestão → Governança → DW → Analytics → Delivery → Produtos' },
  '/data-quality': { title: 'Qualidade de Dados', subtitle: 'Testes de qualidade com conectores, incidentes enviados para ServiceNow' },
  '/alerts': { title: 'Observabilidade', subtitle: 'Monitoramento de alertas, regras e saúde operacional da plataforma' },
  '/action-matrix': { title: 'Central de Alertas', subtitle: 'Quality → Alerta → Ação automática → ServiceNow / Slack / Teams / Email' },
  '/query-builder': { title: 'Query Builder', subtitle: 'Construtor visual de consultas com preview SQL' },
  '/rule-engine': { title: 'Cadastro de Regras', subtitle: 'Motor de regras de negócio com CEP e automação' },
  '/connectors': { title: 'Conectores & Credenciais', subtitle: 'Gestão de conexões, pools e credential vault' },
  '/score': { title: 'Score Monitor', subtitle: 'Monitoramento de modelos analíticos e anomalias' },
  '/batch': { title: 'Batch Monitor', subtitle: 'Rastreamento de jobs e processos em lote' },
  '/ingestion': { title: 'Camada Ingestão', subtitle: 'Monitoramento de fontes de ingestão de dados' },
  '/trusted': { title: 'Camada Trusted', subtitle: 'Quality gates e validações da camada trusted' },
  '/governance': { title: 'Governança', subtitle: 'Regras de governança e processos bloqueados' },
  '/analytics-expandido': { title: 'Analytics 1000+', subtitle: 'Cobertura analítica expandida por cluster' },
  '/smart-alerts': { title: 'Alertas IA', subtitle: 'Alertas inteligentes com supressão de ruído' },
  '/preditivoia': { title: 'IA Preditiva', subtitle: 'Predições de falhas e anomalias futuras' },
  '/sentinela': { title: 'AG-01 Sentinela', subtitle: 'Monitoramento proativo de sinais e anomalias' },
  '/guardiao': { title: 'AG-06 Guardião', subtitle: 'Quality gates e fronteiras de qualidade' },
  '/detetive': { title: 'AG-02 Detetive', subtitle: 'Correlação e investigação de incidentes' },
  '/auditor': { title: 'AG-07 Auditor', subtitle: 'Inventário e auditoria de modelos analíticos' },
  '/guru': { title: 'AG-03 Guru', subtitle: 'Análise de causa raiz e tendências' },
  '/conselheiro': { title: 'AG-08 Conselheiro', subtitle: 'Recomendações de janelas batch e capacidade' },
  '/comunicador': { title: 'AG-04 Comunicador', subtitle: 'Notificações multi-canal e roteamento inteligente' },
  '/parking-lot': { title: 'Parking Lot', subtitle: 'Agentes e épicos planejados para futuro' },
  '/data-catalog': { title: 'Catálogo de Dados', subtitle: 'Descoberta e exploração de fontes e assets de dados (substituído por Discovery)' },
  '/event-hub': { title: 'Hub de Eventos', subtitle: 'Monitoramento de eventos em tempo real com validação de schema' },
};

export default function AppLayout() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const theme = useTheme();
  const meta = PAGE_META[location.pathname] ?? { title: 'Cockpit EBV', subtitle: '' };

  useEffect(() => {
    dispatch(fetchDashboard());
    dispatch(fetchAlerts());
    const interval = setInterval(() => dispatch(fetchDashboard()), 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: theme.palette.background.default }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar pageTitle={meta.title} pageSubtitle={meta.subtitle} />
        <Box
          component="main"
          role="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 3,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
