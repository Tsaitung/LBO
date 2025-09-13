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
  ScenarioKey,
  DealDesignWithPlans
} from '../types/hooks.types';
import { ScenarioAssumptions } from '../types/financial';
import {
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
  DebtScheduleData,
  CovenantData,
  KPIMetrics
} from '../types/financial';

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

// 便利的選擇器 hooks
export const useBusinessMetrics = () => {
  return useSmartSelector(
    (state) => state.lbo.businessMetrics,
    (state) => state.businessMetrics
  );
};

export const useFutureAssumptions = () => {
  return useSmartSelector(
    (state) => state.lbo.futureAssumptions,
    (state) => state.assumptions
  );
};

// Alias for legacy naming
export const useAssumptions = () => useFutureAssumptions();

export const useMnaDealDesign = () => {
  return useSmartSelector(
    (state) => state.lbo.mnaDealDesign,
    (state) => state.mnaDeal
  );
};

// Alias for legacy naming
export const useMnaDeal = () => useMnaDealDesign();

export const useFinancingPlans = () => {
  return useSmartSelector(
    (state) => state.lbo.financingPlans,
    (state) => state.financingPlan.plans
  );
};

export const useCurrentScenario = (): ScenarioKey => {
  return useSmartSelector(
    (state) => state.lbo.currentScenario,
    (state) => {
      const cur = state.scenarios.current as string;
      if (cur === 'upside') return 'upper';
      if (cur === 'downside') return 'lower';
      return cur as ScenarioKey; // 'base'
    }
  );
};

export const useScenarios = (): ScenariosContainer => {
  return useSmartSelector(
    (state) => {
      // Convert legacy format to ScenariosContainer
      const legacyScenarios = state.lbo.scenarios;
      return {
        base: legacyScenarios.base,
        upper: legacyScenarios.upper,
        lower: legacyScenarios.lower,
      } as ScenariosContainer;
    },
    (state) => {
      const s = state.scenarios as {
        current?: string;
        scenarios?: {
          base?: ScenarioAssumptions;
          upside?: ScenarioAssumptions;
          downside?: ScenarioAssumptions;
        };
        base?: ScenarioAssumptions;
        upside?: ScenarioAssumptions;
        downside?: ScenarioAssumptions;
      };
      const scenarios = s?.scenarios || {};
      return {
        base: scenarios.base || s?.base || {} as ScenarioAssumptions,
        upper: scenarios.upside || s?.upside,
        lower: scenarios.downside || s?.downside,
      } as ScenariosContainer;
    }
  );
};

// Calculations hooks (migrated from legacy useAppSelectors)
export const useCalculationInput = (): CalculationInput | null => {
  const businessMetrics = useBusinessMetrics();
  const assumptions = useAssumptions();
  const dealDesign = useMnaDeal() as DealDesignWithPlans;
  const scenarios = useScenarios();
  const currentKey = useCurrentScenario();
  const scenario = scenarios[currentKey];
  
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
