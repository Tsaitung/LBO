/**
 * Master Defaults Configuration
 * 統一的預設值來源 - Single Source of Truth
 *
 * Linus 原則：消除特殊案例，統一數據來源
 *
 * 所有其他檔案應從此處導入預設值，不應自行定義
 */

// ==================== 估值參數 ====================
export const VALUATION_DEFAULTS = {
  // 入場/出場倍數
  entryEvEbitdaMultiple: 10,  // 入場 EV/EBITDA 倍數
  exitEvEbitdaMultiple: 12,   // 出場 EV/EBITDA 倍數

  // 債務結構
  seniorDebtEbitda: 4,        // 優先債務/EBITDA
  mezzDebtEbitda: 2,          // 夾層債務/EBITDA
} as const;

// ==================== 增長假設 ====================
export const GROWTH_DEFAULTS = {
  revenueGrowthRate: 5,       // 營收增長率 (%)
  ebitdaMargin: 25,           // EBITDA 利潤率 (%) - 由 COGS + OpEx 推導
  netMargin: 10,              // 淨利率 (%)
} as const;

// ==================== 成本結構 ====================
export const COST_STRUCTURE_DEFAULTS = {
  cogsAsPercentageOfRevenue: 60,                  // COGS/營收 (%)
  operatingExpensesAsPercentageOfRevenue: 15,     // 營業費用/營收 (%)
  // 計算得出：EBITDA Margin = 100% - 60% - 15% = 25%
} as const;

// ==================== 資本支出假設 ====================
export const CAPEX_DEFAULTS = {
  capexAsPercentageOfRevenue: 4,    // CapEx/營收 (%)
  capexGrowthRate: 3,               // CapEx 增長率 (%)
  depreciationToCapexRatio: 20,     // D&A/CapEx (%)
  fixedAssetsToCapexMultiple: 10,   // 固定資產/CapEx 倍數（折舊年限）
} as const;

// ==================== 營運資本假設 ====================
export const WORKING_CAPITAL_DEFAULTS = {
  accountsReceivableDays: 45,   // 應收帳款天數
  inventoryDays: 60,            // 存貨天數
  accountsPayableDays: 35,      // 應付帳款天數
} as const;

// ==================== 稅務與折現 ====================
export const TAX_DISCOUNT_DEFAULTS = {
  taxRate: 20,                  // 稅率 (%)
  discountRate: 10,             // 折現率 (%)
} as const;

// ==================== 債務參數 ====================
export const DEBT_DEFAULTS = {
  // 利率
  seniorDebtRate: 5,            // 優先債務利率 (%)
  mezzanineDebtRate: 8,         // 夾層債務利率 (%)
  revolverRate: 3,              // 循環信貸利率 (%)

  // 循環信貸
  revolvingCreditRepaymentRate: 20,   // 循環信用年償還率 (%)
  minUtilization: 0,                  // 最低利用率
  maxUtilization: 100,                // 最高利用率 (%)
} as const;

// ==================== 交易費用 ====================
export const TRANSACTION_FEE_DEFAULTS = {
  defaultFeeRate: 2,            // 預設交易費用率 (%)
  minFeeRate: 0.5,              // 最低費用率 (%)
  maxFeeRate: 5,                // 最高費用率 (%)
} as const;

// ==================== 債務保護條件 (Covenants) ====================
export const COVENANT_DEFAULTS = {
  dscr: {
    value: 1.25,                // 債務服務覆蓋率閾值
    enabled: true,
  },
  netLeverage: {
    value: 4.0,                 // 淨槓桿率閾值
    enabled: true,
  },
  interestCoverage: {
    value: 3.0,                 // 利息覆蓋率閾值
    enabled: true,
  },
  minCashMonths: {
    value: 3,                   // 最低現金月數
    enabled: true,
  },
} as const;

