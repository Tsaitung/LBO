/**
 * Pro Forma Memoized Selectors
 * 使用 createSelector 實現 memoization，避免不必要的重新渲染
 *
 * 遵循 Linus 原則：消除特殊情況，統一數據來源
 */

import { createSelector } from '@reduxjs/toolkit';
import { AppRootState, isModularState } from '../../../types/store.types';
import { FutureAssumptions, ScenarioAssumptions } from '../../../types/financial';

// ==================== 基礎 Selectors ====================
// 這些 selectors 直接從 state 取值，使用類型守衛確保類型安全
// 注意：應用程式目前只使用 ModularRootState，LegacyRootState 已被移除

const selectCurrentScenarioKey = (state: AppRootState) => {
  if (isModularState(state)) return state.scenarios.current;
  throw new Error('Legacy state is not supported');
};
const selectScenariosObject = (state: AppRootState) => {
  if (isModularState(state)) return state.scenarios.scenarios;
  throw new Error('Legacy state is not supported');
};
const selectBusinessMetrics = (state: AppRootState) => {
  if (isModularState(state)) return state.businessMetrics;
  throw new Error('Legacy state is not supported');
};
const selectMnaDeal = (state: AppRootState) => {
  if (isModularState(state)) return state.mnaDeal;
  throw new Error('Legacy state is not supported');
};
const selectFinancingPlanState = (state: AppRootState) => {
  if (isModularState(state)) return state.financingPlan;
  throw new Error('Legacy state is not supported');
};

// ==================== Memoized Selectors ====================

/**
 * 選取當前情境的 ScenarioAssumptions
 * 當 scenarios 或 current 改變時才重新計算
 */
export const selectCurrentScenarioAssumptions = createSelector(
  [selectScenariosObject, selectCurrentScenarioKey],
  (scenarios, currentKey): ScenarioAssumptions => {
    return scenarios[currentKey as keyof typeof scenarios];
  }
);

/**
 * 選取 FutureAssumptions 格式
 * 用於計算層兼容
 */
export const selectFutureAssumptions = createSelector(
  [selectCurrentScenarioAssumptions],
  (scenario): FutureAssumptions => ({
    // 增長假設
    revenueGrowthRate: scenario.revenueGrowthRate,
    ebitdaMargin: scenario.ebitdaMargin,
    netMargin: scenario.netMargin,
    // 成本結構
    cogsAsPercentageOfRevenue: scenario.cogsAsPercentageOfRevenue,
    operatingExpensesAsPercentageOfRevenue: scenario.operatingExpensesAsPercentageOfRevenue,
    // 資本支出
    capexAsPercentageOfRevenue: scenario.capexAsPercentageOfRevenue,
    capexGrowthRate: scenario.capexGrowthRate,
    // 營運資本
    accountsReceivableDays: scenario.accountsReceivableDays,
    inventoryDays: scenario.inventoryDays,
    accountsPayableDays: scenario.accountsPayableDays,
    // 其他
    taxRate: scenario.taxRate,
    discountRate: scenario.discountRate,
    // 計算參數
    depreciationToCapexRatio: scenario.depreciationToCapexRatio,
    fixedAssetsToCapexMultiple: scenario.fixedAssetsToCapexMultiple,
    revolvingCreditRepaymentRate: scenario.revolvingCreditRepaymentRate,
  })
);

/**
 * 選取融資計劃列表
 */
export const selectFinancingPlans = createSelector(
  [selectFinancingPlanState],
  (financingPlan) => financingPlan.plans
);

// ==================== 導出基礎 Selectors ====================
// 這些可以直接在 useAppSelector 中使用

export {
  selectBusinessMetrics,
  selectMnaDeal,
  selectCurrentScenarioKey,
  selectScenariosObject,
};
