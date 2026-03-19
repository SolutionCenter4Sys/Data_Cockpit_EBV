import { Box, Typography, useTheme } from '@mui/material';
import type { ProcessStatus } from '../../domain/entities';

const STATUS_CONFIG: Record<ProcessStatus, { label: string; darkColor: string; lightColor: string }> = {
  SUCCESS: { label: 'Sucesso',    darkColor: '#10B981', lightColor: '#00873D' },
  RUNNING: { label: 'Executando', darkColor: '#3399FF', lightColor: '#0066CC' },
  FAILED:  { label: 'Falhou',     darkColor: '#E31837', lightColor: '#B8102A' },
  WARNING: { label: 'Atenção',    darkColor: '#F5A623', lightColor: '#92610A' },
  PENDING: { label: 'Pendente',   darkColor: '#6B7280', lightColor: '#4A6380' },
};

interface StatusBadgeProps {
  status: ProcessStatus;
  showDot?: boolean;
}

export default function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const cfg = STATUS_CONFIG[status];
  const color = isLight ? cfg.lightColor : cfg.darkColor;
  const isRunning = status === 'RUNNING';

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      {showDot && (
        <Box
          sx={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 5px ${color}`,
            ...(isRunning && {
              animation: 'statusPulse 1.5s ease-in-out infinite',
              '@keyframes statusPulse': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.5, transform: 'scale(0.8)' },
              },
            }),
          }}
        />
      )}
      <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
        {cfg.label}
      </Typography>
    </Box>
  );
}
