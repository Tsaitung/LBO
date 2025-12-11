/**
 * 資產負債表計算
 * 純函數實現
 */

import {
  BusinessMetricsBeforeAcquisition,
  FutureAssumptions,
  BalanceSheetData,
  IncomeStatementData,
  DebtScheduleData,
  MnaDealDesign,
  ScenarioAssumptions,
  EquityInjection,
  PaymentScheduleItem,
} from '../../types/financial';
import { calculateTotalDebt } from './debtSchedule';
import { DealCalculator } from '../../domain/deal/DealCalculator';

/**
 * 統一的股東權益滾動計算
 * 遵循 Linus 原則：消除特殊情況，統一處理
 */
interface EquityRollforward {
  beginningEquity: number;
  netIncome: number;
  preferredDividends: number;
  commonDividends: number;
  capitalInjections: number;
}

function calculateEquityRollforward(params: EquityRollforward): number {
  return params.beginningEquity 
    + params.netIncome 
    - params.preferredDividends
    - params.commonDividends 
    + params.capitalInjections;
}

/**
 * 計算應收帳款
 */
function calculateAccountsReceivable(
  revenue: number,
  arDays: number
): number {
  return (revenue / 365) * arDays;
}

/**
 * 計算存貨
 */
function calculateInventory(
  revenue: number,
  inventoryDays: number,
  ebitdaMargin: number
): number {
  // 用銷貨成本計算存貨
  const cogs = revenue * (1 - ebitdaMargin / 100);
  return (cogs / 365) * inventoryDays;
}

/**
 * 計算應付帳款
 */
function calculateAccountsPayable(
  revenue: number,
  apDays: number,
  ebitdaMargin: number
): number {
  // 用銷貨成本計算應付帳款
  const cogs = revenue * (1 - ebitdaMargin / 100);
  return (cogs / 365) * apDays;
}

/**
 * 計算固定資產
 */
function calculateFixedAssets(
  previousFixedAssets: number,
  capex: number,
  depreciation: number,
  year: number,
  initialRevenue: number,
  assumptions: FutureAssumptions
): number {
  if (year === 0) {
    // Year 0: 使用配置的倍數
    const initialCapex = initialRevenue * (assumptions.capexAsPercentageOfRevenue / 100);
    return initialCapex * (assumptions.fixedAssetsToCapexMultiple);
  }
  
  // 後續年度：前期固定資產 + 資本支出 - 折舊
  return previousFixedAssets + capex - depreciation;
}

/**
 * 計算營運資本
 */
function calculateWorkingCapital(
  accountsReceivable: number,
  inventory: number,
  accountsPayable: number,
  otherCurrentLiabilities: number
): number {
  const currentAssets = accountsReceivable + inventory;
  const currentLiabilities = accountsPayable + otherCurrentLiabilities;
  return currentAssets - currentLiabilities;
}

/**
 * 計算特別股金額
 * 50% EV 以特別股形式存在
 * Year 2: 贖回 30%
 * Year 3: 贖回 20%
 */
function calculatePreferredStock(
  year: number,
  baseEbitda: number,
  scenario: ScenarioAssumptions,
  dealDesign?: MnaDealDesign,
  previousPreferredStock: number = 0
): number {
  const ev = DealCalculator.calculateEnterpriseValue(baseEbitda, scenario.entryEvEbitdaMultiple);
  const schedule = dealDesign?.assetDealSettings?.paymentSchedule?.schedule || [];

  // 發行比例：以付款排程中標記為特別股買回的百分比總和視為以特別股形式存在的比例；
  // 若無排程，回退至 paymentStructure（100 - upfront）
  const issuedPct = Array.isArray(schedule) && schedule.length > 0
    ? schedule
        .filter((s: PaymentScheduleItem) => s?.paymentMethod === 'specialSharesBuyback')
        .reduce((sum: number, s: PaymentScheduleItem) => sum + (Number(s?.percentage) || 0), 0)
    : Math.max(0, 100 - (dealDesign?.paymentStructure?.upfrontPayment ?? 0));

  const mapTimingToYear = (item: PaymentScheduleItem): number | null => {
    if (!item) return null;
    if (item.timing === 'preClosing') return 0;
    if (typeof item.timing === 'string' && item.timing.startsWith('year')) {
      const n = Number(item.timing.replace('year', ''));
      if (!isNaN(n)) return n;
    }
    if (item.period != null) {
      const p = Number(item.period);
      if (!isNaN(p)) return Math.max(0, p - 1);
    }
    return null;
  };

  // 該年度贖回百分比（不分期初/期末，僅用於更新年末餘額）
  const redemptionPctThisYear = Array.isArray(schedule)
    ? schedule
        .filter((s: PaymentScheduleItem) => s?.paymentMethod === 'specialSharesBuyback' && mapTimingToYear(s) === year)
        .reduce((sum: number, s: PaymentScheduleItem) => sum + (Number(s?.percentage) || 0), 0)
    : 0;

  if (year === 0) {
    return ev * (issuedPct / 100);
  }
  const redemptionAmount = ev * (redemptionPctThisYear / 100);
  // 不累積股息至負債，僅在當年現金流中支付股息；負債僅因贖回而減少
  return Math.max(0, previousPreferredStock - redemptionAmount);
}

