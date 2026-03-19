import { Box, Typography, useTheme } from '@mui/material';

interface HealthRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function HealthRing({ value, size = 80, strokeWidth = 7, label }: HealthRingProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const getColor = (v: number) =>
    v >= 80
      ? (isLight ? '#00873D' : '#10B981')
      : v >= 60
      ? theme.palette.warning.main
      : theme.palette.error.main;

  const trackColor = isLight ? 'rgba(0,47,108,0.08)' : 'rgba(255,255,255,0.06)';
  const color = getColor(value);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
          <circle
            cx={center} cy={center} r={radius} fill="none"
            stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography
            variant="caption"
            sx={{ color, fontWeight: 700, fontSize: size > 70 ? '0.875rem' : '0.75rem' }}
          >
            {value}%
          </Typography>
        </Box>
      </Box>
      {label && (
        <Typography
          variant="caption"
          sx={{ color: theme.palette.text.secondary, textAlign: 'center', maxWidth: size + 16 }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );
}
