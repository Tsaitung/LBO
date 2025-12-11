// 財務數據類型定義
// 被併標的業務指標
export interface BusinessMetricsBeforeAcquisition {
  // 損益表指標
  revenue: number; // 營收 (仟元)
  cogs: number; // 銷貨成本 (仟元)
  grossProfit: number; // 毛利 (仟元) - 自動計算
  grossMargin: number; // 毛利率 (%) - 自動計算
  operatingExpenses: number; // 營業費用 (仟元)
  ebitda: number; // EBITDA (仟元)
  netIncome: number; // 淨利 (仟元)

  // 資產負債表指標
  totalAssets: number; // 總資產 (仟元) - 自動計算
  totalLiabilities: number; // 總負債 (仟元) - 自動計算
  shareholdersEquity: number; // 股東權益 (仟元) - 自動計算 (Assets - Liabilities)

  // 資產項目 (含交易勾選狀態)
  cashAndCashEquivalents: number; // 現金及約當現金 (仟元)
  cashIncludedInTransaction: boolean; // 現金是否納入交易
  accountsReceivable: number; // 應收帳款 (仟元)
  arIncludedInTransaction: boolean; // 應收帳款是否納入交易
  inventory: number; // 存貨 (仟元)
  inventoryIncludedInTransaction: boolean; // 存貨是否納入交易
  propertyPlantEquipment: number; // 不動產廠房及設備 (仟元)
  ppeIncludedInTransaction: boolean; // 不動產廠房及設備是否納入交易

  // 負債項目 (含交易勾選狀態)
  accountsPayable: number; // 應付帳款 (仟元)
  apIncludedInTransaction: boolean; // 應付帳款是否納入交易
  shortTermDebt: number; // 短期借款 (仟元)
  stdIncludedInTransaction: boolean; // 短期借款是否納入交易
  longTermDebt: number; // 長期借款 (仟元)
  ltdIncludedInTransaction: boolean; // 長期借款是否納入交易
  otherCurrentLiabilities: number; // 其他流動負債 (仟元)
  oclIncludedInTransaction: boolean; // 其他流動負債是否納入交易
  otherLongTermLiabilities: number; // 其他長期負債 (仟元)
  oltlIncludedInTransaction: boolean; // 其他長期負債是否納入交易

  // 現金流量表指標
  operatingCashFlow: number; // 營業現金流量 (仟元)
  investingCashFlow: number; // 投資現金流量 (仟元)
  financingCashFlow: number; // 融資現金流量 (仟元)

  // 其他關鍵指標
  depreciationAmortization: number; // 折舊攤銷 (仟元)
  interestExpense: number; // 利息費用 (仟元)
  taxExpense: number; // 所得稅費用 (仟元)
  workingCapital: number; // 營運資本 (仟元)
}

// 未來預期假設
export interface FutureAssumptions {
  // 增長假設
  revenueGrowthRate: number; // 營收增長率 (%)
  ebitdaMargin: number; // EBITDA 利潤率 (%)
  netMargin: number; // 淨利率 (%)
  
  // 成本結構假設
  cogsAsPercentageOfRevenue: number; // COGS占營收比例 (%)
  operatingExpensesAsPercentageOfRevenue: number; // 營業費用占營收比例 (%)

  // 資本支出假設
  capexAsPercentageOfRevenue: number; // CapEx/營收比例 (%)
  capexGrowthRate: number; // CapEx 增長率 (%)

  // 營運資本假設
  accountsReceivableDays: number; // 應收帳款天數
  inventoryDays: number; // 存貨天數
  accountsPayableDays: number; // 應付帳款天數

  // 其他假設
  taxRate: number; // 稅率 (%)
  discountRate: number; // 折現率 (%)
  
  // 計算參數
  depreciationToCapexRatio: number; // D&A 佔 CapEx 的比例 (%)，預設 20
  fixedAssetsToCapexMultiple: number; // 固定資產為 CapEx 的倍數，預設 10
  revolvingCreditRepaymentRate: number; // 循環信用年償還率 (%)，預設 20
}

// 還款頻率類型
export type RepaymentFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'bullet';

// 貸款類型
// 貸款等級/性質 - 定義貸款的優先級和類型
export type FacilityType =
  | 'senior'                // 優先債務
  | 'mezzanine'             // 夾層債務
  | 'revolver'              // 循環信貸
  | 'termLoanA'             // 定期貸款A（通常為短期）
  | 'termLoanB';            // 定期貸款B（通常為長期）

