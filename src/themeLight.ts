import { createTheme, alpha } from '@mui/material/styles';

export const cockpitThemeLight = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#E31837',
      light: '#FF4D6A',
      dark: '#B8102A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#002F6C',
      light: '#1A5FAA',
      dark: '#001F4A',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#E31837',
      light: '#FF4D6A',
      dark: '#B8102A',
    },
    warning: {
      main: '#F5A623',
      light: '#FCD34D',
      dark: '#B45309',
    },
    success: {
      main: '#00873D',
      light: '#00C875',
      dark: '#005C2A',
    },
    info: {
      main: '#0066CC',
      light: '#3399FF',
      dark: '#004D99',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#002F6C',
      secondary: '#4A6380',
      disabled: '#9EB0C5',
    },
    divider: 'rgba(0,47,108,0.10)',
    severity: {
      critical: '#E31837',
      high: '#F5A623',
      medium: '#FBBF24',
      low: '#00873D',
      healthy: '#00873D',
    },
    surface: {
      dark: '#002F6C',
      medium: '#F0F3F8',
      light: '#F8FAFC',
      card: '#FFFFFF',
      overlay: 'rgba(245,247,250,0.95)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#002F6C' },
    h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#002F6C' },
    h3: { fontSize: '1.25rem', fontWeight: 600, color: '#002F6C' },
    h4: { fontSize: '1.125rem', fontWeight: 600, color: '#002F6C' },
    h5: { fontSize: '1rem', fontWeight: 600, color: '#002F6C' },
    h6: { fontSize: '0.875rem', fontWeight: 600, color: '#002F6C' },
    body1: { fontSize: '0.875rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    overline: {
      fontSize: '0.6875rem', fontWeight: 600,
      letterSpacing: '0.08em', textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#C9D6E3 transparent',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: '#C9D6E3', borderRadius: 3 },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0,47,108,0.08)',
          boxShadow: '0 1px 8px rgba(0,47,108,0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0,47,108,0.08)',
          borderRadius: 12,
          boxShadow: '0 1px 8px rgba(0,47,108,0.06)',
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
          '&:hover': { boxShadow: '0 4px 12px rgba(227, 24, 55, 0.25)' },
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
          borderBottom: '1px solid rgba(0,47,108,0.07)',
          fontSize: '0.8125rem',
          padding: '10px 16px',
        },
        head: {
          fontWeight: 600,
          color: '#4A6380',
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          backgroundColor: '#F0F3F8',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, backgroundColor: 'rgba(0,47,108,0.08)' },
        bar: { borderRadius: 4 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, border: '1px solid' },
        standardError: {
          backgroundColor: alpha('#E31837', 0.07),
          borderColor: alpha('#E31837', 0.25),
          color: '#B8102A',
        },
        standardWarning: {
          backgroundColor: alpha('#F5A623', 0.08),
          borderColor: alpha('#F5A623', 0.3),
          color: '#92610A',
        },
        standardSuccess: {
          backgroundColor: alpha('#00873D', 0.07),
          borderColor: alpha('#00873D', 0.25),
          color: '#005C2A',
        },
        standardInfo: {
          backgroundColor: alpha('#0066CC', 0.07),
          borderColor: alpha('#0066CC', 0.25),
          color: '#004D99',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'rgba(0,47,108,0.2)' },
            '&:hover fieldset': { borderColor: 'rgba(0,47,108,0.4)' },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#002F6C',
          color: '#FFFFFF',
          fontSize: '0.75rem',
          borderRadius: 6,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#002F6C',
          borderBottom: '1px solid rgba(0,47,108,0.10)',
          boxShadow: '0 1px 4px rgba(0,47,108,0.08)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(0,47,108,0.08)' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: 'rgba(0,47,108,0.025)' },
        },
      },
    },
  },
});
