/**
 * useProFormaMetrics Hook 單元測試
 * Linus 原則：測試的是行為，不是實現
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useProFormaMetrics } from '../../components/strategic-analysis/hooks/useProFormaMetrics';
import { ProFormaDataItem } from '../../components/strategic-analysis/hooks/useProFormaData';
import businessMetricsReducer from '../../store/slices/businessMetrics.slice';
import mnaDealReducer from '../../store/slices/mnaDealDesign.slice';
import scenariosReducer from '../../store/slices/scenarios.slice';
import { TestWrapperProps } from '../../types/components';

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      businessMetrics: businessMetricsReducer,
      mnaDeal: mnaDealReducer,
      scenarios: scenariosReducer,
    },
    preloadedState: initialState,
  });
};

const mockProFormaData: ProFormaDataItem[] = [
  {
    year: 0,
    revenue: '0.0',
    ebitda: '0.0',
    ebitdaMargin: '0.0',
    fcff: '0.0',
    debtBalance: '50.0',
  } as ProFormaDataItem,
  {
    year: 1,
    revenue: '100.0',
    ebitda: '20.0',
    ebitdaMargin: '20.0',
    fcff: '15.0',
    debtBalance: '45.0',
  } as ProFormaDataItem,
  {
    year: 2,
    revenue: '105.0',
    ebitda: '21.0',
    ebitdaMargin: '20.0',
    fcff: '16.0',
    debtBalance: '40.0',
  } as ProFormaDataItem,
];

describe('useProFormaMetrics', () => {
  it('應該返回預設指標當沒有數據時', () => {
    const store = createTestStore();
    const wrapper = ({ children }: TestWrapperProps) => React.createElement(Provider, { store, children });
    
    const { result } = renderHook(() => useProFormaMetrics(null), { wrapper });
    
    expect(result.current.enterpriseValue).toBe('0');
    expect(result.current.entryMultiple).toBe('0');
    expect(result.current.fcffCAGR).toBe(0);
    expect(result.current.avgEbitdaMargin).toBe(0);
  });
  
  it('應該正確計算 FCFF CAGR', () => {
    const store = createTestStore();
    const wrapper = ({ children }: TestWrapperProps) => React.createElement(Provider, { store, children });
    
    const { result } = renderHook(
      () => useProFormaMetrics(mockProFormaData),
      { wrapper }
    );
    
    // CAGR = (16/15)^(1/1) - 1 = 0.0667 = 6.67%
    expect(result.current.fcffCAGR).toBeCloseTo(6.67, 1);
  });
  
  it('應該正確計算平均 EBITDA 利潤率', () => {
    const store = createTestStore();
    const wrapper = ({ children }: TestWrapperProps) => React.createElement(Provider, { store, children });
    
    const { result } = renderHook(
      () => useProFormaMetrics(mockProFormaData),
      { wrapper }
    );
    
    // 平均 = (20 + 20) / 2 = 20
    expect(result.current.avgEbitdaMargin).toBe(20);
  });
  
  it('應該正確計算入場和出場槓桿', () => {
    const store = createTestStore({
      businessMetrics: {
        ebitda: 20000, // 20M in thousands
      },
      mnaDeal: {
        financingPlans: [
          { amount: 50000 }, // 50M debt
        ],
      },
    });
    
    const wrapper = ({ children }: TestWrapperProps) => React.createElement(Provider, { store, children });
    const { result } = renderHook(
      () => useProFormaMetrics(mockProFormaData),
      { wrapper }
    );
    
    // Entry leverage = 50M / 20M = 2.5x
    expect(result.current.entryLeverage).toBe('2.5');
    
    // Exit leverage = (50M - 40M) / 21M = 0.48x
    expect(parseFloat(result.current.exitLeverage)).toBeCloseTo(0.48, 1);
  });
  
  it('應該正確轉換交易模式顯示名稱', () => {
    const store = createTestStore({
      mnaDeal: {
        dealType: 'fullAcquisition',
      },
    });
    
    const wrapper = ({ children }: TestWrapperProps) => React.createElement(Provider, { store, children });
    const { result } = renderHook(
      () => useProFormaMetrics(mockProFormaData),
      { wrapper }
    );
    
    expect(result.current.dealType).toBe('全資收購');
  });
});