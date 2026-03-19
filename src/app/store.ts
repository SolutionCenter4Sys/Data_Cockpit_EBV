import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import dashboardReducer from './slices/dashboardSlice';
import scoreReducer from './slices/scoreSlice';
import alertReducer from './slices/alertSlice';
import batchReducer from './slices/batchSlice';
import lineageReducer from './slices/lineageSlice';

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    score: scoreReducer,
    alerts: alertReducer,
    batch: batchReducer,
    lineage: lineageReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
