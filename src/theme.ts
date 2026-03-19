import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    severity: {
      critical: string;
      high: string;
      medium: string;
      low: string;
      healthy: string;
    };
    surface: {
      dark: string;
      medium: string;
      light: string;
      card: string;
      overlay: string;
    };
  }
  interface PaletteOptions {
    severity?: {
      critical: string;
      high: string;
      medium: string;
      low: string;
      healthy: string;
    };
    surface?: {
      dark: string;
      medium: string;
      light: string;
      card: string;
      overlay: string;
    };
  }
}

export const cockpitTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#E31837',
      light: '#FF4D6A',
      dark: '#A81028',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0066CC',
      light: '#3385D6',
      dark: '#004D99',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#E31837',
      light: '#FF4D6A',
      dark: '#A81028',
    },
    warning: {
      main: '#F59E0B',
      light: '#FCD34D',
      dark: '#B45309',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    info: {
      main: '#0066CC',
      light: '#3385D6',
      dark: '#004D99',
    },
    background: {
      default: '#0B0F1A',
      paper: '#111827',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#9CA3AF',
      disabled: '#4B5563',
    },
    divider: 'rgba(255,255,255,0.08)',
    severity: {
      critical: '#E31837',
      high: '#F59E0B',
      medium: '#FBBF24',
      low: '#10B981',
      healthy: '#10B981',
    },
    surface: {
      dark: '#0B0F1A',
      medium: '#111827',
      light: '#1F2937',
      card: '#1A2235',
      overlay: 'rgba(11, 15, 26, 0.85)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    h4: { fontSize: '1.125rem', fontWeight: 600 },
    h5: { fontSize: '1rem', fontWeight: 600 },
    h6: { fontSize: '0.875rem', fontWeight: 600 },
    body1: { fontSize: '0.875rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#374151 transparent',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: '#374151', borderRadius: 3 },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1A2235',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1A2235',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          fontSize: '0.8125rem',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(227, 24, 55, 0.35)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.6875rem' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontSize: '0.8125rem',
          padding: '10px 16px',
        },
        head: {
          fontWeight: 600,
          color: '#9CA3AF',
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          backgroundColor: 'rgba(255,255,255,0.02)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)' },
        bar: { borderRadius: 4 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, border: '1px solid' },
        standardError: {
          backgroundColor: alpha('#E31837', 0.1),
          borderColor: alpha('#E31837', 0.3),
        },
        standardWarning: {
          backgroundColor: alpha('#F59E0B', 0.1),
          borderColor: alpha('#F59E0B', 0.3),
        },
        standardSuccess: {
          backgroundColor: alpha('#10B981', 0.1),
          borderColor: alpha('#10B981', 0.3),
        },
        standardInfo: {
          backgroundColor: alpha('#0066CC', 0.1),
          borderColor: alpha('#0066CC', 0.3),
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.24)' },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#374151',
          fontSize: '0.75rem',
          borderRadius: 6,
        },
      },
    },
  },
});
