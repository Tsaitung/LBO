/**
 * Term Sheet 類型定義
 * 定義 LBO 交易條款清單的完整結構
 */

// 交易概要
export interface TransactionSummary {
  targetCompany: string;
  transactionDate: string;
  transactionType: 'fullAcquisition' | 'assetAcquisition';
  businessDescription: string;
  enterpriseValue: number;
  equityValue: number;
  entryMultiple: number;
  impliedValuation: {
    evToRevenue: number;
    evToEbitda: number;
    peRatio: number;
  };
}

// 融資結構
export interface FinancingStructure {
  seniorDebt: {
    amount: number;
    percentage: number;
    interestRate: number;
    maturity: number;
    amortization: string;
  };
  mezzanineDebt: {
    amount: number;
    percentage: number;
    interestRate: number;
    maturity: number;
    amortization: string;
  };
  revolverFacility: {
    limit: number;
    drawnAmount: number;
    interestRate: number;
    commitment: number;
  };
  equityInvestment: {
    amount: number;
    percentage: number;
    sponsorEquity: number;
    managementRollover: number;
  };
  totalSources: number;
}

// 付款條款
export interface PaymentTerms {
  upfrontPayment: {
    amount: number;
    percentage: number;
    paymentMethod: 'cash' | 'stock' | 'mixed';
  };
  deferredPayments: Array<{
    year: number;
    amount: number;
    condition: string;
    paymentMethod: 'cash' | 'stock' | 'mixed';
  }>;
  earnouts: Array<{
    trigger: string;
    targetMetric: string;
    threshold: number;
    payment: number;
    deadline: string;
  }>;
  escrow: {
    amount: number;
    period: number;
    purpose: string;
  };
}

// 治理條款
export interface GovernanceTerms {
  boardComposition: {
    totalSeats: number;
    sponsorSeats: number;
    managementSeats: number;
    independentSeats: number;
  };
  vetoRights: string[];
  informationRights: {
    frequency: 'monthly' | 'quarterly';
    reports: string[];
    auditRights: boolean;
  };
  restrictiveCovenants: {
    nonCompete: number;
    nonSolicitation: number;
    confidentiality: number;
  };
}

// 財務契約
export interface FinancialCovenants {
  leverageRatio: {
    maximum: number;
    testFrequency: 'quarterly' | 'annual';
  };
  interestCoverage: {
    minimum: number;
    testFrequency: 'quarterly' | 'annual';
  };
  fixedChargeCoverage: {
    minimum: number;
    testFrequency: 'quarterly' | 'annual';
  };
  minimumEbitda: {
    amount: number;
    testFrequency: 'quarterly' | 'annual';
  };
  capitalExpenditure: {
    maximumAnnual: number;
    carryforward: boolean;
  };
}

// 退出策略
export interface ExitStrategy {
  targetHoldPeriod: number;
  expectedExitYear: number;
  exitMultiple: number;
  exitOptions: Array<{
    method: 'ipo' | 'strategicSale' | 'secondaryBuyout' | 'recapitalization';
    probability: number;
    expectedReturn: number;
  }>;
  projectedReturns: {
    irr: number;
    moic: number;
    cashOnCash: number;
  };
}

// 先決條件
export interface ConditionsPrecedent {
  dueDiligence: {
    financial: boolean;
    legal: boolean;
    commercial: boolean;
    environmental: boolean;
    tax: boolean;
  };
  regulatoryApprovals: string[];
  thirdPartyConsents: string[];
  keyEmployeeRetention: string[];
  minimumCash: number;
  workingCapitalAdjustment: boolean;
  materialAdverseChange: string;
}

// 關鍵日期
export interface KeyDates {
  signingDate: string;
  expectedClosing: string;
  longStopDate: string;
  dueDiligenceDeadline: string;
  financingCommitmentExpiry: string;
}

// 費用結構
export interface FeeStructure {
  transactionFees: {
    advisoryFees: number;
    legalFees: number;
    dueDiligenceFees: number;
    financingFees: number;
    otherFees: number;
    totalFees: number;
  };
  ongoingFees: {
    managementFee: number;
    monitoringFee: number;
    boardFee: number;
  };
}

// 風險因素
export interface RiskFactors {
  marketRisks: string[];
  operationalRisks: string[];
  financialRisks: string[];
  regulatoryRisks: string[];
  keyPersonRisks: string[];
  mitigationStrategies: Record<string, string>;
}

// 完整的 Term Sheet 結構
export interface TermSheet {
  version: string;
  status: 'draft' | 'negotiation' | 'final' | 'signed';
  lastUpdated: string;
  confidential: boolean;
  
  transactionSummary: TransactionSummary;
  financingStructure: FinancingStructure;
  paymentTerms: PaymentTerms;
  governanceTerms: GovernanceTerms;
  financialCovenants: FinancialCovenants;
  exitStrategy: ExitStrategy;
  conditionsPrecedent: ConditionsPrecedent;
  keyDates: KeyDates;
  feeStructure: FeeStructure;
  riskFactors: RiskFactors;
  
  // 附加條款
  representations: string[];
  warranties: string[];
  indemnities: string[];
  disputeResolution: {
    mechanism: 'arbitration' | 'litigation';
    jurisdiction: string;
    governingLaw: string;
  };
  
  // 簽署方
  parties: {
    buyer: {
      name: string;
      entity: string;
      representative: string;
      address: string;
    };
    seller: {
      name: string;
      entity: string;
      representative: string;
      address: string;
    };
  };
}

// Term Sheet 生成配置
export interface TermSheetConfig {
  includeFinancialProjections: boolean;
  includeDetailedCovenants: boolean;
  includeSensitivityAnalysis: boolean;
  language: 'zh-TW' | 'en-US';
  currency: 'TWD' | 'USD';
  numberFormat: 'thousands' | 'millions';
}

// 統一條款結構 - Linus品味：統一處理，無特殊情況
export interface TermClause {
  id: string;
  section: TermSheetSection;
  title: string;
  content: string | number | TermClauseValue;
  isEditable: boolean;
  isGenerated: boolean; // 從其他數據計算得出
  displayOrder: number;
  validation?: {
    required: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// 條款值類型 - 支援複雜結構
export interface TermClauseValue {
  type: 'currency' | 'percentage' | 'multiple' | 'date' | 'list' | 'table' | 'text';
  value: number | string | Date | string[] | Record<string, unknown>[] | Record<string, unknown>;
  format?: {
    currency?: 'TWD' | 'USD';
    scale?: 'thousands' | 'millions';
    decimals?: number;
  };
}

// Term Sheet 狀態管理
export interface TermSheetState {
  clauses: Record<string, TermClause>;
  meta: {
    version: string;
    status: 'draft' | 'negotiation' | 'final' | 'signed';
    lastUpdated: string;
    confidential: boolean;
  };
  editMode: 'view' | 'edit' | 'review';
  selectedSection?: TermSheetSection;
}

// 導出類型
export type TermSheetSection = 
  | 'summary' 
  | 'financing' 
  | 'payment' 
  | 'governance' 
  | 'covenants' 
  | 'exit' 
  | 'conditions' 
  | 'dates' 
  | 'fees' 
  | 'risks';