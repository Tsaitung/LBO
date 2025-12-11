/**
 * 場景配置管理
 * 遵循 Linus 原則：配置而非硬編碼
 *
 * 重要：此檔案現在從 master-defaults.ts 導入所有預設值
 * 確保 Single Source of Truth (SSOT)
 */

import { ScenarioAssumptions } from '../types/financial';
import {
  VALUATION_DEFAULTS,
  GROWTH_DEFAULTS,
  COST_STRUCTURE_DEFAULTS,
  CAPEX_DEFAULTS,
  WORKING_CAPITAL_DEFAULTS,
  TAX_DISCOUNT_DEFAULTS,
  DEBT_DEFAULTS,
  SCENARIO_ADJUSTMENTS,
} from './master-defaults';

// Base 情境預設值（直接從 master-defaults 導出）
const baseScenario: ScenarioAssumptions = {
  // 情境參數
  entryEvEbitdaMultiple: VALUATION_DEFAULTS.entryEvEbitdaMultiple,
  exitEvEbitdaMultiple: VALUATION_DEFAULTS.exitEvEbitdaMultiple,
  seniorDebtEbitda: VALUATION_DEFAULTS.seniorDebtEbitda,
  mezzDebtEbitda: VALUATION_DEFAULTS.mezzDebtEbitda,
  // 增長假設
  revenueGrowthRate: GROWTH_DEFAULTS.revenueGrowthRate,
  ebitdaMargin: GROWTH_DEFAULTS.ebitdaMargin,
  netMargin: GROWTH_DEFAULTS.netMargin,
  // 成本結構
  cogsAsPercentageOfRevenue: COST_STRUCTURE_DEFAULTS.cogsAsPercentageOfRevenue,
  operatingExpensesAsPercentageOfRevenue: COST_STRUCTURE_DEFAULTS.operatingExpensesAsPercentageOfRevenue,
  // 資本支出
  capexAsPercentageOfRevenue: CAPEX_DEFAULTS.capexAsPercentageOfRevenue,
  capexGrowthRate: CAPEX_DEFAULTS.capexGrowthRate,
  // 營運資本
  accountsReceivableDays: WORKING_CAPITAL_DEFAULTS.accountsReceivableDays,
  inventoryDays: WORKING_CAPITAL_DEFAULTS.inventoryDays,
  accountsPayableDays: WORKING_CAPITAL_DEFAULTS.accountsPayableDays,
  // 其他財務
  taxRate: TAX_DISCOUNT_DEFAULTS.taxRate,
  discountRate: TAX_DISCOUNT_DEFAULTS.discountRate,
  // 計算參數
  depreciationToCapexRatio: CAPEX_DEFAULTS.depreciationToCapexRatio,
  fixedAssetsToCapexMultiple: CAPEX_DEFAULTS.fixedAssetsToCapexMultiple,
  revolvingCreditRepaymentRate: DEBT_DEFAULTS.revolvingCreditRepaymentRate,
  // 向後兼容
  capExPctSales: CAPEX_DEFAULTS.capexAsPercentageOfRevenue,
  nwcPctSales: 15,
  corporateTaxRate: TAX_DISCOUNT_DEFAULTS.taxRate,
};

