/**
 * LBO 計算引擎主接口
 * 統一的計算入口，將所有計算邏輯從 Redux 分離
 * 遵循 Linus 原則：消除特殊情況，保持簡單
 */

import {
  BusinessMetricsBeforeAcquisition,
  FutureAssumptions,
  MnaDealDesign,
  FinancingPlan,
  EquityInjection,
  ScenarioAssumptions,
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
  DebtScheduleData,
  CovenantData,
  KPIMetrics,
} from '../types/financial';

import { calculateIncomeStatement } from './financial/incomeStatement';
import { calculateBalanceSheet } from './financial/balanceSheet';
import { calculateCashFlow } from './financial/cashFlow';
import { calculateDebtSchedule } from './financial/debtSchedule';
import { validateInput } from './validators/inputValidator';

/**
 * 計算輸入數據結構
 */
export interface CalculationInput {
  businessMetrics: BusinessMetricsBeforeAcquisition;
  assumptions: FutureAssumptions;
  dealDesign: MnaDealDesign;
  financingPlans: FinancingPlan[];
  equityInjections: EquityInjection[];
  scenario: ScenarioAssumptions;
  planningHorizon: number;
}

/**
 * 計算結果數據結構
 */
export interface CalculationResult {
  incomeStatement: IncomeStatementData[];
  balanceSheet: BalanceSheetData[];
  cashFlow: CashFlowData[];
  debtSchedule: DebtScheduleData[];
  covenants: CovenantData[];
  kpiMetrics: KPIMetrics;
  isValid: boolean;
  errors: string[];
}

/**
 * 計算 KPI 指標
 */
function calculateKPIMetrics(
  input: CalculationInput,
  cashFlow: CashFlowData[],
  balanceSheet: BalanceSheetData[]
): KPIMetrics {
  const { scenario, planningHorizon } = input;
  // const { businessMetrics } = input; // Reserved for future calculations
  
  // 計算企業價值 (reserved for future calculations)
  // const entryEV = (businessMetrics.ebitda / 1000) * scenario.entryEvEbitdaMultiple;
  const exitYear = cashFlow[cashFlow.length - 1];
  const exitEbitda = exitYear ? exitYear.operatingCashFlow + (balanceSheet[balanceSheet.length - 1]?.nwc || 0) : 0;
  const exitEV = exitEbitda * scenario.exitEvEbitdaMultiple;
  
  // 計算股權投資
  const totalEquity = input.equityInjections.reduce((sum, eq) => sum + eq.amount, 0);
  
  // 簡化的 IRR 計算（實際應該用更精確的方法）
  const irr = totalEquity > 0 ? ((exitEV / totalEquity) ** (1 / planningHorizon) - 1) * 100 : 0;
  const moic = totalEquity > 0 ? exitEV / totalEquity : 0;
  
  return {
    irr,
    moic,
    entryMultiple: scenario.entryEvEbitdaMultiple,
    exitMultiple: scenario.exitEvEbitdaMultiple,
    totalReturn: exitEV - totalEquity,
    paybackPeriod: planningHorizon, // 簡化處理
  };
}

/**
 * 計算契約條款
 */
function calculateCovenants(
  debtSchedule: DebtScheduleData[],
  incomeStatement: IncomeStatementData[],
  cashFlow: CashFlowData[]
): CovenantData[] {
  const covenants: CovenantData[] = [];
  
  // 按年度分組債務數據
  const debtByYear = new Map<number, DebtScheduleData[]>();
  debtSchedule.forEach(debt => {
    if (!debtByYear.has(debt.year)) {
      debtByYear.set(debt.year, []);
    }
    debtByYear.get(debt.year)!.push(debt);
  });
  
  incomeStatement.forEach(income => {
    const yearDebts = debtByYear.get(income.year) || [];
    const totalDebt = yearDebts.reduce((sum, d) => sum + d.endingBalance, 0);
    const totalInterest = yearDebts.reduce((sum, d) => sum + d.interestExpense, 0);
    const totalPrincipal = yearDebts.reduce((sum, d) => sum + d.principalRepayment, 0);
    
    const cash = cashFlow.find(cf => cf.year === income.year)?.endingCash || 0;
    
    // 計算財務比率
    const dscr = (totalInterest + totalPrincipal) > 0 
      ? income.ebitda / (totalInterest + totalPrincipal) 
      : 999;
      
    const interestCoverage = totalInterest > 0 
      ? income.ebitda / totalInterest 
      : 999;
      
    const netLeverage = income.ebitda > 0 
      ? (totalDebt - cash) / income.ebitda 
      : 0;
    
    covenants.push({
      year: income.year,
      dscr,
      interestCoverage,
      netLeverage,
      isCompliant: dscr >= 1.2 && interestCoverage >= 2.5 && netLeverage <= 5.0,
    });
  });
  
  return covenants;
}

