/**
 * Term Sheet 估值計算函數
 * 提供企業價值、股權價值、回報率等關鍵指標計算
 */

import { BusinessMetricsBeforeAcquisition } from '../../types/financial';

/**
 * 計算企業價值 (Enterprise Value)
 * EV = EBITDA × Entry Multiple
 */
export function calculateEnterpriseValue(
  ebitda: number,
  entryMultiple: number
): number {
  return Math.round(ebitda * entryMultiple);
}

/**
 * 計算股權價值 (Equity Value)
 * Equity Value = Enterprise Value - Net Debt + Cash
 */
export function calculateEquityValue(
  enterpriseValue: number,
  totalDebt: number,
  cash: number
): number {
  const netDebt = totalDebt - cash;
  return Math.round(enterpriseValue - netDebt);
}

/**
 * 計算購買價格 (Purchase Price)
 * 根據交易中包含的資產和負債計算實際支付價格
 */
export function calculatePurchasePrice(
  metrics: BusinessMetricsBeforeAcquisition
): {
  includedAssets: number;
  includedLiabilities: number;
  netPurchasePrice: number;
  adjustments: Array<{ item: string; amount: number; included: boolean }>;
} {
  const adjustments: Array<{ item: string; amount: number; included: boolean }> = [];
  let includedAssets = 0;
  let includedLiabilities = 0;

  // 資產項目
  if (metrics.cashIncludedInTransaction) {
    includedAssets += metrics.cashAndCashEquivalents;
    adjustments.push({
      item: '現金及約當現金',
      amount: metrics.cashAndCashEquivalents,
      included: true
    });
  }

  if (metrics.arIncludedInTransaction) {
    includedAssets += metrics.accountsReceivable;
    adjustments.push({
      item: '應收帳款',
      amount: metrics.accountsReceivable,
      included: true
    });
  }

  if (metrics.inventoryIncludedInTransaction) {
    includedAssets += metrics.inventory;
    adjustments.push({
      item: '存貨',
      amount: metrics.inventory,
      included: true
    });
  }

  if (metrics.ppeIncludedInTransaction) {
    includedAssets += metrics.propertyPlantEquipment;
    adjustments.push({
      item: '不動產廠房設備',
      amount: metrics.propertyPlantEquipment,
      included: true
    });
  }

  // 負債項目
  if (metrics.apIncludedInTransaction) {
    includedLiabilities += metrics.accountsPayable;
    adjustments.push({
      item: '應付帳款',
      amount: -metrics.accountsPayable,
      included: true
    });
  }

  if (metrics.stdIncludedInTransaction) {
    includedLiabilities += metrics.shortTermDebt;
    adjustments.push({
      item: '短期借款',
      amount: -metrics.shortTermDebt,
      included: true
    });
  }

  if (metrics.ltdIncludedInTransaction) {
    includedLiabilities += metrics.longTermDebt;
    adjustments.push({
      item: '長期借款',
      amount: -metrics.longTermDebt,
      included: true
    });
  }

  const netPurchasePrice = includedAssets - includedLiabilities;

  return {
    includedAssets,
    includedLiabilities,
    netPurchasePrice,
    adjustments
  };
}

/**
 * 計算估值倍數
 */
export function calculateValuationMultiples(
  enterpriseValue: number,
  revenue: number,
  ebitda: number,
  netIncome: number
): {
  evToRevenue: number;
  evToEbitda: number;
  peRatio: number;
} {
  return {
    evToRevenue: revenue > 0 ? Number((enterpriseValue / revenue).toFixed(2)) : 0,
    evToEbitda: ebitda > 0 ? Number((enterpriseValue / ebitda).toFixed(2)) : 0,
    peRatio: netIncome > 0 ? Number((enterpriseValue / netIncome).toFixed(2)) : 0
  };
}

/**
 * 計算債務指標
 */
export function calculateDebtMetrics(
  totalDebt: number,
  ebitda: number,
  interestExpense: number
): {
  debtToEbitda: number;
  interestCoverage: number;
  debtService: number;
} {
  return {
    debtToEbitda: ebitda > 0 ? Number((totalDebt / ebitda).toFixed(2)) : 0,
    interestCoverage: interestExpense > 0 ? Number((ebitda / interestExpense).toFixed(2)) : 0,
    debtService: interestExpense // 簡化版，實際應包含本金償還
  };
}

