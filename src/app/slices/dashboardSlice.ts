import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { DashboardSummary } from '../../domain/entities';
import { MockDashboardRepository } from '../../data/repositories/MockDashboardRepository';

const repo = new MockDashboardRepository();

export const fetchDashboard = createAsyncThunk('dashboard/fetchSummary', async () => {
  const response = await repo.getSummary();
  return response.data;
});

interface DashboardState {
  data: DashboardSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = { data: null, loading: false, error: null };

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDashboard.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchDashboard.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Erro ao carregar dashboard'; });
  },
});

export default dashboardSlice.reducer;
