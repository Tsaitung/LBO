/**
 * 融資相關的 Redux 選擇器
 * 使用 memoization 優化性能
 * Linus 原則：計算一次，多處使用
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../store/store';
import { 
  calculateTotalDebt, 
  calculateTotalEquity,
  validateFinancingStructure 
} from '../financing/FinancingService';
import { ScenarioAssumptions } from '../../types/financial';

/**
 * 基礎選擇器
 */
export const selectMnaDealDesign = (state: RootState) => state.mnaDeal;
export const selectFinancingPlans = (state: RootState) => state.mnaDeal?.financingPlans || [];
export const selectEquityInjections = (state: RootState) => state.mnaDeal?.equityInjections || [];
export const selectBusinessMetrics = (state: RootState) => state.businessMetrics;
export const selectScenarios = (state: RootState) => state.scenarios;
export const selectCurrentScenario = (state: RootState) => state.scenarios?.current;

/**
 * 計算總債務金額（緩存）
 */
export const selectTotalDebt = createSelector(
  [selectFinancingPlans],
  (plans) => calculateTotalDebt(plans)
);

/**
 * 計算總股權金額（緩存）
 */
export const selectTotalEquity = createSelector(
  [selectEquityInjections],
  (injections) => calculateTotalEquity(injections)
);

/**
 * 計算總融資金額（緩存）
 */
export const selectTotalFinancing = createSelector(
  [selectTotalDebt, selectTotalEquity],
  (debt, equity) => debt + equity
);

/**
 * 計算債務股權比例（緩存）
 */
export const selectDebtToEquityRatio = createSelector(
  [selectTotalDebt, selectTotalEquity],
  (debt, equity) => {
    if (equity === 0) return 0;
    return debt / equity;
  }
);

/**
 * 計算融資結構驗證（緩存）
 */
export const selectFinancingValidation = createSelector(
  [selectMnaDealDesign],
  (dealDesign) => dealDesign ? validateFinancingStructure(dealDesign) : { isValid: false, errors: ['No deal design'] }
);

/**
 * 計算企業價值（緩存）
 */
export const selectEnterpriseValue = createSelector(
  [selectBusinessMetrics, selectScenarios, selectCurrentScenario],
  (businessMetrics, scenarios, currentScenario) => {
    if (!scenarios || !businessMetrics) return 0;
    const scenario = scenarios.scenarios?.[currentScenario || 'base'] as ScenarioAssumptions | undefined;
    if (!scenario) return 0;
    
    const ebitda = businessMetrics.ebitda / 1000; // 轉換為百萬
    return ebitda * (scenario.entryEvEbitdaMultiple || 0);
  }
);

/**
 * 計算購買價格（緩存）
 */
export const selectPurchasePrice = createSelector(
  [selectEnterpriseValue, selectMnaDealDesign],
  (ev, dealDesign) => {
    if (!dealDesign) return 0;
    if (dealDesign.dealType === 'assetAcquisition') {
      // 資產收購：使用選定資產價值
      const selectedAssets = dealDesign.assetDealSettings?.selectedAssets || [];
      return selectedAssets.reduce((sum, asset) => 
        sum + (asset.fairValue || asset.bookValue || 0), 0
      ) / 1000; // 轉換為百萬
    }
    // 股權收購：使用企業價值
    return ev;
  }
);

/**
 * 計算資金來源結構（緩存）
 */
export const selectSourcesStructure = createSelector(
  [selectTotalDebt, selectTotalEquity, selectTotalFinancing],
  (debt, equity, total) => {
    if (total === 0) {
      return {
        debtPercentage: 0,
        equityPercentage: 0,
        isValid: false
      };
    }
    
    return {
      debtPercentage: (debt / total) * 100,
      equityPercentage: (equity / total) * 100,
      isValid: total > 0
    };
  }
);

/**
 * 計算每年的融資流入（緩存）
 */
export const selectFinancingInflows = createSelector(
  [selectFinancingPlans, selectEquityInjections],
  (plans, injections) => {
    const inflows: Record<number, { debt: number; equity: number }> = {};
    
    // 統計債務流入
    plans.forEach(plan => {
      const year = plan.entryTiming || 0;
      if (!inflows[year]) {
        inflows[year] = { debt: 0, equity: 0 };
      }
      inflows[year].debt += plan.amount || 0;
    });
    
    // 統計股權流入
    injections.forEach(injection => {
      const year = injection.entryTiming || 0;
      if (!inflows[year]) {
        inflows[year] = { debt: 0, equity: 0 };
      }
      inflows[year].equity += injection.amount || 0;
    });
    
    return inflows;
  }
);

/**
 * 計算加權平均利率（緩存）
 */
export const selectWeightedAverageRate = createSelector(
  [selectFinancingPlans],
  (plans) => {
    const totalDebt = calculateTotalDebt(plans);
    if (totalDebt === 0) return 0;
    
    const weightedSum = plans.reduce((sum, plan) => {
      const weight = (plan.amount || 0) / totalDebt;
      const rate = plan.interestRate || 0;
      return sum + (weight * rate);
    }, 0);
    
    return weightedSum;
  }
);

/**
 * 計算融資缺口（緩存）
 */
export const selectFinancingGap = createSelector(
  [selectPurchasePrice, selectTotalFinancing],
  (purchasePrice, totalFinancing) => {
    const gap = purchasePrice - totalFinancing;
    return {
      amount: Math.abs(gap),
      isShortfall: gap > 0,
      isSurplus: gap < 0,
      isBalanced: Math.abs(gap) < 0.01
    };
  }
);