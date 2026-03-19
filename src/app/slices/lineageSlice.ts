import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PipelineRun } from '../../domain/entities';
import { MockLineageRepository } from '../../data/repositories/MockLineageRepository';

const repo = new MockLineageRepository();

export const fetchPipelineRuns = createAsyncThunk('lineage/fetchRuns', async () => {
  const r = await repo.getPipelineRuns();
  return r.data;
});

export const fetchPipelineDetail = createAsyncThunk('lineage/fetchDetail', async (runId: string) => {
  const r = await repo.getPipelineDetail(runId);
  return r.data;
});

interface LineageState {
  runs: PipelineRun[];
  selectedRun: PipelineRun | null;
  loading: boolean;
  error: string | null;
}

const initialState: LineageState = { runs: [], selectedRun: null, loading: false, error: null };

const lineageSlice = createSlice({
  name: 'lineage',
  initialState,
  reducers: {
    clearSelected: (state) => { state.selectedRun = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPipelineRuns.pending, (state) => { state.loading = true; })
      .addCase(fetchPipelineRuns.fulfilled, (state, action) => { state.loading = false; state.runs = action.payload; })
      .addCase(fetchPipelineRuns.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Erro'; })
      .addCase(fetchPipelineDetail.fulfilled, (state, action) => { state.selectedRun = action.payload; });
  },
});

export const { clearSelected } = lineageSlice.actions;
export default lineageSlice.reducer;
