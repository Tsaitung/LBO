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
} from '../../types/financial';
import { calculateTotalPrincipalRepayment } from './debtSchedule';

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
  const preferredInjections = equityInjections.filter(
    (inj) => 
      inj.type === 'preferred' && 
      inj.entryTiming <= year &&
      (inj.dividendRate || 0) > 0
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
  const enterpriseValue = baseEbitda * scenario.entryEvEbitdaMultiple;
  const totalFee = enterpriseValue * (dealDesign.transactionFeePercentage || 0) / 100;
  
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
  
  // 計算購買價格：股權收購用 EV；資產收購用選定資產價值
  const evPrice = baseEbitda * (scenario.entryEvEbitdaMultiple);
  const purchasePrice = evPrice; // 交易價一律以 EV 為準

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
  const schedule = dealWithSettings?.assetDealSettings?.paymentSchedule?.schedule || [];
  const getCashPaymentForPeriod = (period: number) => {
    if (Array.isArray(schedule) && schedule.length > 0) {
      const pct = schedule
        .filter((s) => s?.paymentMethod === 'cash' && Number(s?.period) === period)
        .reduce((sum: number, s) => sum + (Number(s?.percentage) || 0), 0);
      return purchasePrice * (pct / 100);
    }
    // fallback：使用 paymentStructure（upfront=期1，year1=期2，year2=期3）
    const ps = dealWithSettings?.paymentStructure || {};
    const map: Record<number, number> = {
      1: Number(ps.upfrontPayment ?? 0),
      2: Number(ps.year1MilestonePayment ?? 0),
      3: Number(ps.year2MilestonePayment ?? 0),
    };
    const pct = map[period] || 0;
    return purchasePrice * (pct / 100);
  };
  
  // Year 0 現金流計算：扣期1（期末）的現金支付與當期交易費
  const cashPurchaseY0 = getCashPaymentForPeriod(1);
  // Year 0（併購前）不計入營業活動現金流
  const year0OperatingCashFlow = 0;
  const year0InvestingCashFlow = -(year0TransactionFee + cashPurchaseY0);
  const year0FinancingCashFlow = initialDebt + initialEquity; // 特別股發行為非現金，不計入現金流
  const year0NetCashFlow = year0OperatingCashFlow + year0InvestingCashFlow + year0FinancingCashFlow;
  
  // 正確計算 Year 0 期末現金
  const year0BeginningCash = balanceSheets[0].cash;
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
    
    // 期別 = 年 + 1（期1=Year 0 期末；期2=Year 1 期末；期3=Year 2 期末）
    const cashPurchaseThisYear = getCashPaymentForPeriod(year + 1);
    // 投資活動現金流（包含購買價的現金支付）
    const investingCashFlow = calculateInvestingCashFlow(capex + cashPurchaseThisYear, transactionFee);
    
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
    const ev = incomeStatements[0].ebitda * scenario.entryEvEbitdaMultiple;
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
    // 依「最低現金月數」與「分級配比」設定，計算普通股利以維持最低現金保留
    const covenants = dealWithSettings?.dividendPolicySettings?.covenants;
    const minCashMonthsEnabled = !!covenants?.minCashMonths?.enabled;
    const minCashMonths = Number(covenants?.minCashMonths?.value ?? 0);
    const tiers = dealWithSettings?.dividendPolicySettings?.tiers || [];

    const beginningCash = previousCashFlow.endingCash;
    const netCashFlowBeforeCommon = operatingCashFlow + investingCashFlow + financingCashFlowBeforeCommon;
    const endingCashBeforeCommon = beginningCash + netCashFlowBeforeCommon;

    const operatingExpenses = Math.max(0, (income.revenue || 0) - (income.ebitda || 0));
    const monthlyOperatingExpenses = operatingExpenses / 12;
    const minimumCashReserve = minCashMonthsEnabled ? (monthlyOperatingExpenses * minCashMonths) : 0;

    // 計算 FCFF（簡化：OCF - CapEx，不含債務與特股影響）
    const fcff = operatingCashFlow - capex;

    // 選擇適用層級的 payoutRatio（若 tiers 未設定則預設 50%）
    let payoutRatio = Array.isArray(tiers) && tiers.length > 0 ? 0 : 0.5; // 有tiers但無符合則0%，否則預設50%
    if (Array.isArray(tiers) && tiers.length > 0) {
      // 由高到低檢查門檻，符合者採用
      const leverage = (income.ebitda || 0) > 0 ? ((balanceSheets[year]?.debt || 0) / (income.ebitda || 1)) : Infinity;
      const applicable = [...tiers].reverse().find((t) => {
        const ebitdaThresholdK = (Number(t.ebitdaThreshold) || 0) * 1000; // UI以百萬元，模型以仟元
        const fcffThresholdK = (Number(t.fcffThreshold) || 0) * 1000;     // UI以百萬元，模型以仟元
        const okEbitda = (income.ebitda || 0) >= ebitdaThresholdK;
        const okFcff = fcff >= fcffThresholdK;
        const okLev = leverage <= (Number(t.leverageThreshold) || Infinity);
        return okEbitda && okFcff && okLev;
      });
      if (applicable && typeof applicable.payoutRatio === 'number') {
        payoutRatio = Math.max(0, Math.min(1, applicable.payoutRatio / 100));
      }
    }

    const availableForCommon = Math.max(0, endingCashBeforeCommon - minimumCashReserve);
    const commonDividend = availableForCommon * payoutRatio;

    // 將普通股利納入融資現金流（作為現金流出）
    const financingCashFlow = financingCashFlowBeforeCommon - commonDividend;
    
    // 普通股利減少股東權益
    if (balanceSheets[year] && commonDividend > 0) {
      balanceSheets[year].equity = (balanceSheets[year].equity || 0) - commonDividend;
    }
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
      cashAcquisitionPayment: cashPurchaseThisYear,
      nwcChange,
    });
    
    // 更新資產負債表：現金和股東權益
    if (balanceSheets[year]) {
      // 更新現金為正確的期末現金
      balanceSheets[year].cash = endingCash;
      
      // 重新計算總資產（現金已更新）
      balanceSheets[year].totalAssets = endingCash +
        balanceSheets[year].accountsReceivable +
        balanceSheets[year].inventory +
        balanceSheets[year].fixedAssets +
        (balanceSheets[year].goodwill || 0);
        
      // 重新計算 totalLiabilities（不含權益）
      balanceSheets[year].totalLiabilities = 
        (balanceSheets[year].accountsPayable || 0) +
        (balanceSheets[year].otherCurrentLiabilities || 0) +
        (balanceSheets[year].debt || 0) +
        (balanceSheets[year].preferredStock || 0);
        
      // 股東權益應該通過滾動計算得出，而非強制使用會計恆等式
      // 滾動計算已在 balanceSheet.ts 中完成
      
      // 計算 totalLiabilitiesEquity
      balanceSheets[year].totalLiabilitiesEquity = balanceSheets[year].totalAssets;
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
