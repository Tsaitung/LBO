/**
 * Hook Types
 * Type definitions for custom hooks
 * Following Linus principle: Strong types, clear contracts
 */

import { 
  FinancingPlan, 
  EquityInjection,
  ScenarioAssumptions,
  BusinessMetricsBeforeAcquisition,
  FutureAssumptions,
  MnaDealDesign,
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
  DebtScheduleData,
  CovenantData,
  KPIMetrics
} from './financial';

// Scenario container types for mixed naming conventions
export interface ScenariosContainer {
  base: ScenarioAssumptions;
  upper?: ScenarioAssumptions;
  lower?: ScenarioAssumptions;
  upside?: ScenarioAssumptions;
  downside?: ScenarioAssumptions;
  scenarios?: {
    base: ScenarioAssumptions;
    upside?: ScenarioAssumptions;
    downside?: ScenarioAssumptions;
  };
}

// LBO calculation input
export interface CalculationInput {
  businessMetrics: BusinessMetricsBeforeAcquisition;
  assumptions: FutureAssumptions;
  dealDesign: MnaDealDesign;
  financingPlans: FinancingPlan[];
  equityInjections: EquityInjection[];
  scenario: ScenarioAssumptions;
  planningHorizon: number;
}

// LBO calculation results
export interface CalculationResults {
  incomeStatement: IncomeStatementData[];
  balanceSheet: BalanceSheetData[];
  cashFlow: CashFlowData[];
  debtSchedule: DebtScheduleData[];
  covenants: CovenantData[];
  kpiMetrics: KPIMetrics;
  isValid: boolean;
}

// Scenario type mappings
export type ScenarioKey = 'base' | 'upper' | 'lower';
export type ScenarioKeyModular = 'base' | 'upside' | 'downside';

export function mapScenarioKey(key: ScenarioKeyModular): ScenarioKey {
  if (key === 'upside') return 'upper';
  if (key === 'downside') return 'lower';
  return 'base';
}

export function mapScenarioKeyReverse(key: ScenarioKey): ScenarioKeyModular {
  if (key === 'upper') return 'upside';
  if (key === 'lower') return 'downside';
  return 'base';
}

// Deal design with proper types
export interface DealDesignWithPlans extends MnaDealDesign {
  financingPlans: FinancingPlan[];
  equityInjections: EquityInjection[];
  planningHorizon: number;
}