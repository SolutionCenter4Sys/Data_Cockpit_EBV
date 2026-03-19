import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Chip, Tooltip, useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import StorageIcon from '@mui/icons-material/Storage';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useAppSelector } from '../../app/store';

const SIDEBAR_WIDTH = 240;

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
  { path: '/score', label: 'Score Monitor', icon: <QueryStatsIcon fontSize="small" /> },
  { path: '/alerts', label: 'Alertas', icon: <NotificationsActiveIcon fontSize="small" /> },
  { path: '/batch', label: 'Batch Monitor', icon: <StorageIcon fontSize="small" /> },
  { path: '/lineage', label: 'Rastreabilidade', icon: <AccountTreeIcon fontSize="small" /> },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const criticalAlerts = useAppSelector((s) => s.dashboard.data?.criticalAlerts ?? 0);
  const overallHealth = useAppSelector((s) => s.dashboard.data?.overallHealth ?? 0);

  const healthColor =
    overallHealth >= 80
      ? theme.palette.success.main
      : overallHealth >= 60
      ? theme.palette.warning.main
      : theme.palette.error.main;

  const sidebarBg = isLight ? '#FFFFFF' : '#0D1526';
  const borderColor = isLight ? 'rgba(0,47,108,0.09)' : 'rgba(255,255,255,0.06)';
  const activeBg = isLight ? 'rgba(227,24,55,0.07)' : 'rgba(227,24,55,0.12)';
  const activeBorder = isLight ? 'rgba(227,24,55,0.18)' : 'rgba(227,24,55,0.2)';
  const hoverBg = isLight ? 'rgba(0,47,108,0.04)' : 'rgba(255,255,255,0.04)';
  const healthBg = isLight ? 'rgba(0,47,108,0.04)' : 'rgba(255,255,255,0.03)';
  const footerColor = isLight ? theme.palette.text.disabled : '#4B5563';

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: sidebarBg,
          borderRight: `1px solid ${borderColor}`,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Brand */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box
            sx={{
              width: 32, height: 32, borderRadius: '8px',
              background: 'linear-gradient(135deg, #E31837, #002F6C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.7rem' }}>EBV</Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, lineHeight: 1.2 }}>
              Cockpit EBV
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Governança de Dados
            </Typography>
          </Box>
        </Box>

        {/* Health indicator */}
        <Box
          sx={{
            mt: 1.5, p: 1.5, borderRadius: 2,
            backgroundColor: healthBg,
            border: `1px solid ${borderColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            Saúde Geral
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: healthColor,
                boxShadow: `0 0 6px ${healthColor}`,
              }}
            />
            <Typography variant="body2" sx={{ color: healthColor, fontWeight: 700 }}>
              {overallHealth}%
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <Typography variant="overline" sx={{ color: theme.palette.text.disabled, px: 2.5, py: 1, display: 'block' }}>
          Módulos
        </Typography>
        <List dense disablePadding>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isAlerts = item.path === '/alerts';
            return (
              <Tooltip key={item.path} title="" placement="right">
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  aria-current={isActive ? 'page' : undefined}
                  sx={{
                    mx: 1, mb: 0.5, borderRadius: 2, px: 1.5,
                    backgroundColor: isActive ? activeBg : 'transparent',
                    border: `1px solid ${isActive ? activeBorder : 'transparent'}`,
                    '&:hover': {
                      backgroundColor: isActive ? activeBg : hoverBg,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{ minWidth: 36, color: isActive ? theme.palette.primary.main : theme.palette.text.secondary }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
                    }}
                  />
                  {isAlerts && criticalAlerts > 0 && (
                    <Chip
                      label={criticalAlerts}
                      size="small"
                      sx={{
                        height: 18, fontSize: '0.65rem', fontWeight: 700,
                        backgroundColor: theme.palette.primary.main,
                        color: '#fff', minWidth: 24,
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      {/* Footer */}
      <Divider sx={{ borderColor }} />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ color: footerColor, display: 'block', textAlign: 'center' }}>
          Cockpit EBV v1.0 — MVP
        </Typography>
        <Typography variant="caption" sx={{ color: footerColor, display: 'block', textAlign: 'center', opacity: 0.7 }}>
          Foursys © 2026
        </Typography>
      </Box>
    </Drawer>
  );
}
