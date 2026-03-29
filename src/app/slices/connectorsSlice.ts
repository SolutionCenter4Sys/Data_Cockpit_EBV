import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Connector, Credential } from "../../domain/entities";

interface ConnectorsState {
  connectors: Connector[];
  credentials: Credential[];
  testingId: string | null;
  loading: boolean;
  error: string | null;
}

const mockConnectors: Connector[] = [
  { id:"cn-01", name:"EBV Core PostgreSQL", type:"POSTGRESQL", host:"ebv-core-db.internal", port:5432, database:"ebv_production", status:"CONNECTED", lastHealthCheck:"2026-03-29T09:00:00Z", latencyMs:12, poolSize:20, activeConnections:8, credentialId:"cred-01", autoReconnect:true, createdAt:"2026-01-10T10:00:00Z", layer:"INGESTION" },
  { id:"cn-02", name:"BigQuery Analytics", type:"BIGQUERY", host:"bigquery.googleapis.com", port:443, database:"ebv-analytics-prod", status:"CONNECTED", lastHealthCheck:"2026-03-29T09:05:00Z", latencyMs:45, poolSize:10, activeConnections:3, credentialId:"cred-02", autoReconnect:true, createdAt:"2026-01-15T14:00:00Z", layer:"ANALYTICS" },
  { id:"cn-03", name:"GCS Data Lake", type:"GCS", host:"storage.googleapis.com", port:443, database:"ebv-datalake-prod", status:"CONNECTED", lastHealthCheck:"2026-03-29T08:55:00Z", latencyMs:38, poolSize:5, activeConnections:2, credentialId:"cred-03", autoReconnect:true, createdAt:"2026-01-20T09:00:00Z", layer:"TRUSTED" },
  { id:"cn-04", name:"Oracle Legado", type:"ORACLE", host:"oracle-legacy.internal", port:1521, database:"EBVPROD", status:"ERROR", lastHealthCheck:"2026-03-29T08:00:00Z", latencyMs:890, poolSize:15, activeConnections:0, credentialId:"cred-04", autoReconnect:true, createdAt:"2026-01-05T08:00:00Z", layer:"INGESTION" },
  { id:"cn-05", name:"Kafka Cluster", type:"KAFKA", host:"kafka-broker-01.internal", port:9092, database:"ebv-events", status:"CONNECTED", lastHealthCheck:"2026-03-29T09:10:00Z", latencyMs:8, poolSize:30, activeConnections:15, credentialId:"cred-05", autoReconnect:true, createdAt:"2026-02-01T10:00:00Z", layer:"INGESTION" },
  { id:"cn-06", name:"MySQL CRM", type:"MYSQL", host:"crm-db.internal", port:3306, database:"crm_production", status:"CONNECTED", lastHealthCheck:"2026-03-29T09:08:00Z", latencyMs:18, poolSize:10, activeConnections:4, credentialId:"cred-06", autoReconnect:true, createdAt:"2026-02-10T11:00:00Z", layer:"INGESTION" },
  { id:"cn-07", name:"API Parceiros REST", type:"REST_API", host:"api.parceiros.ebv.com.br", port:443, database:"-", status:"CONNECTED", lastHealthCheck:"2026-03-29T09:12:00Z", latencyMs:220, poolSize:0, activeConnections:0, credentialId:"cred-07", autoReconnect:false, createdAt:"2026-02-20T16:00:00Z", layer:"INGESTION" },
  { id:"cn-08", name:"SQL Server BI", type:"SQLSERVER", host:"sqlserver-bi.internal", port:1433, database:"EBV_BI", status:"DISCONNECTED", lastHealthCheck:"2026-03-28T18:00:00Z", latencyMs:0, poolSize:10, activeConnections:0, credentialId:"cred-08", autoReconnect:false, createdAt:"2026-03-01T10:00:00Z", layer:"ANALYTICS" },
];

