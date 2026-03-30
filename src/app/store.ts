import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import dashboardReducer from "./slices/dashboardSlice";
import scoreReducer from "./slices/scoreSlice";
import alertReducer from "./slices/alertSlice";
import batchReducer from "./slices/batchSlice";
import lineageReducer from "./slices/lineageSlice";
import ingestionReducer from "./slices/ingestionSlice";
import trustedReducer from "./slices/trustedSlice";
import actionMatrixReducer from "./slices/actionMatrixSlice";
import governanceReducer from "./slices/governanceSlice";
import sentinelaReducer from "./slices/sentinelaSlice";
import guardiaoReducer from "./slices/guardiaoSlice";
import detetivoReducer from "./slices/detetivoSlice";
import auditorReducer from "./slices/auditorSlice";
import guruReducer from "./slices/guruSlice";
import analyticsExpandidoReducer from "./slices/analyticsExpandidoSlice";
import smartAlertsReducer from "./slices/smartAlertsSlice";
import predictivoReducer from "./slices/predictivoSlice";
import conselheiroReducer from "./slices/conselheiroSlice";
import comunicadorReducer from "./slices/comunicadorSlice";
import dataCatalogReducer from "./slices/dataCatalogSlice";
import eventHubReducer from "./slices/eventHubSlice";
import dataQualityReducer from "./slices/dataQualitySlice";
import queryBuilderReducer from "./slices/queryBuilderSlice";
import ruleEngineReducer from "./slices/ruleEngineSlice";
import connectorsReducer from "./slices/connectorsSlice";
import discoveryReducer from "./slices/discoverySlice";

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    score: scoreReducer,
    alerts: alertReducer,
    batch: batchReducer,
    lineage: lineageReducer,
    ingestion: ingestionReducer,
    trusted: trustedReducer,
    actionMatrix: actionMatrixReducer,
    governance: governanceReducer,
    sentinela: sentinelaReducer,
    guardiao: guardiaoReducer,
    detetivo: detetivoReducer,
    auditor: auditorReducer,
    guru: guruReducer,
    analyticsExpandido: analyticsExpandidoReducer,
    smartAlerts: smartAlertsReducer,
    preditivoIA: predictivoReducer,
    conselheiro: conselheiroReducer,
    comunicador: comunicadorReducer,
    dataCatalog: dataCatalogReducer,
    eventHub: eventHubReducer,
    dataQuality: dataQualityReducer,
    queryBuilder: queryBuilderReducer,
    ruleEngine: ruleEngineReducer,
    connectors: connectorsReducer,
    discovery: discoveryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