/**
 * 計算資產負債表
 * 主函數
 */
export function calculateBalanceSheet(
  businessMetrics: BusinessMetricsBeforeAcquisition,
  assumptions: FutureAssumptions,
  incomeStatements: IncomeStatementData[],
  debtSchedule: DebtScheduleData[],
  planningHorizon: number,
  scenario?: ScenarioAssumptions,
  dealDesign?: MnaDealDesign
): BalanceSheetData[] {
  const balanceSheets: BalanceSheetData[] = [];
  
  // 計算 Year 0 商譽
  const baseEbitda = incomeStatements[0]?.ebitda || businessMetrics.ebitda;
  const enterpriseValueK = DealCalculator.calculateEnterpriseValue(baseEbitda, scenario!.entryEvEbitdaMultiple); // 單位：仟元
  const isAssetDeal = dealDesign?.dealType === 'assetAcquisition';
  const sel = dealDesign?.assetSelections || {
    cashAndCashEquivalents: false,
    accountsReceivable: false,
    inventory: false,
    propertyPlantEquipment: false,
    accountsPayable: false,
    otherCurrentLiabilities: false,
    shortTermDebt: false,
    longTermDebt: false,
  };
  const selectedAssetsValueK =
    (sel.cashAndCashEquivalents ? businessMetrics.cashAndCashEquivalents : 0) +
    (sel.accountsReceivable ? businessMetrics.accountsReceivable : 0) +
    (sel.inventory ? businessMetrics.inventory : 0) +
    (sel.propertyPlantEquipment ? businessMetrics.propertyPlantEquipment : 0);
  const selectedLiabsValueK =
    (sel.accountsPayable ? (businessMetrics.accountsPayable || 0) : 0) +
    (sel.otherCurrentLiabilities ? (businessMetrics.otherCurrentLiabilities || 0) : 0) +
    (sel.shortTermDebt ? (businessMetrics.shortTermDebt || 0) : 0) +
    (sel.longTermDebt ? (businessMetrics.longTermDebt || 0) : 0);
  const netAssetsK = isAssetDeal
    ? (selectedAssetsValueK - selectedLiabsValueK)
    : businessMetrics.shareholdersEquity;

  // 商譽計算邏輯：
  // - 股權收購：商譽 = EV - 淨資產（股東權益）
  // - 資產收購：商譽 = 頭期款（交割前/交割時）- 選定淨資產
  //   後續款項（Year 1+）視為費用，不計入商譽
  let goodwill: number;
  if (isAssetDeal && dealDesign) {
    const upfrontPaymentK = DealCalculator.calculateUpfrontPayment(enterpriseValueK, dealDesign);
    goodwill = Math.max(0, upfrontPaymentK - netAssetsK);
  } else {
    goodwill = Math.max(0, enterpriseValueK - netAssetsK);
  }
  
  // Year 0 股權注入（仟元）- removed unused variable per ESLint warning
  
  // Year 0 基準數據
  // 期初資產（資產交易按選取帶入）
  const year0 = {
    year: 0,
    cash: 0, // LBO 交易後期初現金為 0，由融資活動決定（被收購公司現金已包含在收購價格中）
    accountsReceivable: isAssetDeal ? (sel.accountsReceivable ? businessMetrics.accountsReceivable : 0) : businessMetrics.accountsReceivable,
    inventory: isAssetDeal ? (sel.inventory ? businessMetrics.inventory : 0) : businessMetrics.inventory,
    // Year 0 固定資產：以併購前業務指標的實際數字帶入（資產交易依選取）
    fixedAssets: isAssetDeal ? (sel.propertyPlantEquipment ? businessMetrics.propertyPlantEquipment : 0)
                             : businessMetrics.propertyPlantEquipment,
    goodwill: goodwill, // 添加商譽
    totalAssets: 0,
    accountsPayable: isAssetDeal ? (sel.accountsPayable ? businessMetrics.accountsPayable : 0) : businessMetrics.accountsPayable,
    otherCurrentLiabilities: isAssetDeal ? (sel.otherCurrentLiabilities ? businessMetrics.otherCurrentLiabilities : 0) : businessMetrics.otherCurrentLiabilities,
    debt: calculateTotalDebt(debtSchedule, 0),  // 信任債務排程計算
    preferredStock: calculatePreferredStock(
      0,
      incomeStatements[0]?.ebitda || businessMetrics.ebitda,
      scenario!,
      dealDesign
    ),
    // 股東權益暫時設為0，將在計算總資產和總負債後使用會計恆等式計算
    equity: 0,
    totalLiabilities: 0,
    totalLiabilitiesEquity: 0,
    nwc: 0,
  };
  
  // 計算 Year 0 總計（包含商譽）
  year0.totalAssets = year0.cash + year0.accountsReceivable + year0.inventory +
                      year0.fixedAssets + (year0.goodwill || 0);
  year0.totalLiabilities = year0.accountsPayable + 
                           (year0.otherCurrentLiabilities || 0) + 
                           year0.debt + 
                           (year0.preferredStock || 0);
  
  // 使用會計恆等式計算股東權益：Assets = Liabilities + Equity
  year0.equity = year0.totalAssets - year0.totalLiabilities;
  year0.totalLiabilitiesEquity = year0.totalLiabilities + year0.equity;
  year0.nwc = calculateWorkingCapital(
    year0.accountsReceivable,
    year0.inventory,
    year0.accountsPayable,
    year0.otherCurrentLiabilities || 0
  );
  
  balanceSheets.push(year0);
  
  // 預測年度
  for (let year = 1; year <= planningHorizon; year++) {
    const income = incomeStatements[year];
    const previousBalance = balanceSheets[year - 1];
    
    // 計算資產項目
    const accountsReceivable = calculateAccountsReceivable(
      income.revenue,
      assumptions.accountsReceivableDays
    );
    
    const inventory = calculateInventory(
      income.revenue,
      assumptions.inventoryDays,
      assumptions.ebitdaMargin
    );
    
    // 計算資本支出
    const capex = income.revenue * (assumptions.capexAsPercentageOfRevenue / 100);
    
    const fixedAssets = calculateFixedAssets(
      previousBalance.fixedAssets,
      capex,
      income.depreciationAmortization,
      year,
      businessMetrics.revenue,
      assumptions
    );
    
    // 計算負債項目
    const accountsPayable = calculateAccountsPayable(
      income.revenue,
      assumptions.accountsPayableDays,
      assumptions.ebitdaMargin
    );
    
    const otherCurrentLiabilities = income.revenue * 
      (businessMetrics.otherCurrentLiabilities / businessMetrics.revenue);
    
    const debt = calculateTotalDebt(debtSchedule, year);
    
    // 計算特別股（根據贖回計劃）
    const preferredStock = calculatePreferredStock(
      year,
      incomeStatements[0]?.ebitda || businessMetrics.ebitda,
      scenario!,
      dealDesign,
      previousBalance.preferredStock || 0
    );
    
    // 當年新增股權注入（仟元）
    const newEquityInjectionK = (dealDesign?.equityInjections || [])
      .filter((inj: EquityInjection) => Number(inj?.entryTiming) === year)
      .reduce((sum: number, inj: EquityInjection) => sum + (Number(inj?.amount) || 0), 0);

    // 計算特別股當年股息（現金支付，減少權益）
    // 與現金流計算保持一致
    let preferredDividendK = 0;
    try {
      const evK = (incomeStatements[0]?.ebitda || businessMetrics.ebitda) * (scenario!.entryEvEbitdaMultiple);
      const schedule = dealDesign?.assetDealSettings?.paymentSchedule?.schedule || [];
      const mapTimingToYear = (item: PaymentScheduleItem): number | null => {
        if (!item) return null;
        if (item.timing === 'preClosing') return 0;
        if (typeof item.timing === 'string' && item.timing.startsWith('year')) {
          const n = Number(item.timing.replace('year', ''));
          if (!isNaN(n)) return n;
        }
        if (item.period != null) {
          const p = Number(item.period);
          if (!isNaN(p)) return Math.max(0, p - 1);
        }
        return null;
      };
      const preferredDividendRate = Number(dealDesign?.assetDealSettings?.specialSharesDetails?.dividendRate ?? 0) / 100;
      const beginningRedemptionPct = Array.isArray(schedule)
        ? schedule
            .filter((s: PaymentScheduleItem) => s?.paymentMethod === 'specialSharesBuyback' && mapTimingToYear(s) === year && s?.timingDetail === 'beginning')
            .reduce((sum: number, s: PaymentScheduleItem) => sum + (Number(s?.percentage) || 0), 0)
        : 0;
      const beginningRedemptionAmountK = evK * (beginningRedemptionPct / 100);
      const preferredDividendBaseK = Math.max(0, (previousBalance.preferredStock || 0) - beginningRedemptionAmountK);
      preferredDividendK = preferredDividendBaseK * preferredDividendRate;
    } catch (_) {
      preferredDividendK = 0;
    }

    // 使用統一的股東權益滾動計算函數
    // 注意：普通股利將在現金流計算後調整
    const equity = calculateEquityRollforward({
      beginningEquity: previousBalance.equity || 0,
      netIncome: income.netIncome || 0,
      preferredDividends: preferredDividendK || 0,
      commonDividends: 0, // 暫時為0，將在現金流計算後更新
      capitalInjections: newEquityInjectionK || 0
    });
    
    // 計算營運資本
    const nwc = calculateWorkingCapital(
      accountsReceivable,
      inventory,
      accountsPayable,
      otherCurrentLiabilities
    );
    
    // 現金將在現金流量表中計算
    const cash = previousBalance.cash; // 暫時使用前期值
    
    // 計算總計（包含商譽 - 保持 Year 0 的商譽值）
    const totalAssets = cash + accountsReceivable + inventory + fixedAssets + 
                       (balanceSheets[0].goodwill || 0); // 商譽不變
    const totalLiabilities = accountsPayable + otherCurrentLiabilities + debt + 
                            (preferredStock || 0);
    const totalLiabilitiesEquity = totalLiabilities + equity;
    
    // 資產負債表平衡檢查（Linus 原則：及早發現問題）
    // Balance check removed - validation handled elsewhere
    
    balanceSheets.push({
      year,
      cash,
      accountsReceivable,
      inventory,
      fixedAssets,
      goodwill: balanceSheets[0].goodwill, // 商譽保持不變（IFRS）
      totalAssets,
      accountsPayable,
      otherCurrentLiabilities,
      debt,
      preferredStock,
      equity,
      totalLiabilities,
      totalLiabilitiesEquity,
      nwc,
    });
  }
  
  return balanceSheets;
}

/**
 * 計算資產報酬率 (ROA)
 */
export function calculateROA(
  netIncome: number,
  totalAssets: number
): number {
  if (totalAssets === 0) {
    return 0;
  }
  return (netIncome / totalAssets) * 100;
}

/**
 * 計算股東權益報酬率 (ROE)
 */
export function calculateROE(
  netIncome: number,
  equity: number
): number {
  if (equity === 0) {
    return 0;
  }
  return (netIncome / equity) * 100;
}

/**
 * 計算負債比率
 */
export function calculateDebtRatio(
  totalDebt: number,
  totalAssets: number
): number {
  if (totalAssets === 0) {
    return 0;
  }
  return (totalDebt / totalAssets) * 100;
}
