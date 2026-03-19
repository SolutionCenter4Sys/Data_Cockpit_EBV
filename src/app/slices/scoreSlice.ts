import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { ScoreMetric, ScoreAnomalyEvent, ScoreTimeSeries } from '../../domain/entities';
import { MockScoreRepository } from '../../data/repositories/MockScoreRepository';

const repo = new MockScoreRepository();

export const fetchScoreMetrics = createAsyncThunk('score/fetchMetrics', async () => {
  const r = await repo.getMetrics();
  return r.data;
});

export const fetchScoreAnomalies = createAsyncThunk('score/fetchAnomalies', async (modelId?: string) => {
  const r = await repo.getAnomalyEvents(modelId);
  return r.data;
});

export const fetchScoreTimeSeries = createAsyncThunk('score/fetchTimeSeries', async (modelId: string) => {
  const r = await repo.getTimeSeries(modelId);
  return r.data;
});

interface ScoreState {
  metrics: ScoreMetric[];
  anomalies: ScoreAnomalyEvent[];
  timeSeries: ScoreTimeSeries[];
  selectedModelId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ScoreState = {
  metrics: [], anomalies: [], timeSeries: [], selectedModelId: null, loading: false, error: null,
};

const scoreSlice = createSlice({
  name: 'score',
  initialState,
  reducers: {
    selectModel: (state, action) => { state.selectedModelId = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchScoreMetrics.pending, (state) => { state.loading = true; })
      .addCase(fetchScoreMetrics.fulfilled, (state, action) => { state.loading = false; state.metrics = action.payload; })
      .addCase(fetchScoreMetrics.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Erro'; })
      .addCase(fetchScoreAnomalies.fulfilled, (state, action) => { state.anomalies = action.payload; })
      .addCase(fetchScoreTimeSeries.fulfilled, (state, action) => { state.timeSeries = action.payload; });
  },
});

export const { selectModel } = scoreSlice.actions;
export default scoreSlice.reducer;
