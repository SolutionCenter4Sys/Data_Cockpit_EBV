import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { BatchJob, BatchMetrics } from '../../domain/entities';
import { MockBatchRepository } from '../../data/repositories/MockBatchRepository';

const repo = new MockBatchRepository();

export const fetchBatchJobs = createAsyncThunk('batch/fetchJobs', async () => {
  const r = await repo.getJobs();
  return r.data;
});

export const fetchBatchMetrics = createAsyncThunk('batch/fetchMetrics', async () => {
  const r = await repo.getMetrics();
  return r.data;
});

export const retryBatchJob = createAsyncThunk('batch/retry', async (jobId: string) => {
  const r = await repo.retryJob(jobId);
  return r.data;
});

interface BatchState {
  jobs: BatchJob[];
  metrics: BatchMetrics | null;
  loading: boolean;
  retryingJobId: string | null;
  error: string | null;
}

const initialState: BatchState = { jobs: [], metrics: null, loading: false, retryingJobId: null, error: null };

const batchSlice = createSlice({
  name: 'batch',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBatchJobs.pending, (state) => { state.loading = true; })
      .addCase(fetchBatchJobs.fulfilled, (state, action) => { state.loading = false; state.jobs = action.payload; })
      .addCase(fetchBatchJobs.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Erro'; })
      .addCase(fetchBatchMetrics.fulfilled, (state, action) => { state.metrics = action.payload; })
      .addCase(retryBatchJob.pending, (state, action) => { state.retryingJobId = action.meta.arg; })
      .addCase(retryBatchJob.fulfilled, (state, action) => {
        state.retryingJobId = null;
        state.jobs = state.jobs.map((j) => j.jobId === action.payload.jobId ? action.payload : j);
      })
      .addCase(retryBatchJob.rejected, (state) => { state.retryingJobId = null; });
  },
});

export default batchSlice.reducer;