// ==================== 股利政策 ====================
export const DIVIDEND_POLICY_DEFAULTS = {
  // 分級觸發條件
  tiers: [
    {
      id: 'tier-1',
      name: '基礎分紅',
      ebitdaThreshold: 50,      // 百萬元
      fcffThreshold: 20,        // 百萬元
      leverageThreshold: 5.0,   // 倍數
      payoutRatio: 30,          // %
    },
    {
      id: 'tier-2',
      name: '標準分紅',
      ebitdaThreshold: 80,
      fcffThreshold: 40,
      leverageThreshold: 3.5,
      payoutRatio: 50,
    },
    {
      id: 'tier-3',
      name: '積極分紅',
      ebitdaThreshold: 100,
      fcffThreshold: 60,
      leverageThreshold: 2.5,
      payoutRatio: 70,
    },
  ],

  // 贖回策略 (各年度贖回比例 %)
  redemptionStrategy: {
    year1: 0,
    year2: 0,
    year3: 20,
    year4: 30,
    year5: 50,
  },

  // 時間設定
  timing: {
    frequency: 'annual' as const,
    evaluationDate: 'Q4+45',
    paymentDate: 'Q2-end',
  },

  // 預設分紅比例（無符合層級時）
  defaultPayoutRatio: 50,       // %
} as const;

// ==================== 付款結構 ====================
export const PAYMENT_STRUCTURE_DEFAULTS = {
  upfrontPayment: 40,           // 頭期款 (%)
  year1MilestonePayment: 30,    // Year 1 里程碑 (%)
  year2MilestonePayment: 30,    // Year 2 里程碑 (%)
} as const;

// ==================== 系統參數 ====================
export const SYSTEM_DEFAULTS = {
  planningHorizon: 5,           // 規劃期限 (年)
  maxPlanningHorizon: 10,       // 最大規劃期限 (年)
  calculationPrecision: 2,      // 計算精度（小數位數）
} as const;

// ==================== 情境差異 ====================
export const SCENARIO_ADJUSTMENTS = {
  upside: {
    exitEvEbitdaMultiple: +2,     // 出場倍數上調
    revenueGrowthRate: +2,        // 營收增長率上調
    ebitdaMargin: +3,             // EBITDA Margin 上調
    cogsAdjustment: -2,           // COGS 下調
    opexAdjustment: -1,           // OpEx 下調
  },
  downside: {
    exitEvEbitdaMultiple: -2,     // 出場倍數下調
    revenueGrowthRate: -2,        // 營收增長率下調
    ebitdaMargin: -3,             // EBITDA Margin 下調
    cogsAdjustment: +2,           // COGS 上調
    opexAdjustment: +1,           // OpEx 上調
  },
} as const;

// ==================== 組合導出 ====================

/**
 * 完整的 Base 情境假設
 * 其他情境應基於此進行調整
 */
export const BASE_SCENARIO_DEFAULTS = {
  ...VALUATION_DEFAULTS,
  ...GROWTH_DEFAULTS,
  ...COST_STRUCTURE_DEFAULTS,
  ...CAPEX_DEFAULTS,
  ...WORKING_CAPITAL_DEFAULTS,
  ...TAX_DISCOUNT_DEFAULTS,
} as const;

/**
 * 計算 EBITDA Margin
 * 用於驗證 COGS + OpEx 與 ebitdaMargin 一致性
 */
export const calculateEbitdaMargin = (
  cogsPercent: number,
  opexPercent: number
): number => {
  return 100 - cogsPercent - opexPercent;
};

// 驗證預設值一致性
const calculatedMargin = calculateEbitdaMargin(
  COST_STRUCTURE_DEFAULTS.cogsAsPercentageOfRevenue,
  COST_STRUCTURE_DEFAULTS.operatingExpensesAsPercentageOfRevenue
);

if (calculatedMargin !== GROWTH_DEFAULTS.ebitdaMargin) {
  console.warn(
    `[master-defaults] EBITDA Margin 不一致: ` +
    `計算值=${calculatedMargin}%, 設定值=${GROWTH_DEFAULTS.ebitdaMargin}%`
  );
}
