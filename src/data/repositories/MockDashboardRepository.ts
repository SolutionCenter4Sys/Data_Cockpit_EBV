import type { IDashboardRepository } from '../../domain/repositories/interfaces';
import type { ApiResponse, DashboardSummary } from '../../domain/entities';
import { MOCK_DASHBOARD_SUMMARY } from '../mock/mockData';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class MockDashboardRepository implements IDashboardRepository {
  async getSummary(): Promise<ApiResponse<DashboardSummary>> {
    await delay(600);
    return {
      data: { ...MOCK_DASHBOARD_SUMMARY, lastRefreshed: new Date().toISOString() },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }
}
