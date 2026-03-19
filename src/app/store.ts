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
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
