/**
 * 現金流量表計算
 * 純函數實現
 */

import {
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
  DebtScheduleData,
  MnaDealDesign,
  ScenarioAssumptions,
  FutureAssumptions,
  DebtProtectionCovenants,
  WaterfallRule,
  DividendTier,
  DividendDiagnostics,
} from '../../types/financial';
import { calculateTotalPrincipalRepayment } from './debtSchedule';
import { DealCalculator } from '../../domain/deal/DealCalculator';

/**
 * 檢查所有債務保護條件（Covenant）
 * 返回是否通過檢查及失敗的條件清單
 */
function checkAllCovenants(
  income: IncomeStatementData,
  balance: BalanceSheetData,
  debtSchedule: DebtScheduleData[],
  covenants: DebtProtectionCovenants | undefined,
  year: number
): { passed: boolean; failedCovenants: string[] } {
  if (!covenants) return { passed: true, failedCovenants: [] };

  const failedCovenants: string[] = [];

  // 1. DSCR 檢查 (Debt Service Coverage Ratio)
  if (covenants.dscr?.enabled) {
    const yearDebtService = debtSchedule
      .filter(d => d.year === year)
      .reduce((sum, d) => sum + (d.interestExpense || 0) + (d.principalRepayment || 0), 0);
    const dscr = yearDebtService > 0 ? (income.ebitda / yearDebtService) : Infinity;
    if (dscr < covenants.dscr.value) {
      failedCovenants.push('DSCR');
    }
  }

  // 2. Net Leverage 檢查 (Debt / EBITDA)
  if (covenants.netLeverage?.enabled) {
    const netLeverage = income.ebitda > 0 ? ((balance.debt || 0) / income.ebitda) : Infinity;
    if (netLeverage > covenants.netLeverage.value) {
      failedCovenants.push('NetLeverage');
    }
  }

  // 3. Interest Coverage 檢查 (EBITDA / Interest)
  if (covenants.interestCoverage?.enabled) {
    const intCov = (income.interestExpense || 0) > 0
      ? (income.ebitda / income.interestExpense)
      : Infinity;
    if (intCov < covenants.interestCoverage.value) {
      failedCovenants.push('InterestCoverage');
    }
  }

  // 4. Min Cash Months 檢查
  if (covenants.minCashMonths?.enabled) {
    const monthlyOpex = Math.max(0, (income.revenue - income.ebitda)) / 12;
    const cashMonths = monthlyOpex > 0 ? ((balance.cash || 0) / monthlyOpex) : Infinity;
    if (cashMonths < covenants.minCashMonths.value) {
      failedCovenants.push('MinCashMonths');
    }
  }

  return { passed: failedCovenants.length === 0, failedCovenants };
}

/**
 * 應用瀑布式分配邏輯
 * 按優先級順序分配可用現金
 */
function applyWaterfallDistribution(
  availableCash: number,
  waterfallRules: WaterfallRule[],
  preferredOutstanding: number,
  preferredRate: number
): { preferredRedemption: number; preferredDividend: number; commonDividend: number } {
  // 無規則時，全部作為普通股利
  if (!waterfallRules || waterfallRules.length === 0) {
    return { preferredRedemption: 0, preferredDividend: 0, commonDividend: availableCash };
  }

  let remaining = availableCash;
  const result = { preferredRedemption: 0, preferredDividend: 0, commonDividend: 0 };

  // 按優先級排序
  const sorted = [...waterfallRules].sort((a, b) => a.priority - b.priority);

  for (const rule of sorted) {
    if (remaining <= 0) break;

    let amount = 0;
    switch (rule.calculation) {
      case 'fixed':
        // 固定金額（UI 以百萬元為單位，轉換為仟元）
        amount = Math.min(rule.value * 1000, remaining);
        break;
      case 'percentage':
        // 百分比分配
        amount = remaining * (rule.value / 100);
        break;
      case 'formula':
        // 公式計算（目前僅支援優先股股息）
        if (rule.type === 'preferredDividend') {
          amount = Math.min(preferredOutstanding * (preferredRate / 100), remaining);
        }
        break;
    }

    // 分配到對應類型
    switch (rule.type) {
      case 'preferredRedemption':
        result.preferredRedemption += amount;
        break;
      case 'preferredDividend':
        result.preferredDividend += amount;
        break;
      case 'commonDividend':
        result.commonDividend += amount;
        break;
      // 'carried' 類型暫不處理
    }

    remaining -= amount;
  }

  return result;
}

