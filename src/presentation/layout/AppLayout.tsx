import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAppDispatch } from '../../app/store';
import { fetchDashboard } from '../../app/slices/dashboardSlice';
import { fetchAlerts } from '../../app/slices/alertSlice';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard EBV', subtitle: 'Visão consolidada de saúde dos dados' },
  '/score': { title: 'Score Monitor', subtitle: 'Monitoramento de modelos analíticos e anomalias' },
  '/alerts': { title: 'Central de Alertas', subtitle: 'Gestão de alertas e regras de acionamento' },
  '/batch': { title: 'Batch Monitor', subtitle: 'Rastreamento de jobs e processos em lote' },
  '/lineage': { title: 'Rastreabilidade', subtitle: 'Lineage de pipelines e rastreabilidade de dados' },
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