const mockCredentials: Credential[] = [
  { id:"cred-01", name:"ebv-core-pg-svc", type:"USERNAME_PASSWORD", connectorId:"cn-01", createdAt:"2026-01-10T10:00:00Z", lastRotated:"2026-03-15T03:00:00Z", expiresAt:"2026-06-15T03:00:00Z", status:"VALID" },
  { id:"cred-02", name:"bq-analytics-sa", type:"SERVICE_ACCOUNT", connectorId:"cn-02", createdAt:"2026-01-15T14:00:00Z", lastRotated:"2026-03-01T04:00:00Z", expiresAt:null, status:"VALID" },
  { id:"cred-03", name:"gcs-datalake-sa", type:"SERVICE_ACCOUNT", connectorId:"cn-03", createdAt:"2026-01-20T09:00:00Z", lastRotated:"2026-03-01T04:00:00Z", expiresAt:null, status:"VALID" },
  { id:"cred-04", name:"oracle-legacy-user", type:"USERNAME_PASSWORD", connectorId:"cn-04", createdAt:"2026-01-05T08:00:00Z", lastRotated:"2026-01-05T08:00:00Z", expiresAt:"2026-04-05T08:00:00Z", status:"EXPIRED" },
  { id:"cred-05", name:"kafka-sasl-cert", type:"CERTIFICATE", connectorId:"cn-05", createdAt:"2026-02-01T10:00:00Z", lastRotated:"2026-03-20T02:00:00Z", expiresAt:"2026-09-20T02:00:00Z", status:"VALID" },
  { id:"cred-06", name:"crm-mysql-svc", type:"USERNAME_PASSWORD", connectorId:"cn-06", createdAt:"2026-02-10T11:00:00Z", lastRotated:"2026-03-10T03:00:00Z", expiresAt:"2026-06-10T03:00:00Z", status:"VALID" },
  { id:"cred-07", name:"parceiros-api-key", type:"API_KEY", connectorId:"cn-07", createdAt:"2026-02-20T16:00:00Z", lastRotated:"2026-03-20T10:00:00Z", expiresAt:"2026-06-20T10:00:00Z", status:"VALID" },
  { id:"cred-08", name:"sqlserver-bi-oauth", type:"OAUTH2", connectorId:"cn-08", createdAt:"2026-03-01T10:00:00Z", lastRotated:"2026-03-01T10:00:00Z", expiresAt:"2026-03-15T10:00:00Z", status:"REVOKED" },
];

export const fetchConnectors = createAsyncThunk("connectors/fetchConnectors", async () => {
  await new Promise((r) => setTimeout(r, 500));
  return mockConnectors;
});

export const fetchCredentials = createAsyncThunk("connectors/fetchCredentials", async () => {
  await new Promise((r) => setTimeout(r, 400));
  return mockCredentials;
});

export const testConnector = createAsyncThunk("connectors/testConnector", async (connectorId: string) => {
  await new Promise((r) => setTimeout(r, 2000));
  const success = Math.random() > 0.2;
  return { connectorId, status: success ? "CONNECTED" as const : "ERROR" as const, latencyMs: Math.floor(Math.random() * 200) + 10 };
});

let connCounter = 10;

const connectorsSlice = createSlice({
  name: "connectors",
  initialState: { connectors: [], credentials: [], testingId: null, loading: false, error: null } as ConnectorsState,
  reducers: {
    createConnector(state, { payload }: PayloadAction<Omit<Connector, "id" | "status" | "lastHealthCheck" | "latencyMs" | "activeConnections" | "createdAt">>) {
      connCounter++;
      state.connectors.push({ ...payload, id: `cn-${connCounter}`, status: "DISCONNECTED", lastHealthCheck: "", latencyMs: 0, activeConnections: 0, createdAt: new Date().toISOString() });
    },
    deleteConnector(state, { payload }: PayloadAction<string>) {
      state.connectors = state.connectors.filter((c) => c.id !== payload);
      state.credentials = state.credentials.filter((c) => c.connectorId !== payload);
    },
    createCredential(state, { payload }: PayloadAction<Omit<Credential, "id" | "createdAt" | "lastRotated" | "status">>) {
      state.credentials.push({ ...payload, id: `cred-${connCounter}`, createdAt: new Date().toISOString(), lastRotated: new Date().toISOString(), status: "VALID" });
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchConnectors.pending, (s) => { s.loading = true; })
     .addCase(fetchConnectors.fulfilled, (s, { payload }) => { s.loading = false; s.connectors = payload; })
     .addCase(fetchConnectors.rejected, (s, { error }) => { s.loading = false; s.error = error.message ?? "Erro"; })
     .addCase(fetchCredentials.fulfilled, (s, { payload }) => { s.credentials = payload; })
     .addCase(testConnector.pending, (s, { meta }) => { s.testingId = meta.arg; const c = s.connectors.find((c) => c.id === meta.arg); if (c) c.status = "TESTING"; })
     .addCase(testConnector.fulfilled, (s, { payload }) => {
       s.testingId = null;
       const c = s.connectors.find((c) => c.id === payload.connectorId);
       if (c) { c.status = payload.status; c.latencyMs = payload.latencyMs; c.lastHealthCheck = new Date().toISOString(); }
     })
     .addCase(testConnector.rejected, (s, { meta }) => { s.testingId = null; const c = s.connectors.find((c) => c.id === meta.arg); if (c) c.status = "ERROR"; });
  },
});

export const { createConnector, deleteConnector, createCredential } = connectorsSlice.actions;
export default connectorsSlice.reducer;