// 預設場景配置值（使用 SCENARIO_ADJUSTMENTS 計算差異）
export const SCENARIO_DEFAULTS: Record<'base' | 'upper' | 'lower', ScenarioAssumptions> = {
  base: baseScenario,
  upper: {
    ...baseScenario,
    // 情境參數調整
    exitEvEbitdaMultiple: VALUATION_DEFAULTS.exitEvEbitdaMultiple + SCENARIO_ADJUSTMENTS.upside.exitEvEbitdaMultiple,
    seniorDebtEbitda: VALUATION_DEFAULTS.seniorDebtEbitda - 0.5,
    mezzDebtEbitda: VALUATION_DEFAULTS.mezzDebtEbitda - 0.5,
    // 增長假設（樂觀）
    revenueGrowthRate: GROWTH_DEFAULTS.revenueGrowthRate + SCENARIO_ADJUSTMENTS.upside.revenueGrowthRate,
    ebitdaMargin: GROWTH_DEFAULTS.ebitdaMargin + SCENARIO_ADJUSTMENTS.upside.ebitdaMargin,
    netMargin: GROWTH_DEFAULTS.netMargin + 2,
    // 成本結構（較低）
    cogsAsPercentageOfRevenue: COST_STRUCTURE_DEFAULTS.cogsAsPercentageOfRevenue + SCENARIO_ADJUSTMENTS.upside.cogsAdjustment,
    operatingExpensesAsPercentageOfRevenue: COST_STRUCTURE_DEFAULTS.operatingExpensesAsPercentageOfRevenue + SCENARIO_ADJUSTMENTS.upside.opexAdjustment,
    // 資本支出（較低）
    capexAsPercentageOfRevenue: CAPEX_DEFAULTS.capexAsPercentageOfRevenue - 0.5,
    // 營運資本（更有效率）
    accountsReceivableDays: WORKING_CAPITAL_DEFAULTS.accountsReceivableDays - 5,
    inventoryDays: WORKING_CAPITAL_DEFAULTS.inventoryDays - 5,
    accountsPayableDays: WORKING_CAPITAL_DEFAULTS.accountsPayableDays + 3,
    // 向後兼容
    capExPctSales: CAPEX_DEFAULTS.capexAsPercentageOfRevenue - 0.5,
    nwcPctSales: 14,
  },
  lower: {
    ...baseScenario,
    // 情境參數調整
    exitEvEbitdaMultiple: VALUATION_DEFAULTS.exitEvEbitdaMultiple + SCENARIO_ADJUSTMENTS.downside.exitEvEbitdaMultiple,
    seniorDebtEbitda: VALUATION_DEFAULTS.seniorDebtEbitda + 0.5,
    mezzDebtEbitda: VALUATION_DEFAULTS.mezzDebtEbitda + 0.5,
    // 增長假設（保守）
    revenueGrowthRate: GROWTH_DEFAULTS.revenueGrowthRate + SCENARIO_ADJUSTMENTS.downside.revenueGrowthRate,
    ebitdaMargin: GROWTH_DEFAULTS.ebitdaMargin + SCENARIO_ADJUSTMENTS.downside.ebitdaMargin,
    netMargin: GROWTH_DEFAULTS.netMargin - 2,
    // 成本結構（較高）
    cogsAsPercentageOfRevenue: COST_STRUCTURE_DEFAULTS.cogsAsPercentageOfRevenue + SCENARIO_ADJUSTMENTS.downside.cogsAdjustment,
    operatingExpensesAsPercentageOfRevenue: COST_STRUCTURE_DEFAULTS.operatingExpensesAsPercentageOfRevenue + SCENARIO_ADJUSTMENTS.downside.opexAdjustment,
    // 資本支出（較高）
    capexAsPercentageOfRevenue: CAPEX_DEFAULTS.capexAsPercentageOfRevenue + 0.5,
    // 營運資本（較差）
    accountsReceivableDays: WORKING_CAPITAL_DEFAULTS.accountsReceivableDays + 5,
    inventoryDays: WORKING_CAPITAL_DEFAULTS.inventoryDays + 5,
    accountsPayableDays: WORKING_CAPITAL_DEFAULTS.accountsPayableDays - 3,
    // 向後兼容
    capExPctSales: CAPEX_DEFAULTS.capexAsPercentageOfRevenue + 0.5,
    nwcPctSales: 16,
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
 * 從 master-defaults.ts 統一取得
 */
export const getDefaultEntryMultiple = (): number => {
  const stored = getStoredScenarios();

  if (stored && stored.base && stored.base.entryEvEbitdaMultiple) {
    return stored.base.entryEvEbitdaMultiple;
  }

  return VALUATION_DEFAULTS.entryEvEbitdaMultiple;
};
