import { Box, Typography, Chip, Paper, Grid, useTheme, Alert as MuiAlert, Divider } from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import BuildIcon from "@mui/icons-material/Build";
import LoopIcon from "@mui/icons-material/Loop";
import LockClockIcon from "@mui/icons-material/LockClock";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";

const agents = [
  {
    id:"AG-05", name:"Executor", subtitle:"Curador — Auto-Correção",
    wsjf:"2.8", phase:"Fase 3+",
    description:"Remediação autônoma com aprovação humana. Executa ações corretivas pré-aprovadas em resposta a incidentes identificados pelo Detetive e Guru. Documenta automaticamente cada ação tomada.",
    capabilities:[
      "Execucao de scripts de remediacão pre-aprovados",
      "Reprocessamento automatico de batch com aprovacao humana",
      "Rollback automatico de deploys em caso de anomalia",
      "Documentacao automatica de acoes (audit trail)",
    ],
    dependency:"AG-02 Detetive + AG-03 Guru + Biblioteca de acoes aprovadas",
    expectedImpact:"Taxa de auto-correcao de 30-50% dos incidentes",
    icon:<BuildIcon sx={{ fontSize:32 }} />,
  },
  {
    id:"AG-09", name:"Evolucionista de Regras", subtitle:"Adaptador — Self-Healing",
    wsjf:"2.2", phase:"Fase 3+",
    description:"Auto-ajuste de thresholds com base em padrões históricos. Aprende sazonalidade (ex: variações normais de segunda-feira) e elimina alert fatigue ajustando dinamicamente os limites de cada alerta.",
    capabilities:[
      "Ajuste automatico de thresholds com base em 90 dias de historico",
      "Aprendizado de sazonalidade (dia da semana, hora, fim de mes)",
      "Eliminacao progressiva de falsos positivos por cluster",
      "Sugestao de novas regras de governanca baseadas em incidentes reais",
    ],
    dependency:"AG-01 Sentinela + 90+ dias de dados historicos + aprovacao humana para mudancas de threshold",
    expectedImpact:"Reducao de 60-80% em falsos positivos; alert fatigue eliminado",
    icon:<LoopIcon sx={{ fontSize:32 }} />,
  },
];

const productItems = [
  {
    id:"EP-13", name:"Orquestracao Avancada de Acoes", wsjf:"1.2",
    description:"Automacao completa: trigger → decisao → acao → feedback (self-healing parcial). Requer maturidade dos agentes AG-05 e AG-09 ja implantados.",
    dependency:"AG-05 Executor + AG-09 Evolucionista operacionais por min. 3 meses",
    icon:<EmojiObjectsIcon sx={{ fontSize:24 }} />,
  },
  {
    id:"EP-14", name:"Integracao com Data Fabric", wsjf:"0.7",
    description:"Conectar o Cockpit a uma camada de Data Fabric corporativo para visao transversal. Dependencia externa — fora do controle da equipe EBV.",
    dependency:"Plataforma de Data Fabric disponivel e APIs documentadas",
    icon:<LockClockIcon sx={{ fontSize:24 }} />,
  },
];

export default function ParkingLotPage() {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";

  return (
    <Box>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:3 }}>
        <ScienceIcon sx={{ color:theme.palette.primary.main, fontSize:28 }} />
        <Box>
          <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
            <Typography variant="h5" fontWeight={700}>Parking Lot — Fase 3+ e Futuro</Typography>
            <Chip label="Planejado" color="default" size="small" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Agentes e epicos de alto esforco com dependencias externas — priorizados apos estabilidade da Fase 3
          </Typography>
        </Box>
      </Box>

      <MuiAlert severity="info" sx={{ mb:3 }}>
        <strong>Criterio de entrada:</strong> Estes itens sao ativados quando a Fase 3 estiver em operacao por pelo menos 3 meses e os agentes AG-04, AG-08 estiverem com acuracia maior que 85%.
      </MuiAlert>

      {/* Agents */}
      <Typography variant="h6" fontWeight={700} mb={2}>Agentes 4CO — Parking Lot</Typography>
      <Grid container spacing={2} mb={4}>
        {agents.map((agent) => (
          <Grid item xs={12} md={6} key={agent.id}>
            <Paper sx={{ borderRadius:2, p:2.5, height:"100%",
              border:`1px solid ${isLight ? "rgba(0,47,108,0.10)" : "rgba(255,255,255,0.08)"}` }}>
              <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:2 }}>
                <Box sx={{ color: isLight ? "rgba(0,47,108,0.4)" : "rgba(255,255,255,0.3)" }}>
                  {agent.icon}
                </Box>
                <Box>
                  <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>{agent.id} — {agent.name}</Typography>
                    <Chip label={agent.phase} size="small" />
                    <Chip label={`WSJF ${agent.wsjf}`} size="small" variant="outlined" />
                  </Box>
                  <Typography variant="caption" color="text.secondary">{agent.subtitle}</Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" mb={1.5}>{agent.description}</Typography>

              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform:"uppercase", fontSize:"0.62rem" }}>
                Capacidades
              </Typography>
              <Box component="ul" sx={{ pl:2, mt:0.5, mb:1.5 }}>
                {agent.capabilities.map((cap, i) => (
                  <Box key={i} component="li">
                    <Typography variant="caption" color="text.secondary">{cap}</Typography>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my:1 }} />
              <Box sx={{ display:"flex", gap:1, flexWrap:"wrap" }}>
                <Box sx={{ flex:1 }}>
                  <Typography variant="caption" fontWeight={700} color="warning.main" sx={{ fontSize:"0.62rem", textTransform:"uppercase" }}>Dependencia</Typography>
                  <Typography variant="caption" display="block" color="text.secondary">{agent.dependency}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="success.main" sx={{ fontSize:"0.62rem", textTransform:"uppercase" }}>Impacto Esperado</Typography>
                  <Typography variant="caption" display="block" color="success.main" fontWeight={600}>{agent.expectedImpact}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Product epics */}
      <Typography variant="h6" fontWeight={700} mb={2}>Epicos de Produto — Parking Lot</Typography>
      <Grid container spacing={2}>
        {productItems.map((item) => (
          <Grid item xs={12} md={6} key={item.id}>
            <Paper sx={{ borderRadius:2, p:2,
              border:`1px solid ${isLight ? "rgba(0,47,108,0.08)" : "rgba(255,255,255,0.06)"}` }}>
              <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:1 }}>
                <Box sx={{ color: isLight ? "rgba(0,47,108,0.35)" : "rgba(255,255,255,0.25)" }}>{item.icon}</Box>
                <Typography variant="subtitle2" fontWeight={700}>{item.id} — {item.name}</Typography>
                <Chip label={`WSJF ${item.wsjf}`} size="small" variant="outlined" sx={{ ml:"auto" }} />
              </Box>
              <Typography variant="body2" color="text.secondary" mb={1}>{item.description}</Typography>
              <Box sx={{ display:"flex", alignItems:"center", gap:0.5 }}>
                <LockClockIcon sx={{ fontSize:12, color:"warning.main" }} />
                <Typography variant="caption" color="warning.main">{item.dependency}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