/**
 * 計算投資回報預測
 * 簡化版 IRR 和 MOIC 計算
 */
export function calculateProjectedReturns(
  initialEquity: number,
  exitMultiple: number,
  projectedEbitda: number,
  holdingPeriod: number,
  totalDebtAtExit: number
): {
  exitEnterpriseValue: number;
  exitEquityValue: number;
  moic: number;
  irr: number;
} {
  const exitEnterpriseValue = projectedEbitda * exitMultiple;
  const exitEquityValue = Math.max(0, exitEnterpriseValue - totalDebtAtExit);
  const moic = initialEquity > 0 ? exitEquityValue / initialEquity : 0;
  
  // 簡化的 IRR 計算（使用 MOIC 和持有期）
  const irr = holdingPeriod > 0 ? (Math.pow(moic, 1 / holdingPeriod) - 1) * 100 : 0;

  return {
    exitEnterpriseValue: Math.round(exitEnterpriseValue),
    exitEquityValue: Math.round(exitEquityValue),
    moic: Number(moic.toFixed(2)),
    irr: Number(irr.toFixed(1))
  };
}

/**
 * 計算融資結構百分比
 */
export function calculateFinancingMix(
  seniorDebt: number,
  mezzanineDebt: number,
  equityInvestment: number
): {
  total: number;
  seniorPct: number;
  mezzaninePct: number;
  equityPct: number;
} {
  const total = seniorDebt + mezzanineDebt + equityInvestment;
  
  return {
    total,
    seniorPct: total > 0 ? Number(((seniorDebt / total) * 100).toFixed(1)) : 0,
    mezzaninePct: total > 0 ? Number(((mezzanineDebt / total) * 100).toFixed(1)) : 0,
    equityPct: total > 0 ? Number(((equityInvestment / total) * 100).toFixed(1)) : 0
  };
}

/**
 * 格式化金額顯示
 */
export function formatCurrency(
  amount: number,
  currency: 'TWD' | 'USD' = 'TWD',
  scale: 'thousands' | 'millions' = 'thousands'
): string {
  const scaledAmount = scale === 'millions' ? amount / 1000 : amount;
  const currencySymbol = currency === 'USD' ? '$' : 'NT$';
  const unit = scale === 'millions' ? 'M' : 'K';
  
  return `${currencySymbol}${scaledAmount.toLocaleString('zh-TW')}${unit}`;
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * 計算營運資本需求
 */
export function calculateWorkingCapitalRequirement(
  currentAssets: number,
  cash: number,
  currentLiabilities: number,
  shortTermDebt: number
): number {
  const operatingCurrentAssets = currentAssets - cash;
  const operatingCurrentLiabilities = currentLiabilities - shortTermDebt;
  return operatingCurrentAssets - operatingCurrentLiabilities;
}

/**
 * 驗證交易可行性
 */
export function validateTransactionFeasibility(
  enterpriseValue: number,
  availableFinancing: number,
  minimumEquity: number,
  maximumLeverage: number,
  ebitda: number
): {
  isFeasible: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // 檢查融資是否足夠
  if (availableFinancing < enterpriseValue) {
    issues.push('融資金額不足以支付企業價值');
    recommendations.push('增加債務融資或股權投資');
  }

  // 檢查槓桿率
  const impliedLeverage = (enterpriseValue - minimumEquity) / ebitda;
  if (impliedLeverage > maximumLeverage) {
    issues.push(`槓桿率 ${impliedLeverage.toFixed(1)}x 超過上限 ${maximumLeverage}x`);
    recommendations.push('降低收購價格或增加股權投資');
  }

  // 檢查最低股權要求
  const equityPercentage = (minimumEquity / enterpriseValue) * 100;
  if (equityPercentage < 25) {
    issues.push('股權佔比過低，風險過高');
    recommendations.push('建議股權佔比至少 25-30%');
  }

  return {
    isFeasible: issues.length === 0,
    issues,
    recommendations
  };
}
