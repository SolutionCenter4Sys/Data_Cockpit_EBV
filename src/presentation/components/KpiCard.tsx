import { Card, CardContent, Box, Typography, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import type { TrendDirection, SeverityLevel } from '../../domain/entities';

const SEVERITY_COLOR: Record<SeverityLevel, string> = {
  CRITICAL: '#E31837',
  HIGH: '#F5A623',
  MEDIUM: '#FBBF24',
  LOW: '#00873D',
  HEALTHY: '#00873D',
};

const SEVERITY_ALPHA: Record<SeverityLevel, string> = {
  CRITICAL: '1F',
  HIGH: '1E',
  MEDIUM: '1E',
  LOW: '18',
  HEALTHY: '18',
};

interface KpiCardProps {
  label: string;
  value: number | string;
  unit?: string;
  trend: TrendDirection;
  trendValue: string;
  severity: SeverityLevel;
  trendPreview?: Array<{ label: string; value: number }>;
}

const TrendIcon = ({ direction }: { direction: TrendDirection }) => {
  if (direction === 'UP') return <TrendingUpIcon sx={{ fontSize: 16 }} />;
  if (direction === 'DOWN') return <TrendingDownIcon sx={{ fontSize: 16 }} />;
  return <TrendingFlatIcon sx={{ fontSize: 16 }} />;
};

export default function KpiCard({
  label,
  value,
  unit,
  trend,
  trendValue,
  severity,
  trendPreview,
}: KpiCardProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const color = SEVERITY_COLOR[severity];
  const alpha = SEVERITY_ALPHA[severity];
  const borderAlpha = isLight ? '2A' : '40';

  return (
    <Card
      sx={{
        borderLeft: `3px solid ${color}${borderAlpha}`,
        height: '100%',
        backgroundColor: theme.palette.background.paper,
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isLight
            ? `0 6px 20px rgba(0,47,108,0.10), 0 0 0 1px ${color}30`
            : `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${color}${alpha}`,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography variant="overline" sx={{ color: theme.palette.text.secondary, mb: 1, display: 'block' }}>
          {label}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, mb: 1 }}>
          <Typography
            variant="h3"
            component="span"
            sx={{ color, fontWeight: 700, lineHeight: 1 }}
          >
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </Typography>
          {unit && (
            <Typography variant="body2" sx={{ color: theme.palette.text.disabled, mb: 0.25 }}>
              {unit}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color }}>
          <TrendIcon direction={trend} />
          <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
            {trendValue}
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
            vs. ontem
          </Typography>
        </Box>

        {trendPreview && trendPreview.length > 1 && (
          <Box sx={{ mt: 1.2, height: 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendPreview}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