/**
 * 主計算函數 - 統一的 LBO 計算入口
 * 遵循 Linus 原則：簡單、無特殊情況
 */
export function calculateLBO(input: CalculationInput): CalculationResult {
  // Step 1: 驗證輸入
  const validation = validateInput(input);
  if (!validation.isValid) {
    return {
      incomeStatement: [],
      balanceSheet: [],
      cashFlow: [],
      debtSchedule: [],
      covenants: [],
      kpiMetrics: {
        irr: 0,
        moic: 0,
        entryMultiple: 0,
        exitMultiple: 0,
        totalReturn: 0,
        paybackPeriod: 0,
      },
      isValid: false,
      errors: validation.errors,
    };
  }

  try {
    // Step 2: 計算債務明細表
    const debtSchedule = calculateDebtSchedule(
      input.financingPlans,
      input.planningHorizon,
      input.assumptions
    );

    // Step 3: 計算損益表
    const incomeStatement = calculateIncomeStatement(
      input.businessMetrics,
      input.assumptions,
      input.planningHorizon,
      debtSchedule
    );

    // Step 4: 計算資產負債表
    const balanceSheet = calculateBalanceSheet(
      input.businessMetrics,
      input.assumptions,
      incomeStatement,
      debtSchedule,
      input.planningHorizon,
      input.scenario,
      input.dealDesign
    );

    // Step 5: 計算現金流量表
    const cashFlow = calculateCashFlow(
      incomeStatement,
      balanceSheet,
      debtSchedule,
      input.dealDesign,
      input.scenario,
      input.assumptions
    );

    // Step 6: 計算契約條款
    const covenants = calculateCovenants(debtSchedule, incomeStatement, cashFlow);

    // Step 7: 計算 KPI 指標
    const kpiMetrics = calculateKPIMetrics(input, cashFlow, balanceSheet);

    return {
      incomeStatement,
      balanceSheet,
      cashFlow,
      debtSchedule,
      covenants,
      kpiMetrics,
      isValid: true,
      errors: [],
    };
  } catch (error) {
    // 計算失敗時返回空結果
    return {
      incomeStatement: [],
      balanceSheet: [],
      cashFlow: [],
      debtSchedule: [],
      covenants: [],
      kpiMetrics: {
        irr: 0,
        moic: 0,
        entryMultiple: 0,
        exitMultiple: 0,
        totalReturn: 0,
        paybackPeriod: 0,
      },
      isValid: false,
      errors: [error instanceof Error ? error.message : '計算過程發生未知錯誤'],
    };
  }
}

/**
 * 批量計算多個情境
 */
export function calculateScenarios(
  baseInput: Omit<CalculationInput, 'scenario'>,
  scenarios: { base: ScenarioAssumptions; upper: ScenarioAssumptions; lower: ScenarioAssumptions }
): {
  base: CalculationResult;
  upper: CalculationResult;
  lower: CalculationResult;
} {
  return {
    base: calculateLBO({ ...baseInput, scenario: scenarios.base }),
    upper: calculateLBO({ ...baseInput, scenario: scenarios.upper }),
    lower: calculateLBO({ ...baseInput, scenario: scenarios.lower }),
  };
}

/**
 * 增量計算 - 只重算受影響的部分
 * 用於優化性能
 */
export function incrementalCalculation(
  previousResult: CalculationResult,
  changedFields: string[],
  newInput: CalculationInput
): CalculationResult {
  // 判斷是否需要完全重算
  const requiresFullRecalculation = changedFields.some(field => 
    field.includes('businessMetrics') || 
    field.includes('assumptions') ||
    field.includes('financingPlans')
  );

  if (requiresFullRecalculation) {
    return calculateLBO(newInput);
  }

  // 否則只更新受影響的部分（這裡簡化處理，實際可以更精細）
  return calculateLBO(newInput);
}