import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Alert, AlertRule } from '../../domain/entities';
import { MockAlertRepository } from '../../data/repositories/MockAlertRepository';

const repo = new MockAlertRepository();

export const fetchAlerts = createAsyncThunk('alerts/fetchAll', async () => {
  const r = await repo.getAlerts();
  return r.data;
});

export const fetchAlertRules = createAsyncThunk('alerts/fetchRules', async () => {
  const r = await repo.getRules();
  return r.data;
});

export const acknowledgeAlert = createAsyncThunk('alerts/acknowledge', async (id: string) => {
  const r = await repo.acknowledgeAlert(id);
  return r.data;
});

export const resolveAlert = createAsyncThunk('alerts/resolve', async (id: string) => {
  const r = await repo.resolveAlert(id);
  return r.data;
});

interface AlertState {
  alerts: Alert[];
  rules: AlertRule[];
  loading: boolean;
  actionLoading: string | null;
  error: string | null;
}

const initialState: AlertState = { alerts: [], rules: [], loading: false, actionLoading: null, error: null };

const alertSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => { state.loading = true; })
      .addCase(fetchAlerts.fulfilled, (state, action) => { state.loading = false; state.alerts = action.payload; })
      .addCase(fetchAlerts.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Erro'; })
      .addCase(fetchAlertRules.fulfilled, (state, action) => { state.rules = action.payload; })
      .addCase(acknowledgeAlert.pending, (state, action) => { state.actionLoading = action.meta.arg; })
      .addCase(acknowledgeAlert.fulfilled, (state, action) => {
        state.actionLoading = null;
        state.alerts = state.alerts.map((a) => a.id === action.payload.id ? action.payload : a);
      })
      .addCase(resolveAlert.pending, (state, action) => { state.actionLoading = action.meta.arg; })
      .addCase(resolveAlert.fulfilled, (state, action) => {
        state.actionLoading = null;
        state.alerts = state.alerts.map((a) => a.id === action.payload.id ? action.payload : a);
      });
  },
});

export default alertSlice.reducer;