// 還款方式 - 定義如何償還貸款
export type RepaymentMethod =
  | 'equalPayment'          // 本息均攤（等額本息）
  | 'equalPrincipal'        // 本金均攤（等額本金）
  | 'bullet'                // 到期一次還本（期末一次清償本金）
  | 'interestOnly'          // 按期付息，到期還本
  | 'revolving'             // 循環使用（隨借隨還）
  | 'custom';               // 自定義還款計劃

// 保留 LoanType 作為後向兼容
export type LoanType = FacilityType | RepaymentMethod;

// 付款排程付款方式 - M&A 交易常見付款機制
export type SchedulePaymentMethod =
  | 'cash'                   // 現金
  | 'specialSharesBuyback'   // 特別股買回
  | 'earningsAdjustment'     // 盈餘調整（Earnout）
  | 'sellerNote'             // 賣方融資票據
  | 'escrow'                 // 第三方託管
  | 'stockSwap'              // 股權交換
  | 'assetSwap'              // 資產交換
  | 'contingentPayment'      // 或有對價
  | 'deferred';              // 遞延付款

// 付款排程時間點
export type SchedulePaymentTiming =
  | 'preClosing'             // 交割前
  | 'closing'                // 交割時
  | 'postClosing'            // 交割後
  | 'year1'                  // 第一年
  | 'year2'                  // 第二年
  | 'year3'                  // 第三年
  | 'year4'                  // 第四年
  | 'year5'                  // 第五年
  | 'milestone';             // 里程碑達成時

// 付款排程項目 - 統一介面，消除重複定義
export interface PaymentScheduleItem {
  period: number;                        // 期數
  percentage: number;                    // 比例 (%)
  timing: SchedulePaymentTiming;         // 時間點
  timingDetail: 'beginning' | 'end';     // 期初後或期末前
  paymentMethod: SchedulePaymentMethod;  // 每期付款方式
}

// 股權類型
export type EquityType = 'common' | 'preferred' | 'classA' | 'classB';

// 融資計劃
export interface FinancingPlan {
  id: string;
  name: string;
  type: LoanType; // 保留以維持向後兼容
  facilityType?: FacilityType; // 新增：貸款類型（優先級/性質）
  repaymentMethod?: RepaymentMethod; // 新增：還款方式
  amount: number; // 貸款金額 (仟元)
  entryTiming: number; // 進入時間 (年份)
  entryTimingType?: 'beginning' | 'end'; // 進入時點類型：期初或期末
  maturity: number; // 到期年限 (年)
  interestRate: number; // 年利率 (%)
  repaymentFrequency: RepaymentFrequency; // 還款頻率
  gracePeriod: number; // 寬限期 (月)
  repaymentStructure: {
    type: 'equalPayment' | 'equalPrincipal' | 'custom' | 'bullet' | 'interestOnly' | 'revolving'; // 還款方式
    customSchedule?: Array<{
      period: number; // 期數
      principal: number; // 本金償還
      interest: number; // 利息支付
    }>;
  };
  covenants?: Array<{
    type: string; // 約定類型 (DSCR, Leverage, etc.)
    threshold: number; // 門檻值
    consequence: string; // 違約後果
  }>;
  specialTerms?: {
    pikEnabled?: boolean; // 是否啟用PIK利息
    pikRate?: number; // PIK利息比例
    callProtection?: number; // 提前贖回保護期
    covenantPackage?: string; // 約定條件套餐
    collateralType?: string; // 擔保類型
  };
}

// 股權注入計劃
export interface EquityInjection {
  id: string;
  name: string;
  type: EquityType;
  amount: number; // 注入金額 (仟元)
  entryTiming: number; // 進入時間 (年份)
  entryTimingType?: 'beginning' | 'end'; // 進入時點類型：期初或期末
  ownershipPercentage: number; // 股權比例 (%)
  dividendRate?: number; // 股息率 (%) - 適用於優先股
  specialTerms?: {
    dividendDistributionEnabled?: boolean; // 是否啟用股利分發
    participateInCommonDividend?: boolean; // 是否參與普通股配息（優先股專用）
    dividendCondition?: string; // 股利分發條件
    mandatoryRedemptionEnabled?: boolean; // 是否啟用強制贖回
    redemptionYear?: number; // 贖回年限
    redemptionPrice?: number; // 贖回價格倍數
    votingRights?: string; // 投票權
    conversionRights?: boolean; // 轉換權
    liquidationPreference?: number; // 清算優先權
  };
}

