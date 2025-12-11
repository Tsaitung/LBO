/**
 * 損益表計算
 * 純函數實現，無副作用
 */

import {
  BusinessMetricsBeforeAcquisition,
  FutureAssumptions,
  IncomeStatementData,
  DebtScheduleData,
  MnaDealDesign,
  ScenarioAssumptions,
} from '../../types/financial';
import { calculateTotalInterest } from './debtSchedule';
import { DealCalculator } from '../../domain/deal/DealCalculator';

/**
 * 計算年度營收
 */
function calculateRevenue(
  baseRevenue: number,
  growthRate: number,
  year: number
): number {
  if (year === 0) {
    return baseRevenue;
  }
  // 複合增長
  return baseRevenue * Math.pow(1 + growthRate / 100, year);
}

/**
 * 計算 COGS (銷貨成本)
 */
function calculateCOGS(
  revenue: number,
  cogsPercentage: number
): number {
  return revenue * (cogsPercentage / 100);
}

/**
 * 計算毛利 (Gross Profit)
 */
function calculateGrossProfit(
  revenue: number,
  cogs: number
): number {
  return revenue - cogs;
}

/**
 * 計算毛利率 (Gross Margin)
 */
function calculateGrossMargin(
  grossProfit: number,
  revenue: number
): number {
  if (revenue === 0) return 0;
  return (grossProfit / revenue) * 100;
}

/**
 * 計算營業費用 (Operating Expenses)
 */
function calculateOperatingExpenses(
  revenue: number,
  opexPercentage: number
): number {
  return revenue * (opexPercentage / 100);
}

/**
 * 計算 EBITDA (從毛利開始)
 */
function calculateEBITDA(
  grossProfit: number,
  operatingExpenses: number
): number {
  return grossProfit - operatingExpenses;
}


/**
 * 計算稅金
 */
function calculateTaxes(
  ebit: number,
  taxRate: number
): number {
  // 只對正的 EBIT 徵稅
  return Math.max(0, ebit * (taxRate / 100));
}

/**
 * 計算損益表
 * 主函數
 *
 * @param dealDesign - 交易設計（可選），用於計算資產收購的遞延付款費用
 * @param scenario - 情境假設（可選），用於計算 EV
 */
