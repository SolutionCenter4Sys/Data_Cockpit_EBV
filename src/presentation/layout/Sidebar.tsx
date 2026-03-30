import { useLocation, useNavigate } from "react-router-dom";
import type { Theme } from "@mui/material/styles";
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Chip, useTheme,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SearchIcon from "@mui/icons-material/Search";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import BuildIcon from "@mui/icons-material/Build";
import RuleIcon from "@mui/icons-material/Rule";
import CableIcon from "@mui/icons-material/Cable";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import StorageIcon from "@mui/icons-material/Storage";
import InputIcon from "@mui/icons-material/Input";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import GavelIcon from "@mui/icons-material/Gavel";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import PsychologyIcon from "@mui/icons-material/Psychology";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import RadarIcon from "@mui/icons-material/Radar";
import ShieldIcon from "@mui/icons-material/Shield";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ForumIcon from "@mui/icons-material/Forum";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ScienceIcon from "@mui/icons-material/Science";
import StarIcon from "@mui/icons-material/Star";
import { useAppSelector } from "../../app/store";

const SIDEBAR_WIDTH = 256;

const jornadaDadoItems = [
  { path:"/dashboard",      label:"Dashboard Executivo",   icon:<DashboardIcon fontSize="small" />,       isNew: true },
  { path:"/discovery",      label:"Discovery",             icon:<SearchIcon fontSize="small" />,           isNew: true },
  { path:"/lineage",        label:"Linhagem de Dados",     icon:<AccountTreeIcon fontSize="small" />,      isNew: true },
  { path:"/observability",  label:"Observabilidade",       icon:<VisibilityIcon fontSize="small" />,       isNew: true },
  { path:"/data-quality",   label:"Qualidade de Dados",    icon:<FactCheckIcon fontSize="small" />,        isNew: true },
  { path:"/alerts",         label:"Central de Alertas",    icon:<NotificationsActiveIcon fontSize="small" />, badge:true, isNew: true },
  { path:"/action-matrix",  label:"Matriz de Acionamento", icon:<PlaylistAddCheckIcon fontSize="small" />, isNew: true },
];

const motorItems = [
  { path:"/query-builder", label:"Query Builder",            icon:<BuildIcon fontSize="small" /> },
  { path:"/rule-engine",   label:"Cadastro de Regras",       icon:<RuleIcon fontSize="small" /> },
  { path:"/connectors",    label:"Conectores & Credenciais", icon:<CableIcon fontSize="small" /> },
];

const monitoramentoItems = [
  { path:"/score",     label:"Score Monitor",  icon:<QueryStatsIcon fontSize="small" /> },
  { path:"/batch",     label:"Batch Monitor",  icon:<StorageIcon fontSize="small" /> },
  { path:"/ingestion", label:"Camada Ingestão", icon:<InputIcon fontSize="small" /> },
  { path:"/trusted",   label:"Camada Trusted",  icon:<VerifiedUserIcon fontSize="small" /> },
  { path:"/governance",label:"Governança",       icon:<GavelIcon fontSize="small" /> },
];

const iaItems = [
  { path:"/analytics-expandido", label:"Analytics 1000+", icon:<AnalyticsIcon fontSize="small" /> },
  { path:"/smart-alerts",       label:"Alertas IA",       icon:<PsychologyIcon fontSize="small" /> },
  { path:"/preditivoia",        label:"IA Preditiva",     icon:<TrendingUpIcon fontSize="small" /> },
];

const agentItems = [
  { path:"/sentinela",  label:"AG-01 Sentinela",   icon:<RadarIcon fontSize="small" />,       wsjf:"12.0" },
  { path:"/guardiao",   label:"AG-06 Guardião",    icon:<ShieldIcon fontSize="small" />,      wsjf:"9.2" },
  { path:"/detetive",   label:"AG-02 Detetive",    icon:<SearchIcon fontSize="small" />,      wsjf:"6.6" },
  { path:"/auditor",    label:"AG-07 Auditor",     icon:<AssessmentIcon fontSize="small" />,  wsjf:"5.1" },
  { path:"/guru",       label:"AG-03 Guru",        icon:<AutoAwesomeIcon fontSize="small" />, wsjf:"3.7" },
  { path:"/conselheiro",label:"AG-08 Conselheiro", icon:<AccessTimeIcon fontSize="small" />,  wsjf:"3.9" },
  { path:"/comunicador",label:"AG-04 Comunicador", icon:<ForumIcon fontSize="small" />,       wsjf:"3.3" },
];

const parkingItems = [
  { path:"/parking-lot", label:"AG-05 + AG-09 (Planejado)", icon:<ScienceIcon fontSize="small" /> },
];

interface NavItem { path: string; label: string; icon: React.ReactElement; badge?: boolean; wsjf?: string; isNew?: boolean; }

interface NavSectionProps {
  title: string;
  items: NavItem[];
  criticalAlerts: number;
  location: { pathname: string };
  navigate: (path: string) => void;
  theme: Theme;
  highlighted?: boolean;
}

