import { useLocation, useNavigate } from "react-router-dom";
import type { Theme } from "@mui/material/styles";
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
import ShieldIcon from "@mui/icons-material/Shield";
import SearchIcon from "@mui/icons-material/Search";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useAppSelector } from "../../app/store";

const SIDEBAR_WIDTH = 256;

const mvpItems = [
  { path:"/dashboard",  label:"Dashboard",       icon:<DashboardIcon fontSize="small" /> },
  { path:"/score",      label:"Score Monitor",   icon:<QueryStatsIcon fontSize="small" /> },
  { path:"/alerts",     label:"Alertas",         icon:<NotificationsActiveIcon fontSize="small" />, badge:true },
  { path:"/batch",      label:"Batch Monitor",   icon:<StorageIcon fontSize="small" /> },
  { path:"/lineage",    label:"Rastreabilidade", icon:<AccountTreeIcon fontSize="small" /> },
];

const fase2Items = [
  { path:"/ingestion",     label:"Ingestion",        icon:<InputIcon fontSize="small" /> },
  { path:"/trusted",       label:"Trusted",          icon:<VerifiedUserIcon fontSize="small" /> },
  { path:"/action-matrix", label:"Matriz de Acao",   icon:<PlaylistAddCheckIcon fontSize="small" /> },
  { path:"/governance",    label:"Governanca",       icon:<GavelIcon fontSize="small" /> },
];

const agentItems = [
  { path:"/sentinela", label:"AG-01 Sentinela",  icon:<RadarIcon fontSize="small" />,     wsjf:"12.0" },
  { path:"/guardiao",  label:"AG-06 Guardiao",   icon:<ShieldIcon fontSize="small" />,    wsjf:"9.2" },
  { path:"/detetive",  label:"AG-02 Detetive",   icon:<SearchIcon fontSize="small" />,    wsjf:"6.6" },
  { path:"/auditor",   label:"AG-07 Auditor",    icon:<AssessmentIcon fontSize="small" />,wsjf:"5.1" },
  { path:"/guru",      label:"AG-03 Guru",       icon:<AutoAwesomeIcon fontSize="small" />,wsjf:"3.7" },
];

interface NavItem { path: string; label: string; icon: React.ReactElement; badge?: boolean; wsjf?: string; }

interface NavSectionProps {
  title: string;
  items: NavItem[];
  criticalAlerts: number;
  location: { pathname: string };
  navigate: (path: string) => void;
  theme: Theme;
}

function NavSection({ title, items, criticalAlerts, location, navigate, theme }: NavSectionProps) {
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
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <ListItemButton key={item.path} onClick={() => navigate(item.path)}
            aria-current={isActive ? "page" : undefined}
            sx={{
              mx:1, mb:0.4, borderRadius:2, px:1.5, py:0.6,
              backgroundColor: isActive ? activeBg : "transparent",
              border:`1px solid ${isActive ? activeBorder : "transparent"}`,
              "&:hover": { backgroundColor: isActive ? activeBg : hoverBg },
            }}>
            <ListItemIcon sx={{ minWidth:30, color: isActive ? theme.palette.primary.main : theme.palette.text.secondary }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label}
              primaryTypographyProps={{ variant:"body2", fontSize:"0.78rem", fontWeight: isActive ? 600 : 400,
                color: isActive ? theme.palette.primary.main : theme.palette.text.primary }} />
            {item.badge && criticalAlerts > 0 && (
              <Chip label={criticalAlerts} size="small" color="error"
                sx={{ height:18, fontSize:"0.62rem", fontWeight:700 }} />
            )}
            {item.wsjf && (
              <Typography variant="caption" sx={{
                fontSize:"0.58rem", color: isActive ? theme.palette.primary.main : theme.palette.text.disabled,
                fontWeight:600,
              }}>
                {item.wsjf}
              </Typography>
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
        overflowX:"hidden",
      },
    }}>
      {/* Brand */}
      <Box sx={{ p:2, pb:1.5 }}>
        <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
          <Box sx={{ width:30, height:30, borderRadius:1.5, flexShrink:0,
            background:"linear-gradient(135deg,#E31837 0%,#B8102A 100%)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Typography sx={{ color:"#fff", fontWeight:900, fontSize:"0.75rem" }}>EBV</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight:1.1, fontSize:"0.82rem" }}>Cockpit EBV</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize:"0.65rem" }}>Governanca de Dados</Typography>
          </Box>
        </Box>
        <Box sx={{ mt:1.5, p:1, borderRadius:1.5, bgcolor: isLight ? "rgba(0,47,108,0.04)" : "rgba(255,255,255,0.03)",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize:"0.68rem" }}>Saude Geral</Typography>
          <Typography variant="caption" fontWeight={700} sx={{ color:healthColor, fontSize:"0.68rem" }}>{overallHealth}%</Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: isLight ? "rgba(0,47,108,0.08)" : "rgba(255,255,255,0.05)" }} />

      <List dense sx={{ pt:0.5, pb:1, flex:1, overflowY:"auto", overflowX:"hidden" }}>
        <NavSection title="MVP" items={mvpItems} criticalAlerts={criticalAlerts} location={location} navigate={navigate} theme={theme} />
        <Box sx={{ my:0.5 }}>
          <Divider sx={{ borderColor: isLight ? "rgba(0,47,108,0.06)" : "rgba(255,255,255,0.04)" }} />
        </Box>
        <NavSection title="Fase 2 — Camadas" items={fase2Items} criticalAlerts={0} location={location} navigate={navigate} theme={theme} />
        <Box sx={{ my:0.5 }}>
          <Divider sx={{ borderColor: isLight ? "rgba(0,47,108,0.06)" : "rgba(255,255,255,0.04)" }} />
        </Box>
        <NavSection title="Agentes 4CO (WSJF)" items={agentItems} criticalAlerts={0} location={location} navigate={navigate} theme={theme} />
      </List>

      <Box sx={{ p:1.5, borderTop:`1px solid ${borderColor}` }}>
        <Typography variant="caption" color="text.disabled" display="block" sx={{ fontSize:"0.65rem" }}>Cockpit EBV v1.2 — 4CO Fase 2</Typography>
        <Typography variant="caption" color="text.disabled" sx={{ fontSize:"0.65rem" }}>Foursys 2026</Typography>
      </Box>
    </Drawer>
  );
}