/**
 * 選擇適用的分級觸發層級
 * 返回適用的 payoutRatio
 */
function selectApplicableTier(
  tiers: DividendTier[] | undefined,
  ebitda: number,
  fcff: number,
  leverage: number
): number {
  // 無層級設定時，預設 50%
  if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
    return 0.5;
  }

  // 由高 payoutRatio 到低檢查，找到第一個符合的層級
  const applicable = [...tiers]
    .sort((a, b) => (b.payoutRatio || 0) - (a.payoutRatio || 0))
    .find(t => {
      const okEbitda = ebitda >= ((t.ebitdaThreshold || 0) * 1000); // UI 百萬元 → 仟元
      const okFcff = fcff >= ((t.fcffThreshold || 0) * 1000);
      const okLev = leverage <= (t.leverageThreshold || Infinity);
      return okEbitda && okFcff && okLev;
    });

  if (applicable && typeof applicable.payoutRatio === 'number') {
    return Math.max(0, Math.min(1, applicable.payoutRatio / 100));
  }

  // 無符合層級時，使用最低層級作為 fallback（而非 0）
  const lowest = [...tiers].sort((a, b) => (a.payoutRatio || 0) - (b.payoutRatio || 0))[0];
  return Math.max(0, Math.min(1, (lowest?.payoutRatio || 30) / 100));
}

/**
 * 計算併購方優先股股息
 * 處理 EquityInjection 中 type = 'preferred' 的股息
 */
function calculateAcquirerPreferredDividends(
  dealDesign: MnaDealDesign,
  year: number
): number {
  const equityInjections = dealDesign?.equityInjections || [];

  // 篩選優先股類型的注入且已進入的
  // 考慮 entryTimingType：'end' 表示期末投入，股息從下一年開始
  const preferredInjections = equityInjections.filter(
    (inj) => {
      if (inj.type !== 'preferred' || (inj.dividendRate || 0) <= 0) {
        return false;
      }
      // 計算股息開始年份：期末投入則下一年開始，期初投入則當年開始
      const dividendStartYear = inj.entryTimingType === 'end'
        ? inj.entryTiming + 1
        : inj.entryTiming;
      return dividendStartYear <= year;
    }
  );
  
  let totalDividend = 0;
  
  for (const injection of preferredInjections) {
    // 檢查是否已贖回
    const redemptionYear = injection.specialTerms?.redemptionYear;
    if (redemptionYear && year >= redemptionYear) {
      continue; // 已贖回，不再支付股息
    }
    
    // 檢查是否啟用股利分發
    if (injection.specialTerms?.dividendDistributionEnabled === false) {
      continue;
    }
    
    const dividendRate = (injection.dividendRate || 0) / 100;
    const amount = injection.amount || 0;
    totalDividend += amount * dividendRate;
  }
  
  return totalDividend;
}

/**
 * 計算營運資本變動
 */
function calculateNWCChange(
  currentNWC: number,
  previousNWC: number
): number {
  return currentNWC - previousNWC;
}

/**
 * 計算營業活動現金流
 */
function calculateOperatingCashFlow(
  netIncome: number,
  depreciation: number,
  nwcChange: number
): number {
  // 淨利 + 折舊攤銷（非現金費用）- 營運資本增加
  return netIncome + depreciation - nwcChange;
}

/**
 * 計算投資活動現金流
 */
function calculateInvestingCashFlow(
  capex: number,
  transactionFee: number = 0
): number {
  // 資本支出和交易費用都是現金流出
  return -(capex + transactionFee);
}

/**
 * 計算融資活動現金流
 */
function calculateFinancingCashFlow(
  principalRepayment: number,
  interestExpense: number,
  newDebt: number = 0,
  newEquity: number = 0,
  dividends: number = 0
): number {
  // 流入：新債務、新股權
  // 流出：本金償還、利息支付、股利
  return newDebt + newEquity - principalRepayment - interestExpense - dividends;
}

/**
 * 計算交易費用支付
 */
function calculateTransactionFeePayment(
  dealDesign: MnaDealDesign,
  scenario: ScenarioAssumptions,
  year: number,
  baseEbitda: number
): number {
  const purchasePrice = DealCalculator.calculatePurchasePrice(baseEbitda, scenario, dealDesign);
  const totalFee = DealCalculator.calculateTransactionFees(purchasePrice, dealDesign.transactionFeePercentage || 2);
  
  if (!dealDesign.transactionFeePaymentSchedule) {
    // 預設 Year 0 全額支付
    return year === 0 ? totalFee : 0;
  }
  
  if (dealDesign.transactionFeePaymentSchedule.paymentMethod === 'upfront') {
    // 一次付清
    return year === 0 ? totalFee : 0;
  }
  
  // 分期支付
  const installments = dealDesign.transactionFeePaymentSchedule.installments || [];
  let yearPayment = 0;
  
  installments.forEach(installment => {
    if (installment.year === year) {
      yearPayment += totalFee * (installment.percentage / 100);
    }
  });
  
  return yearPayment;
}