function NavSection({ title, items, criticalAlerts, location, navigate, theme, highlighted }: NavSectionProps) {
  const isLight = theme.palette.mode === "light";
  const activeBg = isLight ? "rgba(227,24,55,0.07)" : "rgba(227,24,55,0.12)";
  const activeBorder = isLight ? "rgba(227,24,55,0.18)" : "rgba(227,24,55,0.20)";
  const hoverBg = isLight ? "rgba(0,47,108,0.04)" : "rgba(255,255,255,0.04)";
  const highlightBg = isLight ? "rgba(227,24,55,0.03)" : "rgba(227,24,55,0.04)";

  return (
    <Box sx={highlighted ? { bgcolor: highlightBg, borderRadius: 1, mx: 0.5, py: 0.5 } : undefined}>
      <Typography variant="caption" fontWeight={700} sx={{
        px:2, pt:1.5, pb:0.5, display:"flex", alignItems:"center", gap:0.5,
        color: highlighted ? (isLight ? "rgba(227,24,55,0.75)" : "rgba(227,24,55,0.65)") : (isLight ? "rgba(0,47,108,0.45)" : "rgba(255,255,255,0.35)"),
        textTransform:"uppercase", letterSpacing:"0.08em", fontSize:"0.65rem",
      }}>
        {highlighted && <StarIcon sx={{ fontSize: "0.7rem" }} />}
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
            {item.isNew && !isActive && (
              <Chip label="NOVO" size="small" color="error" variant="outlined"
                sx={{ height:16, fontSize:"0.5rem", fontWeight:700, ml:0.5 }} />
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
    </Box>
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

  const dividerSx = { borderColor: isLight ? "rgba(0,47,108,0.06)" : "rgba(255,255,255,0.04)" };

  return (
    <Drawer variant="permanent" sx={{
      width:SIDEBAR_WIDTH, flexShrink:0,
      "& .MuiDrawer-paper": {
        width:SIDEBAR_WIDTH, boxSizing:"border-box",
        backgroundColor:sidebarBg, borderRight:`1px solid ${borderColor}`,
        overflowX:"hidden",
      },
    }}>
      <Box sx={{ p:2, pb:1.5 }}>
        <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
          <Box sx={{ width:30, height:30, borderRadius:1.5, flexShrink:0,
            background:"linear-gradient(135deg,#E31837 0%,#B8102A 100%)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Typography sx={{ color:"#fff", fontWeight:900, fontSize:"0.75rem" }}>EBV</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight:1.1, fontSize:"0.82rem" }}>Cockpit EBV</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize:"0.65rem" }}>Monitoramento de Dados</Typography>
          </Box>
        </Box>
        <Box sx={{ mt:1.5, p:1, borderRadius:1.5, bgcolor: isLight ? "rgba(0,47,108,0.04)" : "rgba(255,255,255,0.03)",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize:"0.68rem" }}>Saúde Geral</Typography>
          <Typography variant="caption" fontWeight={700} sx={{ color:healthColor, fontSize:"0.68rem" }}>{overallHealth}%</Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: isLight ? "rgba(0,47,108,0.08)" : "rgba(255,255,255,0.05)" }} />

      <List dense sx={{ pt:0.5, pb:1, flex:1, overflowY:"auto", overflowX:"hidden" }}>
        <NavSection title="Jornada do Dado" items={jornadaDadoItems} criticalAlerts={criticalAlerts} location={location} navigate={navigate} theme={theme} highlighted />
        <Box sx={{ my:0.5 }}><Divider sx={dividerSx} /></Box>
        <NavSection title="Motor & Regras" items={motorItems} criticalAlerts={0} location={location} navigate={navigate} theme={theme} />
        <Box sx={{ my:0.5 }}><Divider sx={dividerSx} /></Box>
        <NavSection title="Monitoramento" items={monitoramentoItems} criticalAlerts={0} location={location} navigate={navigate} theme={theme} />
        <Box sx={{ my:0.5 }}><Divider sx={dividerSx} /></Box>
        <NavSection title="Inteligência IA" items={iaItems} criticalAlerts={0} location={location} navigate={navigate} theme={theme} />
        <Box sx={{ my:0.5 }}><Divider sx={dividerSx} /></Box>
        <NavSection title="Agentes 4CO (WSJF)" items={agentItems} criticalAlerts={0} location={location} navigate={navigate} theme={theme} />
        <Box sx={{ my:0.5 }}><Divider sx={dividerSx} /></Box>
        <NavSection title="Parking Lot" items={parkingItems} criticalAlerts={0} location={location} navigate={navigate} theme={theme} />
      </List>

      <Box sx={{ p:1.5, borderTop:`1px solid ${borderColor}` }}>
        <Typography variant="caption" color="text.disabled" display="block" sx={{ fontSize:"0.65rem" }}>Cockpit EBV v4.0 — POT8436</Typography>
        <Typography variant="caption" color="text.disabled" sx={{ fontSize:"0.65rem" }}>Foursys 4CO 2026</Typography>
      </Box>
    </Drawer>
  );
}
