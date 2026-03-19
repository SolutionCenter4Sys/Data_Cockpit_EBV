import { Chip, useTheme } from '@mui/material';
import type { SeverityLevel } from '../../domain/entities';

const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; color: string; bgDark: string; bgLight: string; borderDark: string; borderLight: string }> = {
  CRITICAL: { label: 'CRÍTICO', color: '#E31837', bgDark: 'rgba(227,24,55,0.12)', bgLight: 'rgba(227,24,55,0.08)', borderDark: 'rgba(227,24,55,0.30)', borderLight: 'rgba(227,24,55,0.22)' },
  HIGH:     { label: 'ALTO',    color: '#F5A623', bgDark: 'rgba(245,166,35,0.12)', bgLight: 'rgba(245,166,35,0.10)', borderDark: 'rgba(245,166,35,0.30)', borderLight: 'rgba(245,166,35,0.25)' },
  MEDIUM:   { label: 'MÉDIO',   color: '#FBBF24', bgDark: 'rgba(251,191,36,0.12)', bgLight: 'rgba(251,191,36,0.10)', borderDark: 'rgba(251,191,36,0.30)', borderLight: 'rgba(251,191,36,0.25)' },
  LOW:      { label: 'BAIXO',   color: '#00873D', bgDark: 'rgba(16,185,129,0.12)', bgLight: 'rgba(0,135,61,0.08)',   borderDark: 'rgba(16,185,129,0.30)', borderLight: 'rgba(0,135,61,0.22)' },
  HEALTHY:  { label: 'SAUDÁVEL',color: '#00873D', bgDark: 'rgba(16,185,129,0.12)', bgLight: 'rgba(0,135,61,0.08)',   borderDark: 'rgba(16,185,129,0.30)', borderLight: 'rgba(0,135,61,0.22)' },
};

interface SeverityChipProps {
  severity: SeverityLevel;
  size?: 'small' | 'medium';
}

export default function SeverityChip({ severity, size = 'small' }: SeverityChipProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const cfg = SEVERITY_CONFIG[severity];

  return (
    <Chip
      label={cfg.label}
      size={size}
      sx={{
        backgroundColor: isLight ? cfg.bgLight : cfg.bgDark,
        color: cfg.color,
        border: `1px solid ${isLight ? cfg.borderLight : cfg.borderDark}`,
        fontWeight: 700,
        fontSize: size === 'small' ? '0.65rem' : '0.75rem',
        height: size === 'small' ? 20 : 24,
      }}
    />
  );
}
