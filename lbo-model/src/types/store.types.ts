/**
 * Store Types - 支持新舊架構的類型定義
 * 遵循 Linus 原則：Never break userspace
 */

import { 
  BusinessMetricsBeforeAcquisition, 
  FutureAssumptions, 
  MnaDealDesign, 
  FinancingPlan, 
  ScenarioAssumptions,
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
  DebtScheduleData,
  DebtStructure,
  CovenantData,
  KPIMetrics
} from './financial';
import { ProFormaDataItem } from '../components/strategic-analysis/hooks/useProFormaData';

// Re-export types that other modules need
export type { ScenarioAssumptions };

// Legacy State 介面（現有）
export interface LBOState {
  businessMetrics: BusinessMetricsBeforeAcquisition;
  futureAssumptions: FutureAssumptions;
  mnaDealDesign: MnaDealDesign;
  financingPlans: FinancingPlan[];
  scenarios: {
    current: 'base' | 'upper' | 'lower';
    base: ScenarioAssumptions;
    upper: ScenarioAssumptions;
    lower: ScenarioAssumptions;
  };
  calculatedResults?: ProFormaDataItem[];
  incomeStatement: IncomeStatementData[];
  balanceSheet: BalanceSheetData[];
  cashFlow: CashFlowData[];
  debtSchedule: DebtScheduleData[];
  debtStructure: DebtStructure;
  covenants: CovenantData[];
  kpiMetrics: KPIMetrics;
  scenarioData: {
    base: ProFormaDataItem[];
    upper: ProFormaDataItem[];
    lower: ProFormaDataItem[];
  };
  currentScenario: 'base' | 'upper' | 'lower';
  isCalculated: boolean;
  yearZeroData: ProFormaDataItem;
}

// 新的模組化 State 介面
export interface BusinessMetricsState extends BusinessMetricsBeforeAcquisition {}

export interface AssumptionsState extends FutureAssumptions {}

export interface MnaDealDesignState extends MnaDealDesign {}

export interface FinancingPlanState {
  plans: FinancingPlan[];
  selectedPlanId?: string;
}

export interface ScenariosState {
  current: 'base' | 'upper' | 'lower';
  base: ScenarioAssumptions;
  upper: ScenarioAssumptions;
  lower: ScenarioAssumptions;
  calculatedResults?: ProFormaDataItem[];
}

// 模組化 RootState
export interface ModularRootState {
  businessMetrics: BusinessMetricsState;
  assumptions: AssumptionsState;
  mnaDeal: MnaDealDesignState;
  financingPlan: FinancingPlanState;
  scenarios: ScenariosState;
}

// Legacy RootState
export interface LegacyRootState {
  lbo: LBOState;
}

// 聯合類型支持兩種架構
export type AppRootState = LegacyRootState | ModularRootState;

// 類型守衛
export const isModularState = (state: AppRootState): state is ModularRootState => {
  return 'businessMetrics' in state && !('lbo' in state);
};

export const isLegacyState = (state: AppRootState): state is LegacyRootState => {
  return 'lbo' in state;
};

// 類型輔助函數
export const getBusinessMetrics = (state: AppRootState): BusinessMetricsBeforeAcquisition => {
  if (isModularState(state)) {
    return state.businessMetrics;
  }
  return state.lbo.businessMetrics;
};

export const getAssumptions = (state: AppRootState): FutureAssumptions => {
  if (isModularState(state)) {
    return state.assumptions;
  }
  return state.lbo.futureAssumptions;
};

export const getMnaDealDesign = (state: AppRootState): MnaDealDesign => {
  if (isModularState(state)) {
    return state.mnaDeal;
  }
  return state.lbo.mnaDealDesign;
};

export const getFinancingPlans = (state: AppRootState): FinancingPlan[] => {
  if (isModularState(state)) {
    return state.financingPlan.plans;
  }
  return state.lbo.financingPlans;
};

export const getCurrentScenario = (state: AppRootState): 'base' | 'upper' | 'lower' => {
  if (isModularState(state)) {
    return state.scenarios.current;
  }
  return state.lbo.currentScenario;
};
