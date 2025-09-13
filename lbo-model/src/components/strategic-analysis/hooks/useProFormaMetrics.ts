/**
 * ProForma 關鍵指標 Hook
 * Linus 原則：純函數計算，無副作用
 * 專注計算關鍵財務指標
 */

import { useMemo } from 'react';
import { ProFormaDataItem } from './useProFormaData';
import {
  useBusinessMetrics,
  useMnaDeal,
  useScenarios,
  useCurrentScenario,
} from '../../../hooks/typed-hooks';
import { ScenarioAssumptions } from '../../../types/financial';

export interface KeyMetrics {
  enterpriseValue: string;
  entryMultiple: string;
  currentScenario: string;
  dealType: string;
  entryLeverage: string;
  exitLeverage: string;
  fcffCAGR: number;
  avgEbitdaMargin: number;
  planningHorizon: number;
}

/**
 * 計算交易模式顯示名稱
 */
function getDealTypeDisplay(type: string): string {
  switch(type) {
    case 'fullAcquisition':
      return '全資收購';
    case 'assetAcquisition':
      return '資產併購';
    default:
      return '未設定';
  }
}

/**
 * 使用 ProForma 關鍵指標 Hook
 * @param proFormaData - ProForma 數據
 * @returns 關鍵財務指標
 */
export function useProFormaMetrics(proFormaData: ProFormaDataItem[] | null): KeyMetrics {
  const businessMetrics = useBusinessMetrics();
  const mnaDealDesign = useMnaDeal();
  const scenarios = useScenarios();
  const currentScenarioKey = useCurrentScenario();
  
  // 獲取當前情境數據
  const currentScenarioData = useMemo(() => {
    if (!scenarios) return null;
    return ((scenarios as unknown) as { scenarios?: Record<string, ScenarioAssumptions> })?.scenarios?.[currentScenarioKey] 
      || ((scenarios as unknown) as Record<string, ScenarioAssumptions>)?.[currentScenarioKey] 
      || ((scenarios as unknown) as { base?: ScenarioAssumptions })?.base;
  }, [scenarios, currentScenarioKey]);
  
  // 計算關鍵指標
  return useMemo(() => {
    // 預設值
    const defaultMetrics: KeyMetrics = {
      enterpriseValue: '0',
      entryMultiple: '0',
      currentScenario: currentScenarioKey?.charAt(0).toUpperCase() + currentScenarioKey?.slice(1) || 'Base',
      dealType: getDealTypeDisplay(mnaDealDesign?.dealType),
      entryLeverage: '0',
      exitLeverage: '0',
      fcffCAGR: 0,
      avgEbitdaMargin: 0,
      planningHorizon: mnaDealDesign?.planningHorizon || 5,
    };
    
    if (!proFormaData || proFormaData.length === 0) {
      return defaultMetrics;
    }
    
    // 計算企業價值
    const entryMultiple = currentScenarioData?.entryEvEbitdaMultiple || 0;
    const acquisitionEBITDA = businessMetrics?.ebitda / 1000 || 0;
    const enterpriseValue = acquisitionEBITDA * entryMultiple;
    
    // 計算債務指標
    const totalDebt = mnaDealDesign?.financingPlans?.reduce(
      (sum: number, plan: { amount?: number }) => sum + (plan.amount || 0), 0
    ) / 1000 || 0;
    
    const lastYearEbitda = parseFloat(proFormaData[proFormaData.length - 1].ebitda);
    const lastYearDebtBalance = parseFloat(proFormaData[proFormaData.length - 1].debtBalance);
    
    // 計算 FCFF CAGR
    const firstYearFCFF = proFormaData.length > 1 ? parseFloat(proFormaData[1].fcff) : 0;
    const lastYearFCFF = parseFloat(proFormaData[proFormaData.length - 1].fcff);
    
    const fcffCAGR = firstYearFCFF !== 0 && proFormaData.length > 2 
      ? (Math.pow(lastYearFCFF / firstYearFCFF, 1 / (proFormaData.length - 2)) - 1) * 100 
      : 0;
    
    // 計算平均 EBITDA 利潤率
    const avgEbitdaMargin = proFormaData
      .filter((d) => d.year > 0)
      .reduce((sum, d) => sum + parseFloat(d.ebitdaMargin), 0) / 
      Math.max(1, proFormaData.length - 1);
    
    return {
      enterpriseValue: enterpriseValue.toFixed(1),
      entryMultiple: entryMultiple.toFixed(1),
      currentScenario: currentScenarioKey?.charAt(0).toUpperCase() + currentScenarioKey?.slice(1) || 'Base',
      dealType: getDealTypeDisplay(mnaDealDesign?.dealType),
      entryLeverage: (totalDebt / acquisitionEBITDA).toFixed(1),
      exitLeverage: lastYearEbitda ? (lastYearDebtBalance / lastYearEbitda).toFixed(1) : '0',
      fcffCAGR,
      avgEbitdaMargin,
      planningHorizon: mnaDealDesign?.planningHorizon || 5,
    };
  }, [
    proFormaData,
    businessMetrics,
    mnaDealDesign,
    scenarios,
    currentScenarioData
  ]);
}