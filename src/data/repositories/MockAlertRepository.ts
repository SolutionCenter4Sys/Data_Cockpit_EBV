import type { IAlertRepository } from '../../domain/repositories/interfaces';
import type { ApiResponse, Alert, AlertRule } from '../../domain/entities';
import { MOCK_ALERTS, MOCK_ALERT_RULES } from '../mock/mockData';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let alertsState: Alert[] = [...MOCK_ALERTS];

export class MockAlertRepository implements IAlertRepository {
  async getAlerts(status?: Alert['status']): Promise<ApiResponse<Alert[]>> {
    await delay(500);
    const data = status ? alertsState.filter((a) => a.status === status) : alertsState;
    return { data, success: true, timestamp: new Date().toISOString() };
  }

  async getRules(): Promise<ApiResponse<AlertRule[]>> {
    await delay(400);
    return { data: MOCK_ALERT_RULES, success: true, timestamp: new Date().toISOString() };
  }

  async acknowledgeAlert(id: string): Promise<ApiResponse<Alert>> {
    await delay(300);
    alertsState = alertsState.map((a) =>
      a.id === id ? { ...a, status: 'ACKNOWLEDGED', acknowledgedAt: new Date().toISOString() } : a
    );
    const updated = alertsState.find((a) => a.id === id)!;
    return { data: updated, success: true, timestamp: new Date().toISOString() };
  }

  async resolveAlert(id: string): Promise<ApiResponse<Alert>> {
    await delay(300);
    alertsState = alertsState.map((a) =>
      a.id === id ? { ...a, status: 'RESOLVED', resolvedAt: new Date().toISOString() } : a
    );
    const updated = alertsState.find((a) => a.id === id)!;
    return { data: updated, success: true, timestamp: new Date().toISOString() };
  }
}
