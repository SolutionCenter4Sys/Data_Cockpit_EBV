import { useLocation, useNavigate } from "react-router-dom";
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Chip, useTheme,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import StorageIcon from "@mui/icons-material/Storage";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import InputIcon from "@mui/icons-material/Input";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import GavelIcon from "@mui/icons-material/Gavel";
import RadarIcon from "@mui/icons-material/Radar";
import { useAppSelector } from "../../app/store";

const SIDEBAR_WIDTH = 252;

const mvpItems = [
  { path:"/dashboard",  label:"Dashboard",      icon:<DashboardIcon fontSize="small" /> },
  { path:"/score",      label:"Score Monitor",  icon:<QueryStatsIcon fontSize="small" /> },
  { path:"/alerts",     label:"Alertas",        icon:<NotificationsActiveIcon fontSize="small" />, badge:true },
  { path:"/batch",      label:"Batch Monitor",  icon:<StorageIcon fontSize="small" /> },
  { path:"/lineage",    label:"Rastreabilidade",icon:<AccountTreeIcon fontSize="small" /> },
];

const fase2Items = [
  { path:"/ingestion",     label:"Ingestion",         icon:<InputIcon fontSize="small" /> },
  { path:"/trusted",       label:"Trusted",           icon:<VerifiedUserIcon fontSize="small" /> },
  { path:"/action-matrix", label:"Matriz de Acao",    icon:<PlaylistAddCheckIcon fontSize="small" /> },
  { path:"/governance",    label:"Governanca",        icon:<GavelIcon fontSize="small" /> },
];

const agentItems = [
  { path:"/sentinela", label:"AG-01 Sentinela", icon:<RadarIcon fontSize="small" /> },
];

function NavSection({ title, items, criticalAlerts, location, navigate, theme }: any) {
  const isLight = theme.palette.mode === "light";
  const activeBg = isLight ? "rgba(227,24,55,0.07)" : "rgba(227,24,55,0.12)";
  const activeBorder = isLight ? "rgba(227,24,55,0.18)" : "rgba(227,24,55,0.20)";
  const hoverBg = isLight ? "rgba(0,47,108,0.04)" : "rgba(255,255,255,0.04)";

  return (
    <>
      <Typography variant="caption" fontWeight={700} sx={{
        px:2, pt:1.5, pb:0.5, display:"block",
        color: isLight ? "rgba(0,47,108,0.45)" : "rgba(255,255,255,0.35)",
        textTransform:"uppercase", letterSpacing:"0.08em", fontSize:"0.65rem",
      }}>
        {title}
      </Typography>
      {items.map((item: any) => {
        const isActive = location.pathname === item.path;
        return (
          <ListItemButton key={item.path} onClick={() => navigate(item.path)}
            aria-current={isActive ? "page" : undefined}
            sx={{
              mx:1, mb:0.4, borderRadius:2, px:1.5, py:0.7,
              backgroundColor: isActive ? activeBg : "transparent",
              border:`1px solid ${isActive ? activeBorder : "transparent"}`,
              "&:hover": { backgroundColor: isActive ? activeBg : hoverBg },
            }}>
            <ListItemIcon sx={{ minWidth:32, color: isActive ? theme.palette.primary.main : theme.palette.text.secondary }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label}
              primaryTypographyProps={{ variant:"body2", fontWeight: isActive ? 600 : 400,
                color: isActive ? theme.palette.primary.main : theme.palette.text.primary }} />
            {item.badge && criticalAlerts > 0 && (
              <Chip label={criticalAlerts} size="small" color="error"
                sx={{ height:18, fontSize:"0.65rem", fontWeight:700 }} />
            )}
          </ListItemButton>
        );
      })}
    </>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const criticalAlerts = useAppSelector((s) => s.dashboard.data?.criticalAlerts ?? 0);
  const overallHealth = useAppSelector((s) => s.dashboard.data?.overallHealth ?? 0);
  const sidebarBg = isLight ? "#FFFFFF" : "#0D1526";
  const borderColor = isLight ? "rgba(0,47,108,0.09)" : "rgba(255,255,255,0.06)";
  const healthColor = overallHealth >= 80 ? theme.palette.success.main
    : overallHealth >= 60 ? theme.palette.warning.main : theme.palette.error.main;

  return (
    <Drawer variant="permanent" sx={{
      width:SIDEBAR_WIDTH, flexShrink:0,
      "& .MuiDrawer-paper": {
        width:SIDEBAR_WIDTH, boxSizing:"border-box",
        backgroundColor:sidebarBg, borderRight:`1px solid ${borderColor}`,
      },
    }}>
      {/* Brand */}
      <Box sx={{ p:2.5, pb:1.5 }}>
        <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
          <Box sx={{ width:32, height:32, borderRadius:1.5,
            background:"linear-gradient(135deg,#E31837 0%,#B8102A 100%)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Typography sx={{ color:"#fff", fontWeight:900, fontSize:"0.8rem" }}>EBV</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight:1.1 }}>Cockpit EBV</Typography>
            <Typography variant="caption" color="text.secondary">Governanca de Dados</Typography>
          </Box>
        </Box>
        {/* Health pill */}
        <Box sx={{ mt:1.5, p:1, borderRadius:1.5, bgcolor: isLight ? "rgba(0,47,108,0.04)" : "rgba(255,255,255,0.03)",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Typography variant="caption" color="text.secondary">Saude Geral</Typography>
          <Typography variant="caption" fontWeight={700} sx={{ color:healthColor }}>{overallHealth}%</Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: isLight ? "rgba(0,47,108,0.08)" : "rgba(255,255,255,0.05)" }} />

      <List dense sx={{ pt:1, pb:1, flex:1, overflowY:"auto" }}>
        <NavSection title="MVP" items={mvpItems} criticalAlerts={criticalAlerts} location={location} navigate={navigate} theme={theme} />
        <Box sx={{ my:0.5 }}>
          <Divider sx={{ borderColor: isLight ? "rgba(0,47,108,0.06)" : "rgba(255,255,255,0.04)" }} />
        </Box>
        <NavSection title="Fase 2 — Camadas" items={fase2Items} criticalAlerts={0} location={location} navigate={navigate} theme={theme} />
        <Box sx={{ my:0.5 }}>
          <Divider sx={{ borderColor: isLight ? "rgba(0,47,108,0.06)" : "rgba(255,255,255,0.04)" }} />
        </Box>
        <NavSection title="Agentes IA (4CO)" items={agentItems} criticalAlerts={0} location={location} navigate={navigate} theme={theme} />
      </List>

      <Box sx={{ p:2, borderTop:`1px solid ${borderColor}` }}>
        <Typography variant="caption" color="text.disabled" display="block">Cockpit EBV v1.1 — Fase 2</Typography>
        <Typography variant="caption" color="text.disabled">Foursys © 2026</Typography>
      </Box>
    </Drawer>
  );
}
