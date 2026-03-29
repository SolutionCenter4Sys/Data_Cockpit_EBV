import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { DataEvent, EventStats, EventType, DataLayer } from "../../domain/entities";

interface EventHubState {
  events: DataEvent[];
  stats: EventStats | null;
  loading: boolean;
  error: string | null;
}

const EVENT_TYPES: EventType[] = ['INGESTION','TRANSFORMATION','VALIDATION','ALERT','QUALITY_CHECK','SCHEMA_CHANGE'];
const LAYERS: DataLayer[] = ['INGESTION','TRUSTED','ANALYTICS'];
const SOURCES = ['ETL-047 FFT Copy','BATCH-092 Trusted Sync','MDL-003 Score Fraude','Kafka Consumer','GCS Loader','API Parceiros','CRM Sync'];

function randomEvent(id: string): DataEvent {
  const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  const layer = LAYERS[Math.floor(Math.random() * LAYERS.length)];
  const failed = Math.random() < 0.12;
  return {
    id,
    type,
    source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
    layer,
    status: failed ? "FAILED" : "SUCCESS",
    timestamp: new Date().toISOString(),
    payload: { records: Math.floor(Math.random() * 10000), batch: `B-${Math.floor(Math.random() * 999)}` },
    schemaValid: Math.random() > 0.08,
    metadata: { env: "production", region: "us-east-1" },
    processingTimeMs: Math.floor(Math.random() * 800) + 20,
  };
}

const mockEvents: DataEvent[] = Array.from({ length: 30 }, (_, i) => {
  const ev = randomEvent(`evt-${String(i + 1).padStart(3, "0")}`);
  ev.timestamp = new Date(Date.now() - (30 - i) * 60000).toISOString();
  return ev;
});

const mockStats: EventStats = {
  totalToday: 14823,
  eventsPerMinute: 42,
  failedEvents: 127,
  schemaViolations: 18,
  avgProcessingMs: 145,
  byLayer: { INGESTION: 6230, TRUSTED: 4891, ANALYTICS: 3702 },
};

export const fetchEvents = createAsyncThunk("eventHub/fetchEvents", async () => {
  await new Promise((r) => setTimeout(r, 500));
  return mockEvents;
});

export const fetchEventStats = createAsyncThunk("eventHub/fetchStats", async () => {
  await new Promise((r) => setTimeout(r, 300));
  return mockStats;
});

let eventCounter = 100;

const eventHubSlice = createSlice({
  name: "eventHub",
  initialState: { events: [], stats: null, loading: false, error: null } as EventHubState,
  reducers: {
    addNewEvent(state) {
      eventCounter++;
      const ev = randomEvent(`evt-rt-${eventCounter}`);
      state.events.unshift(ev);
      if (state.events.length > 100) state.events.pop();
      if (state.stats) {
        state.stats.totalToday++;
        if (ev.status === "FAILED") state.stats.failedEvents++;
        if (!ev.schemaValid) state.stats.schemaViolations++;
        state.stats.byLayer[ev.layer]++;
      }
    },
    clearEvents(state) { state.events = []; },
  },
  extraReducers: (b) => {
    b.addCase(fetchEvents.pending, (s) => { s.loading = true; })
     .addCase(fetchEvents.fulfilled, (s, { payload }) => { s.loading = false; s.events = payload; })
     .addCase(fetchEvents.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? "Erro"; })
     .addCase(fetchEventStats.fulfilled, (s, { payload }) => { s.stats = payload; });
  },
});

export const { addNewEvent, clearEvents } = eventHubSlice.actions;
export default eventHubSlice.reducer;
