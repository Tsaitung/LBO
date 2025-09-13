/**
 * Enterprise Value Memoized Selectors
 * Following Linus principle: Calculate once, use everywhere
 * Performance optimization through memoization
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../store';

// Base selectors
const selectBusinessMetrics = (state: RootState) => state.businessMetrics;
const selectScenarios = (state: RootState) => state.scenarios;
const selectCurrentScenario = (state: RootState) => state.scenarios?.current || 'base';

// Memoized selector for current scenario data
export const selectCurrentScenarioData = createSelector(
  [selectScenarios, selectCurrentScenario],
  (scenarios, currentScenario) => {
    const scenarioData = scenarios?.scenarios?.[currentScenario];
    return scenarioData || {
      entryEvEbitdaMultiple: 0,
      exitEvEbitdaMultiple: 0,
      seniorDebtEbitda: 0,
      mezzDebtEbitda: 0,
      cogsAsPercentageOfRevenue: 0,
      operatingExpensesAsPercentageOfRevenue: 0,
      revenueGrowthRate: 0,
      ebitdaMargin: 0,
      netMargin: 0,
      capExPctSales: 0,
      nwcPctSales: 0,
      corporateTaxRate: 0,
    };
  }
);

// Memoized selector for enterprise value calculation
export const selectEnterpriseValue = createSelector(
  [selectBusinessMetrics, selectCurrentScenarioData],
  (businessMetrics, scenarioData) => {
    if (!businessMetrics || !scenarioData) return 0;
    
    const ebitdaInMillions = (businessMetrics.ebitda || 0) / 1000;
    const entryMultiple = scenarioData.entryEvEbitdaMultiple || 0;
    
    return ebitdaInMillions * entryMultiple;
  }
);

// Memoized selector for equity value calculation
export const selectEquityValue = createSelector(
  [selectEnterpriseValue, selectBusinessMetrics],
  (enterpriseValue, businessMetrics) => {
    if (!businessMetrics) return 0;
    
    const netDebt = (businessMetrics.totalLiabilities || 0) - 
                    (businessMetrics.cashAndCashEquivalents || 0);
    
    return enterpriseValue - (netDebt / 1000);
  }
);

// Memoized selector for valuation multiples
export const selectValuationMultiples = createSelector(
  [selectEnterpriseValue, selectBusinessMetrics],
  (enterpriseValue, businessMetrics) => {
    if (!businessMetrics || enterpriseValue === 0) {
      return {
        evToRevenue: 0,
        evToEbitda: 0,
        evToEbit: 0,
      };
    }
    
    const revenueInMillions = (businessMetrics.revenue || 0) / 1000;
    const ebitdaInMillions = (businessMetrics.ebitda || 0) / 1000;
    const ebitInMillions = ((businessMetrics.ebitda || 0) - 
                           (businessMetrics.depreciationAmortization || 0)) / 1000;
    
    return {
      evToRevenue: revenueInMillions > 0 ? enterpriseValue / revenueInMillions : 0,
      evToEbitda: ebitdaInMillions > 0 ? enterpriseValue / ebitdaInMillions : 0,
      evToEbit: ebitInMillions > 0 ? enterpriseValue / ebitInMillions : 0,
    };
  }
);

// Memoized selector for deal metrics
export const selectDealMetrics = createSelector(
  [selectEnterpriseValue, selectEquityValue, selectCurrentScenarioData],
  (enterpriseValue, equityValue, scenarioData) => {
    return {
      enterpriseValue,
      equityValue,
      entryMultiple: scenarioData.entryEvEbitdaMultiple,
      exitMultiple: scenarioData.exitEvEbitdaMultiple,
      impliedReturn: scenarioData.exitEvEbitdaMultiple > 0 
        ? (scenarioData.exitEvEbitdaMultiple / scenarioData.entryEvEbitdaMultiple - 1) * 100
        : 0,
    };
  }
);

// Performance benefit: These selectors only recalculate when their dependencies change
// Without memoization, these calculations would run on every render
// With memoization, they cache results and only recalculate when inputs change