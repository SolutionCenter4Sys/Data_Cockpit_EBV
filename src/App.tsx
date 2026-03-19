import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./presentation/layout/AppLayout";
import DashboardPage from "./presentation/pages/DashboardPage";
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

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/score" element={<ScoreMonitorPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/batch" element={<BatchMonitorPage />} />
        <Route path="/lineage" element={<LineagePage />} />
        <Route path="/ingestion" element={<IngestionPage />} />
        <Route path="/trusted" element={<TrustedPage />} />
        <Route path="/action-matrix" element={<ActionMatrixPage />} />
        <Route path="/governance" element={<GovernancePage />} />
        <Route path="/sentinela" element={<SentinelaPage />} />
        <Route path="/guardiao" element={<GuardiaoPage />} />
        <Route path="/detetive" element={<DetetivePage />} />
        <Route path="/auditor" element={<AuditorPage />} />
        <Route path="/guru" element={<GuruPage />} />
        <Route path="/analytics-expandido" element={<AnalyticsExpandidoPage />} />
        <Route path="/smart-alerts" element={<SmartAlertsPage />} />
        <Route path="/preditivoia" element={<PreditivoPage />} />
        <Route path="/conselheiro" element={<ConselheiroPage />} />
        <Route path="/comunicador" element={<ComunicadorPage />} />
        <Route path="/parking-lot" element={<ParkingLotPage />} />
      </Route>
    </Routes>
  );
}