/**
 * 計算現金流量表
 * 主函數
 */
export function calculateCashFlow(
  incomeStatements: IncomeStatementData[],
  balanceSheets: BalanceSheetData[],
  debtSchedule: DebtScheduleData[],
  dealDesign: MnaDealDesign,
  scenario: ScenarioAssumptions,
  assumptions: FutureAssumptions
): CashFlowData[] {
  const cashFlows: CashFlowData[] = [];
  const baseEbitda = incomeStatements[0].ebitda;
  
  // Year 0 - 交易年度
  const year0TransactionFee = calculateTransactionFeePayment(
    dealDesign,
    scenario,
    0,
    baseEbitda
  );
  
  // Year 0 初始融資
  const initialDebt = debtSchedule
    .filter(d => d.year === 0)
    .reduce((sum, d) => sum + d.endingBalance, 0);  // 使用 endingBalance 獲取 Year 0 債務提取
    
  const initialEquity = dealDesign.equityInjections
    ?.filter(eq => eq.entryTiming === 0)
    .reduce((sum, eq) => sum + eq.amount, 0) || 0;
  
  // 計算特別股發行（注意：特別股是負債形式，但不影響現金流入）
  const preferredStockIssuance = balanceSheets[0].preferredStock || 0;
  
  // 計算購買價格：統一使用 DealCalculator
  const purchasePrice = DealCalculator.calculatePurchasePrice(baseEbitda, scenario, dealDesign);

  // 判斷是否為資產收購（用於區分遞延付款的分類）
  const isAssetDeal = dealDesign?.dealType === 'assetAcquisition';

  // 付款時程：以 paymentSchedule 為準；若未設定，回退到 paymentStructure
  const dealWithSettings = dealDesign as MnaDealDesign & {
    assetDealSettings?: {
      paymentSchedule?: { schedule?: Array<{ paymentMethod?: string; period?: number; percentage?: number }> };
      specialSharesDetails?: { dividendRate?: number };
    };
    paymentStructure?: {
      upfrontPayment?: number;
      year1MilestonePayment?: number;
      year2MilestonePayment?: number;
    };
    dividendPolicySettings?: {
      covenants?: unknown;
      tiers?: unknown[];
    };
  };
  /**
   * 取得指定年份的現金付款金額
   * @param year - 年份 (0, 1, 2, ...)
   * @param timingDetail - 可選：篩選期初或期末
   */
  const getCashPaymentForYear = (year: number, timingDetail?: 'beginning' | 'end') => {
    return DealCalculator.calculatePaymentAmount(purchasePrice, year, dealDesign, timingDetail);
  };

  // Year 0 現金流計算：包含交割前/交割時的現金支付與當期交易費
  const cashPurchaseY0 = getCashPaymentForYear(0);
  // Year 0（併購前）不計入營業活動現金流
  const year0OperatingCashFlow = 0;
  const year0InvestingCashFlow = -(year0TransactionFee + cashPurchaseY0);
  const year0FinancingCashFlow = initialDebt + initialEquity; // 特別股發行為非現金，不計入現金流
  const year0NetCashFlow = year0OperatingCashFlow + year0InvestingCashFlow + year0FinancingCashFlow;
  
  // 修正 Year 0 現金計算 - LBO 交易後新公司期初現金為 0
  // 被收購公司的現金已包含在收購價格中，不應重複計算
  const year0BeginningCash = 0; // LBO 交易期初現金為 0
  const year0EndingCash = year0BeginningCash + year0NetCashFlow;
  
  // 更新資產負債表的 Year 0 現金（修復現金計算問題）
  if (balanceSheets[0]) {
    balanceSheets[0].cash = year0EndingCash;
    balanceSheets[0].totalAssets = year0EndingCash + 
      balanceSheets[0].accountsReceivable +
      balanceSheets[0].inventory +
      balanceSheets[0].fixedAssets +
      (balanceSheets[0].goodwill || 0); // 包含商譽
    // 重新計算 totalLiabilities（不含權益）
    balanceSheets[0].totalLiabilities = 
      (balanceSheets[0].accountsPayable || 0) +
      (balanceSheets[0].otherCurrentLiabilities || 0) +
      (balanceSheets[0].debt || 0) +
      (balanceSheets[0].preferredStock || 0);
    
    // 關鍵修復：重新計算股東權益以維持會計恆等式
    balanceSheets[0].equity = balanceSheets[0].totalAssets - balanceSheets[0].totalLiabilities;
    
    // 重新計算 totalLiabilitiesEquity（應等於 totalAssets）
    balanceSheets[0].totalLiabilitiesEquity = balanceSheets[0].totalAssets;
  }
  
  cashFlows.push({
    year: 0,
    operatingCashFlow: year0OperatingCashFlow,
    investingCashFlow: year0InvestingCashFlow,
    financingCashFlow: year0FinancingCashFlow,
    netCashFlow: year0NetCashFlow,
    beginningCash: year0BeginningCash,
    endingCash: year0EndingCash,
    preferredStockIssuance: preferredStockIssuance, // 記錄特別股發行（非現金）
    preferredDividends: 0,
    commonDividends: 0,
    principalRepayment: 0,
    newDebt: initialDebt,
    newEquity: initialEquity,
    interestPaid: 0,
    capex: 0,
    transactionFeePaid: year0TransactionFee,
    cashAcquisitionPayment: cashPurchaseY0,
    nwcChange: 0,
  });
  
  // 預測年度
  for (let year = 1; year < incomeStatements.length; year++) {
    const income = incomeStatements[year];
    const balance = balanceSheets[year];
    const previousBalance = balanceSheets[year - 1];
    const previousCashFlow = cashFlows[year - 1];
    
    // 計算營運資本變動
    const nwcChange = calculateNWCChange(balance.nwc || 0, previousBalance.nwc || 0);
    
    // 營業活動現金流
    const operatingCashFlow = calculateOperatingCashFlow(
      income.netIncome,
      income.depreciationAmortization,
      nwcChange
    );
    
    // 計算資本支出
    const capex = income.revenue * (assumptions.capexAsPercentageOfRevenue) / 100;
    
    // 計算交易費用（如果有分期）
    const transactionFee = calculateTransactionFeePayment(
      dealDesign,
      scenario,
      year,
      baseEbitda
    );
    
    // 取得該年度的現金收購付款（根據 timing 設定）
    const cashPurchaseThisYear = getCashPaymentForYear(year);

    // 計算遞延付款費用（資產收購 Year 1+ 的付款視為營運費用）
    // 對於資產收購：Year 1+ 付款是費用（已在損益表扣除），不計入投資活動
    // 對於股權收購：所有付款都是投資活動
    const deferredPaymentExpense = (isAssetDeal && year > 0)
      ? DealCalculator.calculateDeferredPaymentExpense(purchasePrice, year, dealDesign)
      : 0;

    // 投資活動現金流
    // - 股權收購：所有收購付款都是投資活動
    // - 資產收購：只有頭期款（Year 0）是投資活動，Year 1+ 付款是費用（已在營運活動反映）
    const acquisitionPaymentForInvesting = isAssetDeal
      ? (year === 0 ? cashPurchaseThisYear : (cashPurchaseThisYear - deferredPaymentExpense))
      : cashPurchaseThisYear;
    const investingCashFlow = calculateInvestingCashFlow(capex + acquisitionPaymentForInvesting, transactionFee);
    
    // 計算債務償還
    const principalRepayment = calculateTotalPrincipalRepayment(debtSchedule, year);

    // 直接從融資計劃獲取真實的新債務流入（Linus 原則：使用單一真相來源）
    const newDebt = dealDesign.financingPlans
      ?.filter((plan) => plan.entryTiming === year && (plan.amount || 0) > 0)
      .reduce((sum: number, plan) => sum + plan.amount, 0) || 0;
      
    const newEquity = dealDesign.equityInjections
      ?.filter(eq => eq.entryTiming === year)
      .reduce((sum, eq) => sum + eq.amount, 0) || 0;
    
    // 計算特別股贖回
    let preferredStockRedemption = 0;
    const ev = DealCalculator.calculateEnterpriseValue(incomeStatements[0].ebitda, scenario.entryEvEbitdaMultiple);
    const schedule = dealDesign?.assetDealSettings?.paymentSchedule?.schedule || [];
    const mapTimingToYear = (item: typeof schedule[0]): number | null => {
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
    const redemptionPctThisYear = Array.isArray(schedule)
      ? schedule
          .filter((s) => s?.paymentMethod === 'specialSharesBuyback' && mapTimingToYear(s) === year)
          .reduce((sum: number, s) => sum + (Number(s?.percentage) || 0), 0)
      : 0;
    preferredStockRedemption = ev * (redemptionPctThisYear / 100);

    // 計算被併方特別股股息（當年直接支付，不累積到負債）
    // 若該年有「期初」贖回，則股息基礎應扣除期初贖回的部分
    const targetPreferredDividendRate = Number(dealWithSettings?.assetDealSettings?.specialSharesDetails?.dividendRate ?? 0) / 100;
    const beginningRedemptionPct = Array.isArray(schedule)
      ? schedule
          .filter((s) => s?.paymentMethod === 'specialSharesBuyback' && mapTimingToYear(s) === year && s?.timingDetail === 'beginning')
          .reduce((sum: number, s) => sum + (Number(s?.percentage) || 0), 0)
      : 0;
    const beginningRedemptionAmount = ev * (beginningRedemptionPct / 100);
    const targetPreferredDividendBase = Math.max(0, (previousBalance.preferredStock || 0) - beginningRedemptionAmount);
    const targetPreferredDividend = targetPreferredDividendBase * targetPreferredDividendRate;
    
    // 計算併購方優先股股息
    const acquirerPreferredDividend = calculateAcquirerPreferredDividends(dealDesign, year);
    
    // 總優先股股息 = 被併方 + 併購方
    const preferredDividend = targetPreferredDividend + acquirerPreferredDividend;

    // 先計算不含普通股利的融資現金流（包含特別股贖回與股息支付）
    const financingCashFlowBeforeCommon = calculateFinancingCashFlow(
      principalRepayment + preferredStockRedemption, // 特別股贖回視為本金償還
      income.interestExpense,
      newDebt,
      newEquity,
      preferredDividend
    );
    // 依「債務保護條件」、「分級配比」、「瀑布分配」設定計算普通股利
    const covenants = dealWithSettings?.dividendPolicySettings?.covenants;
    const tiers = dealWithSettings?.dividendPolicySettings?.tiers;
    const waterfallRules = dealWithSettings?.dividendPolicySettings?.waterfallRules;

    const beginningCash = previousCashFlow.endingCash;
    const netCashFlowBeforeCommon = operatingCashFlow + investingCashFlow + financingCashFlowBeforeCommon;
    const endingCashBeforeCommon = beginningCash + netCashFlowBeforeCommon;

    // 計算最低現金保留（基於 minCashMonths covenant）
    const operatingExpenses = Math.max(0, (income.revenue || 0) - (income.ebitda || 0));
    const monthlyOperatingExpenses = operatingExpenses / 12;
    const minCashMonths = covenants?.minCashMonths?.enabled ? (covenants.minCashMonths.value || 0) : 0;
    const minimumCashReserve = monthlyOperatingExpenses * minCashMonths;

    // 計算 FCFF（簡化：OCF - CapEx，不含債務與特股影響）
    const fcff = operatingCashFlow - capex;

    // Step 1: 檢查所有 Covenant 是否通過
    const covenantCheck = checkAllCovenants(
      income,
      balanceSheets[year] || {} as BalanceSheetData,
      debtSchedule,
      covenants,
      year
    );

    // Step 2: 計算槓桿比率（用於 Tier 選擇）
    const leverage = (income.ebitda || 0) > 0
      ? ((balanceSheets[year]?.debt || 0) / income.ebitda)
      : Infinity;

    // Step 3: 選擇適用的 Tier 取得 payoutRatio
    const payoutRatio = selectApplicableTier(tiers, income.ebitda || 0, fcff, leverage);

    // Step 4: 計算可分配金額
    const availableForCommon = Math.max(0, endingCashBeforeCommon - minimumCashReserve);

    // Step 5: 根據 Covenant 結果與 Waterfall 規則分配
    // 取得優先股股息率（用於 Waterfall 計算）
    const waterfallPreferredRate = Number(dealWithSettings?.assetDealSettings?.specialSharesDetails?.dividendRate ?? 8);

    let commonDividend = 0;
    let dividendReason = '';

    if (!covenantCheck.passed) {
      dividendReason = `Covenant 違規: ${covenantCheck.failedCovenants.join(', ')}`;
    } else if (availableForCommon <= 0) {
      dividendReason = `可分配現金不足 (期末現金 ${(endingCashBeforeCommon / 1000).toFixed(1)}M - 最低保留 ${(minimumCashReserve / 1000).toFixed(1)}M ≤ 0)`;
    } else if (waterfallRules && waterfallRules.length > 0) {
      // 使用 Waterfall 分配
      const dist = applyWaterfallDistribution(
        availableForCommon,
        waterfallRules,
        balanceSheets[year]?.preferredStock || 0,
        waterfallPreferredRate
      );
      commonDividend = dist.commonDividend;
    } else {
      // 無 Waterfall 規則，使用 Tier payoutRatio
      commonDividend = availableForCommon * payoutRatio;
    }

    // 建立診斷資訊
    const diagnostics: DividendDiagnostics = {
      covenantsPassed: covenantCheck.passed,
      failedCovenants: covenantCheck.failedCovenants,
      availableForDividend: availableForCommon,
      minimumCashReserve,
      endingCashBeforeDividend: endingCashBeforeCommon,
      payoutRatio,
      reason: dividendReason || undefined,
    };

    // 將普通股利納入融資現金流（作為現金流出）
    const financingCashFlow = financingCashFlowBeforeCommon - commonDividend;

    // 注意：普通股利對股東權益的影響將在下方使用會計恆等式統一處理
    // 移除此處的單獨 equity 修改，避免破壞會計恆等式

    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
    const endingCash = beginningCash + netCashFlow;
    
    cashFlows.push({
      year,
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      netCashFlow,
      beginningCash,
      endingCash,
      preferredStockRedemption: preferredStockRedemption > 0 ? preferredStockRedemption : undefined,
      preferredDividends: preferredDividend > 0 ? preferredDividend : undefined,
      commonDividends: commonDividend > 0 ? commonDividend : undefined,
      principalRepayment,
      newDebt,
      newEquity,
      interestPaid: income.interestExpense || 0,
      capex,
      transactionFeePaid: transactionFee,
      cashAcquisitionPayment: acquisitionPaymentForInvesting > 0 ? acquisitionPaymentForInvesting : undefined,
      deferredPaymentExpense: deferredPaymentExpense > 0 ? deferredPaymentExpense : undefined,
      nwcChange,
      dividendDiagnostics: diagnostics,
    });
    
    // 更新資產負債表：現金和股東權益
    if (balanceSheets[year]) {
      // 1. 更新現金為正確的期末現金
      balanceSheets[year].cash = endingCash;

      // 2. 重新計算總資產（現金已更新）
      balanceSheets[year].totalAssets = endingCash +
        balanceSheets[year].accountsReceivable +
        balanceSheets[year].inventory +
        balanceSheets[year].fixedAssets +
        (balanceSheets[year].goodwill || 0);

      // 3. 重新計算 totalLiabilities（不含權益）
      balanceSheets[year].totalLiabilities =
        (balanceSheets[year].accountsPayable || 0) +
        (balanceSheets[year].otherCurrentLiabilities || 0) +
        (balanceSheets[year].debt || 0) +
        (balanceSheets[year].preferredStock || 0);

      // 4. 【關鍵修復】使用會計恆等式計算股東權益
      // Assets = Liabilities + Equity
      // ∴ Equity = Assets - Liabilities
      // 這確保會計恆等式永遠成立，避免股利計算時序問題
      const totalAssets = balanceSheets[year].totalAssets ?? 0;
      const totalLiabilities = balanceSheets[year].totalLiabilities ?? 0;
      balanceSheets[year].equity = totalAssets - totalLiabilities;

      // 5. 計算 totalLiabilitiesEquity（現在保證等於 totalAssets）
      balanceSheets[year].totalLiabilitiesEquity = totalLiabilities + balanceSheets[year].equity;
    }
  }
  
  return cashFlows;
}

/**
 * 計算自由現金流 (FCF)
 */
export function calculateFreeCashFlow(
  operatingCashFlow: number,
  capex: number
): number {
  return operatingCashFlow - capex;
}

/**
 * 計算未槓桿自由現金流 (UFCF)
 */
export function calculateUnleveredFreeCashFlow(
  ebitda: number,
  taxes: number,
  capex: number,
  nwcChange: number
): number {
  return ebitda - taxes - capex - nwcChange;
}

/**
 * 計算槓桿自由現金流 (LFCF)
 */
export function calculateLeveredFreeCashFlow(
  ufcf: number,
  interestExpense: number,
  principalRepayment: number
): number {
  return ufcf - interestExpense - principalRepayment;
}
