import { useState } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Chip,
  Tooltip, Badge, CircularProgress, useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useAppSelector, useAppDispatch } from '../../app/store';
import { fetchDashboard } from '../../app/slices/dashboardSlice';
import { useThemeToggle } from '../../ThemeToggleContext';

interface TopBarProps {
  pageTitle: string;
  pageSubtitle?: string;
}

export default function TopBar({ pageTitle, pageSubtitle }: TopBarProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeToggle();
  const isLight = mode === 'light';

  const [refreshing, setRefreshing] = useState(false);
  const activeAlerts = useAppSelector((s) => s.alerts.alerts.filter((a) => a.status === 'OPEN').length);
  const lastRefreshed = useAppSelector((s) => s.dashboard.data?.lastRefreshed);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchDashboard());
    setTimeout(() => setRefreshing(false), 800);
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const iconBtnSx = {
    color: theme.palette.text.secondary,
    '&:hover': {
      color: theme.palette.text.primary,
      backgroundColor: isLight ? 'rgba(0,47,108,0.06)' : 'rgba(255,255,255,0.06)',
    },
  };

  const topBarBg = isLight ? '#FFFFFF' : '#0D1526';
  const topBarBorder = isLight ? 'rgba(0,47,108,0.09)' : 'rgba(255,255,255,0.06)';

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: topBarBg,
        borderBottom: `1px solid ${topBarBorder}`,
        boxShadow: isLight ? '0 1px 4px rgba(0,47,108,0.06)' : 'none',
      }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: '60px !important' }}>
        {/* Page title */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ color: theme.palette.text.primary, lineHeight: 1.2 }}>
            {pageTitle}
          </Typography>
          {pageSubtitle && (
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              {pageSubtitle}
            </Typography>
          )}
        </Box>

        {/* Live badge */}
        <Chip
          icon={
            <FiberManualRecordIcon
              sx={{
                fontSize: '10px !important',
                color: `${theme.palette.success.main} !important`,
                animation: 'topbarPulse 2s infinite',
                '@keyframes topbarPulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.35 },
                },
              }}
            />
          }
          label={`Atualizado ${formatTime(lastRefreshed)}`}
          size="small"
          sx={{
            backgroundColor: isLight
              ? 'rgba(0,135,61,0.07)'
              : 'rgba(16,185,129,0.10)',
            border: `1px solid ${isLight ? 'rgba(0,135,61,0.2)' : 'rgba(16,185,129,0.2)'}`,
            color: theme.palette.success.main,
            fontSize: '0.7rem',
            fontWeight: 600,
          }}
        />

        {/* Refresh */}
        <Tooltip title="Atualizar dados">
          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Atualizar dados"
            sx={iconBtnSx}
          >
            {refreshing ? (
              <CircularProgress size={18} sx={{ color: theme.palette.primary.main }} />
            ) : (
              <RefreshIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>

        {/* Alerts bell */}
        <Tooltip title={`${activeAlerts} alertas abertos`}>
          <IconButton
            size="small"
            aria-label={`${activeAlerts} alertas abertos`}
            sx={iconBtnSx}
          >
            <Badge badgeContent={activeAlerts} color="error" max={99}>
              <NotificationsIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip title={isLight ? 'Mudar para Dark Mode' : 'Mudar para Light Mode'}>
          <IconButton
            size="small"
            onClick={toggleTheme}
            aria-label={isLight ? 'Ativar dark mode' : 'Ativar light mode'}
            sx={{
              ...iconBtnSx,
              color: isLight ? '#F5A623' : '#9CA3AF',
              '&:hover': {
                color: isLight ? '#B45309' : '#F9FAFB',
                backgroundColor: isLight ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.06)',
              },
            }}
          >
            {isLight ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* User */}
        <Tooltip title="Usuário: Analista EBV">
          <IconButton
            size="small"
            aria-label="Menu do usuário"
            sx={{
              ...iconBtnSx,
              backgroundColor: isLight ? 'rgba(0,47,108,0.05)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isLight ? 'rgba(0,47,108,0.12)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <PersonOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
