/**
 * useProFormaCalculations Hook 單元測試
 * Linus 原則：測試專注於行為，而非實現細節
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useProFormaCalculations } from '../../components/strategic-analysis/hooks/useProFormaCalculations';
import businessMetricsReducer from '../../store/slices/businessMetrics.slice';
import assumptionsReducer from '../../store/slices/assumptions.slice';
import mnaDealReducer from '../../store/slices/mnaDealDesign.slice';
import scenariosReducer from '../../store/slices/scenarios.slice';
// 建立測試 store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      businessMetrics: businessMetricsReducer,
      assumptions: assumptionsReducer,
      mnaDeal: mnaDealReducer,
      scenarios: scenariosReducer,
    },
    preloadedState: initialState,
  });
};

describe('useProFormaCalculations', () => {
  it('應該返回預設狀態當沒有數據時', () => {
    const store = createTestStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(Provider, { store, children });
    
    const { result } = renderHook(() => useProFormaCalculations(), { wrapper });
    
    expect(result.current.proFormaData).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });
  
  it('應該正確計算企業價值', () => {
    const store = createTestStore({
      businessMetrics: {
        ebitda: 10000, // 10M in thousands
      },
      scenarios: {
        current: 'base',
        scenarios: {
          base: {
            entryEvEbitdaMultiple: 8,
          },
        },
      },
    });
    
    const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(Provider, { store, children });
    const { result } = renderHook(() => useProFormaCalculations(), { wrapper });
    
    expect(result.current.globalEnterpriseValue).toBe(80); // 10M * 8 = 80M
  });
  
  // Note: ProForma conversion test removed as lbo slice architecture was refactored
  // If this test becomes necessary again, it should be redesigned for the new slice structure
});