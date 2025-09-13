/**
 * useMetricsCalculation Hook 測試
 * Linus 原則：測試行為，不是實現
 */

import { renderHook } from '@testing-library/react';
import { useMetricsCalculation } from '../../components/business-metrics/hooks/useMetricsCalculation';
import { BusinessMetricsBeforeAcquisition } from '../../types/financial';

describe('useMetricsCalculation', () => {
  it('應該正確計算毛利', () => {
    const metrics: Partial<BusinessMetricsBeforeAcquisition> = {
      revenue: 100000,
      cogs: 60000,
    };
    
    const { result } = renderHook(() => useMetricsCalculation(metrics));
    
    expect(result.current.grossProfit).toBe(40000);
    expect(result.current.grossMargin).toBeCloseTo(40, 1);
  });
  
  it('應該正確計算 EBITDA', () => {
    const metrics: Partial<BusinessMetricsBeforeAcquisition> = {
      revenue: 100000,
      cogs: 60000,
      operatingExpenses: 20000,
    };
    
    const { result } = renderHook(() => useMetricsCalculation(metrics));
    
    expect(result.current.ebitda).toBe(20000);
  });
  
  it('應該正確計算淨利', () => {
    const metrics: Partial<BusinessMetricsBeforeAcquisition> = {
      revenue: 100000,
      cogs: 60000,
      operatingExpenses: 20000,
      depreciationAmortization: 5000,
      interestExpense: 3000,
      taxExpense: 2000,
    };
    
    const { result } = renderHook(() => useMetricsCalculation(metrics));
    
    // 淨利 = EBITDA - D&A - 利息 - 稅
    // = 20000 - 5000 - 3000 - 2000 = 10000
    expect(result.current.netIncome).toBe(10000);
  });
  
  it('應該正確計算總資產', () => {
    const metrics: Partial<BusinessMetricsBeforeAcquisition> = {
      cashAndCashEquivalents: 10000,
      accountsReceivable: 20000,
      inventory: 15000,
      propertyPlantEquipment: 55000,
    };
    
    const { result } = renderHook(() => useMetricsCalculation(metrics));
    
    expect(result.current.totalAssets).toBe(100000);
  });
  
  it('應該正確計算股東權益', () => {
    const metrics: Partial<BusinessMetricsBeforeAcquisition> = {
      cashAndCashEquivalents: 50000,
      accountsReceivable: 30000,
      inventory: 20000,
      propertyPlantEquipment: 100000,
      accountsPayable: 20000,
      shortTermDebt: 30000,
      longTermDebt: 50000,
    };
    
    const { result } = renderHook(() => useMetricsCalculation(metrics));
    
    // 總資產 = 200000
    // 總負債 = 100000
    // 股東權益 = 200000 - 100000 = 100000
    expect(result.current.shareholdersEquity).toBe(100000);
  });
  
  it('應該正確計算營運資本', () => {
    const metrics: Partial<BusinessMetricsBeforeAcquisition> = {
      cashAndCashEquivalents: 10000,
      accountsReceivable: 20000,
      inventory: 15000,
      accountsPayable: 10000,
      shortTermDebt: 5000,
      otherCurrentLiabilities: 5000,
    };
    
    const { result } = renderHook(() => useMetricsCalculation(metrics));
    
    // 流動資產 = 10000 + 20000 + 15000 = 45000
    // 流動負債 = 10000 + 5000 + 5000 = 20000
    // 營運資本 = 45000 - 20000 = 25000
    expect(result.current.workingCapital).toBe(25000);
  });
  
  it('應該處理零值和空值', () => {
    const metrics: Partial<BusinessMetricsBeforeAcquisition> = {
      revenue: 0,
      cogs: undefined,
    };
    
    const { result } = renderHook(() => useMetricsCalculation(metrics));
    
    expect(result.current.grossProfit).toBe(0);
    expect(result.current.grossMargin).toBe(0);
    expect(result.current.totalAssets).toBe(0);
  });
});