// 債務保護條件
export interface DebtProtectionCovenants {
  dscr: { value: number; enabled: boolean; };           // 債務服務覆蓋率
  netLeverage: { value: number; enabled: boolean; };    // 淨槓桿率
  interestCoverage: { value: number; enabled: boolean; }; // 利息覆蓋率
  minCashMonths: { value: number; enabled: boolean; };  // 最低現金月數
}

// 分級觸發條件
export interface DividendTier {
  id: string;
  name: string;                  // 層級名稱
  ebitdaThreshold: number;       // EBITDA門檻
  fcffThreshold: number;         // FCFF門檻
  leverageThreshold: number;     // 槓桿率門檻
  payoutRatio: number;           // FCFF分配比例
}

// 瀑布式分配規則
export interface WaterfallRule {
  priority: number;              // 優先級順序
  type: 'preferredRedemption' | 'preferredDividend' | 'commonDividend' | 'carried';
  calculation: 'fixed' | 'percentage' | 'formula';
  value: number;                 // 固定金額或百分比
  formula?: string;              // 計算公式
  description: string;           // 描述說明
}

// 股利政策設定
export interface DividendPolicySettings {
  id: string;
  name: string;
  
  // 債務保護門檻
  covenants: DebtProtectionCovenants;
  
  // 分級觸發條件
  tiers: DividendTier[];
  
  // 瀑布式分配規則
  waterfallRules: WaterfallRule[];
  
  // 時間設定
  timing: {
    frequency: 'quarterly' | 'semi-annual' | 'annual';
    evaluationDate: string;      // 評估日期
    paymentDate: string;         // 支付日期
  };
  
  // 優先股贖回策略
  redemptionStrategy: {
    year1: number;  // 第1年贖回比例
    year2: number;  // 第2年贖回比例
    year3: number;  // 第3年贖回比例
    year4: number;  // 第4年贖回比例
    year5: number;  // 第5年贖回比例
  };
}

// 股利計算結果
export interface DividendCalculation {
  year: number;
  fcff: number;                    // 自由現金流
  applicableTier: string;          // 適用層級
  payoutRatio: number;             // 分配比例
  distributableCash: number;       // 可分配現金
  preferredRedemption: number;     // 優先股贖回
  preferredDividend: number;       // 優先股股息
  commonDividend: number;          // 普通股股利
  totalDistribution: number;       // 總分配金額
  covenantsPassed: boolean;        // 是否通過債務保護檢查
}

// 舊版保留以向後兼容
export interface DividendPolicy {
  id: string;
  name: string;
  type: 'fixed' | 'percentage' | 'waterfall' | 'custom';
  trigger: 'annual' | 'quarterly' | 'custom';
  conditions: Array<{
    metric: string;
    threshold: number;
    operator: '>' | '>=' | '<' | '<=';
  }>;
  distribution: {
    preferredDividend?: number;
    commonDividend?: number;
    waterfall?: Array<{
      tranche: string;
      percentage: number;
      condition?: string;
    }>;
  };
}

// M&A 交易設計
export interface MnaDealDesign {
  // 規劃年期
  planningHorizon: number; // 預測規劃年期 (年)

  // 交易類型
  dealType: 'fullAcquisition' | 'assetAcquisition'; // 全股權收購 | 資產收購

  // 資產勾選狀態 (用於資產收購)
  assetSelections: {
    cashAndCashEquivalents: boolean; // 現金及約當現金
    accountsReceivable: boolean; // 應收帳款
    inventory: boolean; // 存貨
    propertyPlantEquipment: boolean; // 不動產廠房及設備
    accountsPayable?: boolean; // 應付帳款
    otherCurrentLiabilities?: boolean; // 其他流動負債
    shortTermDebt?: boolean; // 短期借款
    longTermDebt?: boolean; // 長期借款
  };

  // 資產交易後續處理設定
  assetDealSettings: {
    dissolutionOption: 'liquidate_and_dissolve' | 'dissolve_only' | 'no_dissolution' | 'custom'; // 清算與註銷選項
    requireLiquidation: boolean; // 是否要求被併方限期清算公司
    liquidationPeriod: number; // 清算期限 (月)
    requireDissolution: boolean; // 是否要求註銷公司
    milestonePaymentMethod: SchedulePaymentMethod; // 里程碑付款方式
    specialSharesDetails: {
      dividendRate: number; // 特別股股息率 (%)
      conversionRights: boolean; // 是否有轉換權
      votingRights: boolean; // 是否有表決權
      redemptionPeriod: number; // 贖回期限 (年)
    };
    // 分期付款設定（特別股買回機制）
    paymentSchedule: {
      installments: number; // 分期期數
      schedule: PaymentScheduleItem[]; // 使用統一介面
    };
    // 選定資產清單（資產收購時使用）
    selectedAssets?: Array<{
      id: string;
      name: string;
      bookValue: number;
      fairValue: number;
      selected: boolean;
    }>;
  };

