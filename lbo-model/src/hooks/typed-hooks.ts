/**
 * Typed Hooks - 智能選擇器支持新舊架構
 * 實現零破壞性遷移
 */

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { useMemo } from 'react';
import { 
  AppRootState, 
  ModularRootState, 
  LegacyRootState, 
} from '../types/store.types';
import { AppDispatch } from '../store/store';
import { calculateLBO } from '../calculations';
import { AnyAction } from '@reduxjs/toolkit';
import { 
  ScenariosContainer,
  CalculationInput,
  CalculationResults,
  ScenarioKeyModular,
  DealDesignWithPlans
} from '../types/hooks.types';
import { ScenarioAssumptions, FutureAssumptions } from '../types/financial';
import {
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
  DebtScheduleData,
  CovenantData,
  KPIMetrics
} from '../types/financial';
import {
  selectFutureAssumptions,
  selectScenariosObject,
  selectCurrentScenarioAssumptions,
  selectBusinessMetrics as selectBusinessMetricsMemoized,
  selectMnaDeal as selectMnaDealMemoized,
  selectCurrentScenarioKey,
  selectFinancingPlans as selectFinancingPlansMemoized,
} from '../store/selectors/memoized/proForma.selectors';

// 類型化的 hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppRootState> = useSelector;

/**
 * 智能選擇器 - 自動適配新舊架構
 * 這是遷移的核心，允許組件在不修改的情況下工作於兩種架構
 */
export const useSmartSelector = <T>(
  legacySelector: (state: LegacyRootState) => T,
  modularSelector: (state: ModularRootState) => T
): T => {
  return useAppSelector((state) => {
    // Legacy facade has been removed - always use modular
    // This ensures we don't try to access undefined state.lbo
    return modularSelector(state as ModularRootState);
  });
};

/**
 * 智能 dispatch - 根據環境選擇正確的 action
 */
export const useSmartDispatch = () => {
  const dispatch = useAppDispatch();
  const useModular = process.env.REACT_APP_USE_MODULAR === 'true';
  
  return {
    dispatch,
    isModular: useModular,
    dispatchSmart: (
      legacyAction: AnyAction,
      modularAction: AnyAction
    ) => {
      dispatch(useModular ? modularAction : legacyAction);
    }
  };
};

// 便利的選擇器 hooks - 使用 memoized selectors
export const useBusinessMetrics = () => {
  return useAppSelector(selectBusinessMetricsMemoized);
};

/**
 * 從當前情境取得完整假設（ScenarioAssumptions 格式）
 * 使用 memoized selector
 */
export const useScenarioAssumptions = (): ScenarioAssumptions => {
  return useAppSelector(selectCurrentScenarioAssumptions);
};

/**
 * 從當前情境取得假設（轉換為 FutureAssumptions 格式）
 * 用於計算層兼容 - 使用 memoized selector
 */
export const useFutureAssumptions = (): FutureAssumptions => {
  return useAppSelector(selectFutureAssumptions);
};

// Alias for legacy naming
export const useAssumptions = () => useFutureAssumptions();

/**
 * 從當前情境取得假設（直接使用 ScenarioAssumptions）
 * 新組件應使用此 hook
 */
export const useActiveAssumptions = useScenarioAssumptions;

export const useMnaDealDesign = () => {
  return useAppSelector(selectMnaDealMemoized);
};

// Alias for legacy naming
export const useMnaDeal = () => useMnaDealDesign();

export const useFinancingPlans = () => {
  return useAppSelector(selectFinancingPlansMemoized);
};

export const useCurrentScenario = (): ScenarioKeyModular => {
  return useAppSelector(selectCurrentScenarioKey) as ScenarioKeyModular;
};

export const useScenarios = (): ScenariosContainer => {
  // 直接使用基礎 selector，避免 identity function 警告
  return useAppSelector(selectScenariosObject) as ScenariosContainer;
};

// Calculations hooks (migrated from legacy useAppSelectors)
export const useCalculationInput = (): CalculationInput | null => {
  const businessMetrics = useBusinessMetrics();
  const assumptions = useAssumptions();
  const dealDesign = useMnaDeal() as DealDesignWithPlans;
  // 直接獲取當前 scenario，避免經過 useScenarios() 創建不穩定物件
  const scenario = useScenarioAssumptions();

  // 使用 useMemo 避免每次渲染都創建新物件
  return useMemo(() => {
    if (!businessMetrics || !assumptions || !dealDesign || !scenario) {
      return null;
    }
    return {
      businessMetrics,
      assumptions,
      dealDesign,
      financingPlans: dealDesign?.financingPlans || [],
      equityInjections: dealDesign?.equityInjections || [],
      scenario,
      planningHorizon: dealDesign?.planningHorizon || 5
    };
  }, [businessMetrics, assumptions, dealDesign, scenario]);
  // 移除 scenarios 和 currentKey 依賴，因為 scenario 已經是當前情境的值
};

export const useCalculatedResults = (): CalculationResults | null => {
  const input = useCalculationInput();
  return useMemo(() => {
    if (!input) {
      return null;
    }
    return calculateLBO(input) as CalculationResults;
  }, [input]);
};

export const useIncomeStatements = (): IncomeStatementData[] => {
  const results = useCalculatedResults();
  return results?.incomeStatement || [];
};

export const useBalanceSheets = (): BalanceSheetData[] => {
  const results = useCalculatedResults();
  return results?.balanceSheet || [];
};

export const useCashFlows = (): CashFlowData[] => {
  const results = useCalculatedResults();
  return results?.cashFlow || [];
};

export const useDebtSchedule = (): DebtScheduleData[] => {
  const results = useCalculatedResults();
  return results?.debtSchedule || [];
};

export const useCovenants = (): CovenantData[] => {
  const results = useCalculatedResults();
  return results?.covenants || [];
};

export const useKPIMetrics = (): KPIMetrics => {
  const results = useCalculatedResults();
  return results?.kpiMetrics || { irr: 0, moic: 0, entryMultiple: 0, exitMultiple: 0, totalReturn: 0, paybackPeriod: 0 };
};

export const useIsCalculated = (): boolean => {
  const results = useCalculatedResults();
  return Boolean(results?.isValid);
};
