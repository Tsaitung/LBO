import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { BusinessMetricsBeforeAcquisition } from '../types/financial';
// Legacy lbo reducer removed - using domain slices only

// Import domain slices
import businessMetricsReducer from './slices/businessMetrics.slice';
import assumptionsReducer from './slices/assumptions.slice';
import financingPlanReducer from './slices/financingPlan.slice';
import mnaDealDesignReducer from './slices/mnaDealDesign.slice';
import scenariosReducer from './slices/scenarios.slice';

// 調試函數：清除持久化數據
export const clearPersistedData = () => {
  storage.removeItem('persist:lbo-model');
};

// 自定義transform：處理businessMetrics的持久化
const businessMetricsTransform = createTransform<BusinessMetricsBeforeAcquisition, any>(
  // 保存時：排除計算字段
  (inboundState, key) => {
    if (key === 'businessMetrics') {
      // 保存時排除計算字段，只保存輸入數據
      const {
        operatingCashFlow,
        totalAssets,
        totalLiabilities,
        shareholdersEquity,
        taxExpense,
        workingCapital,
        ...inputData
      } = inboundState;
      return inputData;
    }
    return inboundState;
  },
  // 恢復時：重新計算字段（這裡簡化，因為Redux會重新計算）
  (outboundState, key) => {
    if (key === 'businessMetrics') {
      // 恢復時只需返回輸入數據，Redux會自動重新計算
      return outboundState as BusinessMetricsBeforeAcquisition;
    }
    return outboundState;
  }
);

// Unified reducer with domain slices only (legacy facade removed)
const rootReducer = combineReducers({
  // Domain slices (single source of truth)
  businessMetrics: businessMetricsReducer,
  assumptions: assumptionsReducer,
  financingPlan: financingPlanReducer,
  mnaDeal: mnaDealDesignReducer,
  scenarios: scenariosReducer
});

const persistConfig: any = {
  key: 'lbo-model',
  storage,
  whitelist: [
    // Domain slices only
    'businessMetrics',      // 被併標的業務指標
    'assumptions',          // 未來預期假設
    'mnaDeal',              // M&A 交易設計
    'scenarios',            // 情境數據
    'financingPlan'         // 融資計劃
  ],
  transforms: [businessMetricsTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/FLUSH'
        ],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
