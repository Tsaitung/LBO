/**
 * 場景配置管理
 * 遵循 Linus 原則：配置而非硬編碼
 */

import { ScenarioAssumptions } from '../types/financial';

// 預設場景配置值
export const SCENARIO_DEFAULTS = {
  base: {
    entryEvEbitdaMultiple: 3,  // 用戶要求的預設值，而非硬編碼的 10
    exitEvEbitdaMultiple: 12,
    seniorDebtEbitda: 4,
    mezzDebtEbitda: 2,
    cogsAsPercentageOfRevenue: 60,
    operatingExpensesAsPercentageOfRevenue: 15,
    revenueGrowthRate: 5,
    ebitdaMargin: 25,
    netMargin: 10,
    capExPctSales: 4,
    nwcPctSales: 15,
    corporateTaxRate: 20,
  },
  upper: {
    entryEvEbitdaMultiple: 3,  // 用戶要求的預設值
    exitEvEbitdaMultiple: 14,
    seniorDebtEbitda: 3.5,
    mezzDebtEbitda: 1.5,
    cogsAsPercentageOfRevenue: 58,
    operatingExpensesAsPercentageOfRevenue: 14,
    revenueGrowthRate: 7,
    ebitdaMargin: 28,
    netMargin: 12,
    capExPctSales: 3.5,
    nwcPctSales: 14,
    corporateTaxRate: 20,
  },
  lower: {
    entryEvEbitdaMultiple: 3,  // 用戶要求的預設值
    exitEvEbitdaMultiple: 10,
    seniorDebtEbitda: 4.5,
    mezzDebtEbitda: 2.5,
    cogsAsPercentageOfRevenue: 62,
    operatingExpensesAsPercentageOfRevenue: 16,
    revenueGrowthRate: 3,
    ebitdaMargin: 22,
    netMargin: 8,
    capExPctSales: 4.5,
    nwcPctSales: 16,
    corporateTaxRate: 20,
  },
};

/**
 * 從 localStorage 讀取已儲存的場景配置
 */
export const getStoredScenarios = (): Record<string, ScenarioAssumptions> | null => {
  try {
    const stored = localStorage.getItem('lbo_scenarios');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
};

/**
 * 儲存場景配置到 localStorage
 */
export const saveScenarios = (scenarios: Record<string, ScenarioAssumptions>): void => {
  try {
    localStorage.setItem('lbo_scenarios', JSON.stringify(scenarios));
  } catch (error) {
    // Silently fail if localStorage is not available
  }
};

/**
 * 獲取場景配置（優先使用儲存的值，否則使用預設值）
 */
export const getScenarioConfig = (
  scenario: 'base' | 'upper' | 'lower'
): ScenarioAssumptions => {
  const stored = getStoredScenarios();
  
  if (stored && stored[scenario]) {
    return stored[scenario];
  }
  
  return SCENARIO_DEFAULTS[scenario];
};

/**
 * 獲取所有場景配置
 */
export const getAllScenarios = (): Record<string, ScenarioAssumptions> => {
  const stored = getStoredScenarios();
  
  if (stored) {
    // 合併儲存的值和預設值，確保所有字段都存在
    return {
      base: { ...SCENARIO_DEFAULTS.base, ...(stored.base || {}) },
      upper: { ...SCENARIO_DEFAULTS.upper, ...(stored.upper || {}) },
      lower: { ...SCENARIO_DEFAULTS.lower, ...(stored.lower || {}) },
    };
  }
  
  return SCENARIO_DEFAULTS;
};

/**
 * 獲取預設入場倍數（用於回退值）
 * 永遠返回 3，而非硬編碼的 10
 */
export const getDefaultEntryMultiple = (): number => {
  const stored = getStoredScenarios();
  
  if (stored && stored.base && stored.base.entryEvEbitdaMultiple) {
    return stored.base.entryEvEbitdaMultiple;
  }
  
  return 3;  // 用戶要求的預設值
};
