import { useEffect } from 'react';
import {
  Grid, Box, Card, CardContent, Typography, Alert,
  LinearProgress, Divider, useTheme,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchDashboard } from '../../app/slices/dashboardSlice';
import KpiCard from '../components/KpiCard';
import HealthRing from '../components/HealthRing';
import PageSkeleton from '../components/PageSkeleton';
import type { LayerHealth } from '../../domain/entities';

const LAYER_LABELS: Record<string, string> = {
  INGESTION: 'Ingestão',
  TRUSTED: 'Trusted',
  ANALYTICS: 'Analytics',
};

const getHealthColor = (score: number, isLight: boolean) => {
  if (score >= 80) return isLight ? '#00873D' : '#10B981';
  if (score >= 60) return '#F5A623';
  return '#E31837';
};

function LayerHealthRow({ layer }: { layer: LayerHealth }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const color = getHealthColor(layer.healthScore, isLight);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 5px ${color}` }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            {LAYER_LABELS[layer.layer]}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            <span style={{ color, fontWeight: 700 }}>{layer.healthScore}%</span> saúde
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            <span style={{ color: layer.activeAlerts > 0 ? '#F5A623' : color, fontWeight: 600 }}>
              {layer.activeAlerts}
            </span>{' '}alertas
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            <span style={{ fontWeight: 600, color: theme.palette.text.primary }}>{layer.successRate}%</span> sucesso
          </Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={layer.healthScore}
        sx={{ mb: 1.5, '& .MuiLinearProgress-bar': { backgroundColor: color } }}
      />
    </Box>
  );
}

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { data, loading, error } = useAppSelector((s) => s.dashboard);

  useEffect(() => { dispatch(fetchDashboard()); }, [dispatch]);

  if (loading && !data) return <PageSkeleton cards={4} rows={5} />;
  if (error) return <Alert severity="error" sx={{ mb: 2 }}>Erro ao carregar dashboard: {error}</Alert>;
  if (!data) return null;

  return (
    <Box>
      {data.criticalAlerts > 0 && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Typography
              variant="caption"
              component="a"
              href="/alerts"
              sx={{ color: theme.palette.error.main, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
            >
              Ver alertas
            </Typography>
          }
        >
          <strong>{data.criticalAlerts} alerta(s) crítico(s)</strong> requerem atenção imediata — processos de dados podem estar em risco.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {data.kpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <KpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 0.5 }}>Saúde por Camada</Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 3 }}>
                Ingestão → Trusted → Analytics
              </Typography>
              {data.layerHealth.map((layer) => (
                <LayerHealthRow key={layer.layer} layer={layer} />
              ))}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Total Alertas</Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: data.activeAlerts > 0 ? '#F5A623' : theme.palette.success.main, fontWeight: 700 }}
                  >
                    {data.activeAlerts}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="overline" sx={{ color: theme.palette.text.secondary }}>Críticos</Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: data.criticalAlerts > 0 ? theme.palette.error.main : theme.palette.success.main, fontWeight: 700 }}
                  >
                    {data.criticalAlerts}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent
              sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}
            >
              <Typography variant="h5" sx={{ mb: 2, alignSelf: 'flex-start' }}>Saúde Geral</Typography>
              <HealthRing value={data.overallHealth} size={140} strokeWidth={10} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 2, textAlign: 'center' }}>
                Índice consolidado das três camadas de dados
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                {data.layerHealth.map((l) => (
                  <HealthRing key={l.layer} value={l.healthScore} size={60} strokeWidth={5} label={LAYER_LABELS[l.layer]} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