  // 價金交付方式
  paymentStructure: {
    upfrontPayment: number; // 交割前付款比例 (%)
    year1MilestonePayment: number; // 第一年里程碑付款比例 (%)
    year2MilestonePayment: number; // 第二年里程碑付款比例 (%)
    paymentMethod: 'cash' | 'equity' | 'mixed'; // 付款方式：現金 | 股權 | 混合
  };

  // 股權結構 (如果選擇股權付款)
  equityStructure: {
    commonShares: number; // 普通股比例 (%)
    preferredShares: number; // 優先股比例 (%)
    classAShares: number; // A類股比例 (%)
    classBShares: number; // B類股比例 (%)
  };

  // 融資計劃
  financingPlans: FinancingPlan[];

  // 股權注入計劃
  equityInjections: EquityInjection[];

  // 股東分紅機制
  dividendPolicies: DividendPolicy[];
  
  // 股利政策設定（新版）
  dividendPolicySettings?: DividendPolicySettings;

  // 里程碑條件
  milestones: {
    year1: {
      kpiTarget: string; // KPI 目標
      paymentTrigger: string; // 付款觸發條件
    };
    year2: {
      kpiTarget: string; // KPI 目標
      paymentTrigger: string; // 付款觸發條件
    };
  };

  // 交易費用設定
  transactionFeePercentage: number; // 交易費用百分比 (%)，必須明確設定，不再有預設值
  
  // 交易費用支付時機設定
  transactionFeePaymentSchedule?: {
    paymentMethod: 'upfront' | 'installment'; // 一次付清 | 分期支付
    installments?: Array<{
      timing: 'signing' | 'dueDiligence' | 'closing' | 'postClosing'; // 支付時點
      timingDescription?: string; // 時點說明
      percentage: number; // 該期支付比例 (%)
      year: number; // 支付年度 (0 = 交割年, -1 = 交割前一年)
    }>;
  };

  // 融資結構 (保持向後兼容)
  financingStructure: {
    seniorDebtToEbitda: number; // Senior Debt/EBITDA
    mezzanineDebtToEbitda: number; // Mezzanine Debt/EBITDA
    equityContribution: number; // 股權貢獻 (%)
    revolverLimit: number; // Revolver 限額 (仟元)
  };
}

// 舊的 YearZeroData 保持向後兼容
export interface YearZeroData extends BusinessMetricsBeforeAcquisition {}

export interface ScenarioAssumptions {
  // ========== 情境特有參數 ==========
  entryEvEbitdaMultiple: number; // 入場 EV/EBITDA 倍數
  exitEvEbitdaMultiple: number; // 出場 EV/EBITDA 倍數
  seniorDebtEbitda: number; // 優先債務/EBITDA
  mezzDebtEbitda: number; // 中間債務/EBITDA

  // ========== 增長假設 ==========
  revenueGrowthRate: number; // 營收增長率 (%)
  ebitdaMargin: number; // EBITDA 利潤率 (%)
  netMargin: number; // 淨利率 (%)

  // ========== 成本結構假設 ==========
  cogsAsPercentageOfRevenue: number; // COGS 占營收比例 (%)
  operatingExpensesAsPercentageOfRevenue: number; // 營業費用占營收比例 (%)

  // ========== 資本支出假設 ==========
  capexAsPercentageOfRevenue: number; // CapEx/營收比例 (%)
  capexGrowthRate: number; // CapEx 增長率 (%)

  // ========== 營運資本假設 ==========
  accountsReceivableDays: number; // 應收帳款天數
  inventoryDays: number; // 存貨天數
  accountsPayableDays: number; // 應付帳款天數

  // ========== 其他財務假設 ==========
  taxRate: number; // 稅率 (%)
  discountRate: number; // 折現率 (%)

  // ========== 計算參數設定 ==========
  depreciationToCapexRatio: number; // D&A/CapEx 比例 (%)
  fixedAssetsToCapexMultiple: number; // 固定資產/CapEx 倍數
  revolvingCreditRepaymentRate: number; // 循環信用年償還率 (%)

  // ========== 向後兼容欄位（保留舊名稱映射） ==========
  /** @deprecated 使用 capexAsPercentageOfRevenue */
  capExPctSales?: number;
  /** @deprecated 移除，改用天數計算 */
  nwcPctSales?: number;
  /** @deprecated 使用 taxRate */
  corporateTaxRate?: number;
}

