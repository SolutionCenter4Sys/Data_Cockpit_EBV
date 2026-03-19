import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './presentation/layout/AppLayout';
import DashboardPage from './presentation/pages/DashboardPage';
import ScoreMonitorPage from './presentation/pages/ScoreMonitorPage';
import AlertsPage from './presentation/pages/AlertsPage';
import BatchMonitorPage from './presentation/pages/BatchMonitorPage';
import LineagePage from './presentation/pages/LineagePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="score" element={<ScoreMonitorPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="batch" element={<BatchMonitorPage />} />
        <Route path="lineage" element={<LineagePage />} />
      </Route>
    </Routes>
  );
}