export function calculateIncomeStatement(
  businessMetrics: BusinessMetricsBeforeAcquisition,
  assumptions: FutureAssumptions,
  planningHorizon: number,
  debtSchedule: DebtScheduleData[],
  dealDesign?: MnaDealDesign,
  scenario?: ScenarioAssumptions
): IncomeStatementData[] {
  const incomeStatements: IncomeStatementData[] = [];

  // 以 Year 0 的固定資產作為起點，用於推導後續年度的折舊與固定資產走勢
  let estimatedFixedAssets = businessMetrics.propertyPlantEquipment; // 單位：仟元
  const usefulLifeYears = Math.max(1, assumptions.fixedAssetsToCapexMultiple || 10); // 將倍數解讀為折舊年限

  // 判斷是否為資產收購
  const isAssetDeal = dealDesign?.dealType === 'assetAcquisition';

  // 計算購買價格（用於遞延付款費用計算）
  // 使用 Year 0 EBITDA 作為基礎
  const year0EBITDA = businessMetrics.ebitda || (businessMetrics.revenue * 0.15); // fallback 15%
  const purchasePrice = scenario?.entryEvEbitdaMultiple
    ? DealCalculator.calculateEnterpriseValue(year0EBITDA, scenario.entryEvEbitdaMultiple)
    : 0;

  // Year 0 數據 - 使用業務指標中的實際數據
  const year0COGS = businessMetrics.cogs || (businessMetrics.revenue * (assumptions.cogsAsPercentageOfRevenue / 100));
  const year0GrossProfit = businessMetrics.grossProfit || (businessMetrics.revenue - year0COGS);
  const year0GrossMargin = businessMetrics.grossMargin || calculateGrossMargin(year0GrossProfit, businessMetrics.revenue);
  const year0OperatingExpenses = businessMetrics.operatingExpenses || (businessMetrics.revenue * (assumptions.operatingExpensesAsPercentageOfRevenue / 100));

  // Year 0 EBITDA 現在是計算得出的，而非獨立輸入
  const year0EBITDACalc = calculateEBITDA(year0GrossProfit, year0OperatingExpenses);

  incomeStatements.push({
    year: 0,
    revenue: businessMetrics.revenue,
    cogs: year0COGS,
    grossProfit: year0GrossProfit,
    grossMargin: year0GrossMargin,
    operatingExpenses: year0OperatingExpenses,
    ebitda: year0EBITDACalc, // 使用計算得出的 EBITDA
    depreciationAmortization: businessMetrics.depreciationAmortization,
    interestExpense: businessMetrics.interestExpense,
    deferredPaymentExpense: 0, // Year 0 無遞延付款費用
    ebit: year0EBITDACalc - businessMetrics.depreciationAmortization, // 使用計算的 EBITDA
    taxes: businessMetrics.taxExpense,
    netIncome: businessMetrics.netIncome,
  });

  // 預測年度
  for (let year = 1; year <= planningHorizon; year++) {
    // 計算營收
    const revenue = calculateRevenue(
      businessMetrics.revenue,
      assumptions.revenueGrowthRate,
      year
    );

    // 計算 COGS 和毛利
    const cogsPercentage = assumptions.cogsAsPercentageOfRevenue;
    const cogs = calculateCOGS(revenue, cogsPercentage);
    const grossProfit = calculateGrossProfit(revenue, cogs);
    const grossMargin = calculateGrossMargin(grossProfit, revenue);

    // 計算營業費用
    const opexPercentage = assumptions.operatingExpensesAsPercentageOfRevenue;
    const operatingExpenses = calculateOperatingExpenses(revenue, opexPercentage);

    // 計算 EBITDA (新方法)
    const ebitda = calculateEBITDA(grossProfit, operatingExpenses);

    // 計算資本支出（用於更新固定資產及推導折舊）
    const capex = revenue * (assumptions.capexAsPercentageOfRevenue / 100);

    // 以「固定資產年限 = fixedAssetsToCapexMultiple」推導折舊：D&A = 期初固定資產 / 年限
    const depreciationAmortization = estimatedFixedAssets / usefulLifeYears;

    // 計算利息費用
    const interestExpense = calculateTotalInterest(debtSchedule, year);

    // 計算資產收購遞延付款費用（Year 1+ 的付款視為費用）
    // 僅適用於資產收購，且有設定 dealDesign 的情況
    let deferredPaymentExpense = 0;
    if (isAssetDeal && dealDesign && purchasePrice > 0) {
      deferredPaymentExpense = DealCalculator.calculateDeferredPaymentExpense(
        purchasePrice,
        year,
        dealDesign
      );
    }

    // 計算 EBIT（含遞延付款費用）
    // 遞延付款費用視為營業外費用，從 EBIT 扣除
    const ebit = ebitda - depreciationAmortization - deferredPaymentExpense;

    // 計算稅金（遞延付款費用可抵稅）
    const taxes = calculateTaxes(ebit - interestExpense, assumptions.taxRate);

    // 計算淨利
    const netIncome = ebit - interestExpense - taxes;

    incomeStatements.push({
      year,
      revenue,
      cogs,
      grossProfit,
      grossMargin,
      operatingExpenses,
      ebitda,
      depreciationAmortization,
      interestExpense,
      deferredPaymentExpense,
      ebit,
      taxes,
      netIncome,
    });

    // 更新推導中的固定資產餘額，供下一年度使用
    estimatedFixedAssets = Math.max(0, estimatedFixedAssets + capex - depreciationAmortization);
  }

  return incomeStatements;
}

/**
 * 計算營收增長率
 */
export function calculateRevenueGrowth(
  currentRevenue: number,
  previousRevenue: number
): number {
  if (previousRevenue === 0) {
    return 0;
  }
  return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
}

/**
 * 計算 EBITDA 利潤率
 */
export function calculateEBITDAMargin(
  ebitda: number,
  revenue: number
): number {
  if (revenue === 0) {
    return 0;
  }
  return (ebitda / revenue) * 100;
}

/**
 * 計算淨利率
 */
export function calculateNetMargin(
  netIncome: number,
  revenue: number
): number {
  if (revenue === 0) {
    return 0;
  }
  return (netIncome / revenue) * 100;
}
