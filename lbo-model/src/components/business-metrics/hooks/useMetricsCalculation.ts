/**
 * 業務指標自動計算 Hook
 * Linus 原則：純函數計算，無副作用
 */

import { useMemo, useCallback } from 'react';
import { BusinessMetricsBeforeAcquisition } from '../../../types/financial';

/**
 * 計算衍生指標
 */
export function useMetricsCalculation(metrics: Partial<BusinessMetricsBeforeAcquisition>) {
  
  // 計算毛利
  const grossProfit = useMemo(() => {
    const revenue = metrics.revenue || 0;
    const cogs = metrics.cogs || 0;
    return revenue - cogs;
  }, [metrics.revenue, metrics.cogs]);
  
  // 計算毛利率
  const grossMargin = useMemo(() => {
    const revenue = metrics.revenue || 0;
    if (revenue === 0) return 0;
    return (grossProfit / revenue) * 100;
  }, [grossProfit, metrics.revenue]);
  
  // 計算 EBITDA
  const ebitda = useMemo(() => {
    const operatingExpenses = metrics.operatingExpenses || 0;
    return grossProfit - operatingExpenses;
  }, [grossProfit, metrics.operatingExpenses]);
  
  // 計算淨利
  const netIncome = useMemo(() => {
    const depreciationAmortization = metrics.depreciationAmortization || 0;
    const interestExpense = metrics.interestExpense || 0;
    const taxExpense = metrics.taxExpense || 0;
    
    const ebit = ebitda - depreciationAmortization;
    return ebit - interestExpense - taxExpense;
  }, [ebitda, metrics.depreciationAmortization, metrics.interestExpense, metrics.taxExpense]);
  
  // 計算總資產
  const totalAssets = useMemo(() => {
    const cash = metrics.cashAndCashEquivalents || 0;
    const ar = metrics.accountsReceivable || 0;
    const inventory = metrics.inventory || 0;
    const ppe = metrics.propertyPlantEquipment || 0;
    
    return cash + ar + inventory + ppe;
  }, [
    metrics.cashAndCashEquivalents,
    metrics.accountsReceivable,
    metrics.inventory,
    metrics.propertyPlantEquipment,
  ]);
  
  // 計算總負債
  const totalLiabilities = useMemo(() => {
    const ap = metrics.accountsPayable || 0;
    const std = metrics.shortTermDebt || 0;
    const ltd = metrics.longTermDebt || 0;
    const ocl = metrics.otherCurrentLiabilities || 0;
    const oltl = metrics.otherLongTermLiabilities || 0;
    
    return ap + std + ltd + ocl + oltl;
  }, [
    metrics.accountsPayable,
    metrics.shortTermDebt,
    metrics.longTermDebt,
    metrics.otherCurrentLiabilities,
    metrics.otherLongTermLiabilities,
  ]);
  
  // 計算股東權益
  const shareholdersEquity = useMemo(() => {
    return totalAssets - totalLiabilities;
  }, [totalAssets, totalLiabilities]);
  
  // 計算營運資本
  const workingCapital = useMemo(() => {
    const currentAssets = 
      (metrics.cashAndCashEquivalents || 0) +
      (metrics.accountsReceivable || 0) +
      (metrics.inventory || 0);
    
    const currentLiabilities = 
      (metrics.accountsPayable || 0) +
      (metrics.shortTermDebt || 0) +
      (metrics.otherCurrentLiabilities || 0);
    
    return currentAssets - currentLiabilities;
  }, [
    metrics.cashAndCashEquivalents,
    metrics.accountsReceivable,
    metrics.inventory,
    metrics.accountsPayable,
    metrics.shortTermDebt,
    metrics.otherCurrentLiabilities,
  ]);
  
  // 計算營業現金流
  const operatingCashFlow = useMemo(() => {
    const depreciationAmortization = metrics.depreciationAmortization || 0;
    return netIncome + depreciationAmortization;
  }, [netIncome, metrics.depreciationAmortization]);
  
  // 獲取所有計算值
  const getCalculatedMetrics = useCallback(() => {
    return {
      grossProfit,
      grossMargin,
      ebitda,
      netIncome,
      totalAssets,
      totalLiabilities,
      shareholdersEquity,
      workingCapital,
      operatingCashFlow,
    };
  }, [
    grossProfit,
    grossMargin,
    ebitda,
    netIncome,
    totalAssets,
    totalLiabilities,
    shareholdersEquity,
    workingCapital,
    operatingCashFlow,
  ]);
  
  // 合併原始和計算指標
  const getAllMetrics = useCallback(() => {
    return {
      ...metrics,
      ...getCalculatedMetrics(),
    };
  }, [metrics, getCalculatedMetrics]);
  
  return {
    // 計算值
    grossProfit,
    grossMargin,
    ebitda,
    netIncome,
    totalAssets,
    totalLiabilities,
    shareholdersEquity,
    workingCapital,
    operatingCashFlow,
    // 函數
    getCalculatedMetrics,
    getAllMetrics,
  };
}