export type ScenarioType = 'base' | 'upper' | 'lower';

export interface ScenarioData {
  base: ScenarioAssumptions;
  upper: ScenarioAssumptions;
  lower: ScenarioAssumptions;
}

export interface DebtStructure {
  seniorDebt: number; // 優先債務
  mezzDebt: number; // 中間債務
  revolverLimit: number; // 循環信貸限額
  revolverRate: number; // 循環信貸利率
  minCashTarget: number; // 最低現金目標
  useCashSweep: boolean; // 是否使用現金清償
  mezzPikPortion: number; // 中間債務PIK部分
}

export interface DividendStructure {
  prefEquityPortion: number; // 優先股權部分
  midTranchePortion: number; // 中間部分
  prefDividendRate: number; // 優先股息率
}

export interface IncomeStatementData {
  year: number;
  revenue: number;
  cogs: number; // 銷貨成本
  grossProfit: number; // 毛利
  grossMargin: number; // 毛利率 (%)
  operatingExpenses: number; // 營業費用
  ebitda: number;
  depreciationAmortization: number;
  interestExpense: number;
  deferredPaymentExpense?: number; // 資產收購遞延付款費用（Year 1+ 的付款視為費用）
  ebit: number;
  taxes: number;
  netIncome: number;
}

export interface BalanceSheetData {
  year: number;
  cash: number;
  accountsReceivable: number;
  inventory: number;
  fixedAssets: number;
  goodwill?: number; // 商譽（可選）
  totalAssets: number;
  accountsPayable: number;
  otherCurrentLiabilities?: number; // 其他流動負債（可選）
  debt: number;
  preferredStock?: number; // 特別股負債（可選）
  equity: number;
  totalLiabilities?: number; // 總負債（不含權益）
  totalLiabilitiesEquity: number;
  endingCash?: number; // 期末現金（可選）
  nwc?: number; // 淨營運資本（可選）
}

// 股利分配診斷資訊
export interface DividendDiagnostics {
  covenantsPassed: boolean;
  failedCovenants: string[];
  availableForDividend: number;
  minimumCashReserve: number;
  endingCashBeforeDividend: number;
  selectedTier?: string;
  payoutRatio: number;
  reason?: string; // 不分配的原因
}

export interface CashFlowData {
  year: number;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
  preferredStockIssuance?: number; // 特別股發行（可選）
  preferredStockRedemption?: number; // 特別股贖回（可選）
  preferredDividends?: number; // 特別股股息（當年現金支付）
  commonDividends?: number; // 普通股股利（當年現金支付）
  // 明細 - 便於顯示下一層細節
  principalRepayment?: number;
  newDebt?: number;
  newEquity?: number;
  interestPaid?: number;
  capex?: number;
  transactionFeePaid?: number;
  cashAcquisitionPayment?: number; // Year 0 頭期款（投資活動）
  deferredPaymentExpense?: number; // Year 1+ 遞延付款（營運費用現金支付）
  nwcChange?: number;
  // 股利診斷資訊
  dividendDiagnostics?: DividendDiagnostics;
}

export interface DebtScheduleData {
  year: number;
  beginningBalance: number;
  interestExpense: number;
  principalRepayment: number;
  endingBalance: number;
  debtType: 'senior' | 'mezz' | 'revolver';
}

export interface CovenantData {
  year: number;
  dscr: number; // 債務服務覆蓋率
  interestCoverage: number; // 利息覆蓋率
  netLeverage: number; // 淨槓桿率
  isCompliant: boolean;
}

export interface KPIMetrics {
  irr: number; // 內部報酬率
  moic: number; // 倍數投資資本
  entryMultiple: number;
  exitMultiple: number;
  totalReturn: number;
  paybackPeriod: number;
}

export interface LBOModelState {
  // 被併標的業務指標
  businessMetrics: BusinessMetricsBeforeAcquisition;
  // 未來預期假設
  futureAssumptions: FutureAssumptions;
  // M&A 交易設計
  mnaDealDesign: MnaDealDesign;

  // 向後兼容的舊數據結構
  yearZeroData: YearZeroData;
  scenarioData: ScenarioData;
  currentScenario: ScenarioType;
  debtStructure: DebtStructure;
  dividendStructure: DividendStructure;
  incomeStatement: IncomeStatementData[];
  balanceSheet: BalanceSheetData[];
  cashFlow: CashFlowData[];
  debtSchedule: DebtScheduleData[];
  covenants: CovenantData[];
  kpiMetrics: KPIMetrics;
  isCalculated: boolean;
}
