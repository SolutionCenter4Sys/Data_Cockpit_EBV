import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./presentation/layout/AppLayout";
import DashboardPage from "./presentation/pages/DashboardPage";
import DataCatalogPage from "./presentation/pages/DataCatalogPage";
import EventHubPage from "./presentation/pages/EventHubPage";
import DataQualityPage from "./presentation/pages/DataQualityPage";
import QueryBuilderPage from "./presentation/pages/QueryBuilderPage";
import RuleEnginePage from "./presentation/pages/RuleEnginePage";
import ConnectorsPage from "./presentation/pages/ConnectorsPage";
import ScoreMonitorPage from "./presentation/pages/ScoreMonitorPage";
import AlertsPage from "./presentation/pages/AlertsPage";
import BatchMonitorPage from "./presentation/pages/BatchMonitorPage";
import LineagePage from "./presentation/pages/LineagePage";
import IngestionPage from "./presentation/pages/IngestionPage";
import TrustedPage from "./presentation/pages/TrustedPage";
import ActionMatrixPage from "./presentation/pages/ActionMatrixPage";
import GovernancePage from "./presentation/pages/GovernancePage";
import SentinelaPage from "./presentation/pages/SentinelaPage";
import GuardiaoPage from "./presentation/pages/GuardiaoPage";
import DetetivePage from "./presentation/pages/DetetivePage";
import AuditorPage from "./presentation/pages/AuditorPage";
import GuruPage from "./presentation/pages/GuruPage";
import AnalyticsExpandidoPage from "./presentation/pages/AnalyticsExpandidoPage";
import SmartAlertsPage from "./presentation/pages/SmartAlertsPage";
import PreditivoPage from "./presentation/pages/PreditivoPage";
import ConselheiroPage from "./presentation/pages/ConselheiroPage";
import ComunicadorPage from "./presentation/pages/ComunicadorPage";
import ParkingLotPage from "./presentation/pages/ParkingLotPage";
import DiscoveryPage from "./presentation/pages/DiscoveryPage";


export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Jornada do Dado (Alex Granado) */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/discovery" element={<DiscoveryPage />} />
        <Route path="/lineage" element={<LineagePage />} />
        <Route path="/data-quality" element={<DataQualityPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/action-matrix" element={<ActionMatrixPage />} />
        {/* Motor & Regras */}
        <Route path="/query-builder" element={<QueryBuilderPage />} />
        <Route path="/rule-engine" element={<RuleEnginePage />} />
        <Route path="/connectors" element={<ConnectorsPage />} />
        {/* Monitoramento */}
        <Route path="/score" element={<ScoreMonitorPage />} />
        <Route path="/batch" element={<BatchMonitorPage />} />
        <Route path="/ingestion" element={<IngestionPage />} />
        <Route path="/trusted" element={<TrustedPage />} />
        <Route path="/governance" element={<GovernancePage />} />
        {/* Inteligência IA */}
        <Route path="/analytics-expandido" element={<AnalyticsExpandidoPage />} />
        <Route path="/smart-alerts" element={<SmartAlertsPage />} />
        <Route path="/preditivoia" element={<PreditivoPage />} />
        {/* Agentes */}
        <Route path="/sentinela" element={<SentinelaPage />} />
        <Route path="/guardiao" element={<GuardiaoPage />} />
        <Route path="/detetive" element={<DetetivePage />} />
        <Route path="/auditor" element={<AuditorPage />} />
        <Route path="/guru" element={<GuruPage />} />
        <Route path="/conselheiro" element={<ConselheiroPage />} />
        <Route path="/comunicador" element={<ComunicadorPage />} />
        <Route path="/parking-lot" element={<ParkingLotPage />} />
        {/* Hidden: legacy */}
        <Route path="/data-catalog" element={<DataCatalogPage />} />
        <Route path="/event-hub" element={<EventHubPage />} />
      </Route>
    </Routes>
  );
}
