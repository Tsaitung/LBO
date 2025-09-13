/**
 * 財務計算常數配置
 * 統一管理預設值，可依需求調整
 */

export const FINANCIAL_CONSTANTS = {
  // 折舊攤銷相關
  DEPRECIATION: {
    // D&A 佔 CapEx 的比例（20%）
    TO_CAPEX_RATIO: 0.2,
    DEFAULT_METHOD: 'straight-line' as const,
  },

  // 固定資產相關
  FIXED_ASSETS: {
    // 固定資產為 CapEx 的倍數（10倍）
    TO_CAPEX_MULTIPLIER: 10,
  },

  // 循環信用相關
  REVOLVING_CREDIT: {
    // 循環信用年償還率（20%）
    ANNUAL_REPAYMENT_RATE: 0.2,
    // 最低利用率
    MIN_UTILIZATION: 0,
    // 最高利用率
    MAX_UTILIZATION: 1,
  },

  // 交易費用相關
  TRANSACTION: {
    // 預設交易費用率（2%）- 注意：現在必須從用戶輸入取得，不使用預設值
    DEFAULT_FEE_RATE: 0.02,
    // 最低費用率
    MIN_FEE_RATE: 0.005,
    // 最高費用率
    MAX_FEE_RATE: 0.05,
  },

  // 債務相關預設值
  DEBT: {
    // 優先債務預設利率
    DEFAULT_SENIOR_RATE: 0.05,
    // 夾層債務預設利率
    DEFAULT_MEZZANINE_RATE: 0.08,
    // 循環信貸預設利率
    DEFAULT_REVOLVER_RATE: 0.03,
  },

  // 財務比率限制
  COVENANTS: {
    // 最低 DSCR (債務服務覆蓋率)
    MIN_DSCR: 1.0,
    // 最高淨槓桿率
    MAX_NET_LEVERAGE: 6.0,
    // 最低利息覆蓋率
    MIN_INTEREST_COVERAGE: 2.0,
    // 最低現金月數
    MIN_CASH_MONTHS: 3,
  },

  // 營運資本相關
  WORKING_CAPITAL: {
    // 預設應收帳款天數
    DEFAULT_AR_DAYS: 45,
    // 預設存貨天數
    DEFAULT_INVENTORY_DAYS: 60,
    // 預設應付帳款天數
    DEFAULT_AP_DAYS: 35,
  },

  // 其他計算參數
  CALCULATION: {
    // 計算精度（小數位數）
    PRECISION: 2,
    // 最大規劃年期
    MAX_PLANNING_HORIZON: 10,
    // 預設規劃年期
    DEFAULT_PLANNING_HORIZON: 5,
  },
} as const;

// 類型定義
export type FinancialConstants = typeof FINANCIAL_CONSTANTS;

// 輔助函數：取得預設的假設參數
export function getDefaultAssumptionParameters() {
  return {
    depreciationToCapexRatio: FINANCIAL_CONSTANTS.DEPRECIATION.TO_CAPEX_RATIO * 100, // 轉為百分比
    fixedAssetsToCapexMultiple: FINANCIAL_CONSTANTS.FIXED_ASSETS.TO_CAPEX_MULTIPLIER,
    revolvingCreditRepaymentRate: FINANCIAL_CONSTANTS.REVOLVING_CREDIT.ANNUAL_REPAYMENT_RATE * 100, // 轉為百分比
  };
}

// 驗證函數：檢查參數是否在合理範圍
export function validateFinancialParameters(params: {
  depreciationToCapexRatio?: number;
  fixedAssetsToCapexMultiple?: number;
  revolvingCreditRepaymentRate?: number;
  transactionFeePercentage?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (params.depreciationToCapexRatio !== undefined) {
    if (params.depreciationToCapexRatio < 0 || params.depreciationToCapexRatio > 100) {
      errors.push('D&A/CapEx 比例必須在 0-100% 之間');
    }
  }

  if (params.fixedAssetsToCapexMultiple !== undefined) {
    if (params.fixedAssetsToCapexMultiple < 1 || params.fixedAssetsToCapexMultiple > 50) {
      errors.push('固定資產/CapEx 倍數必須在 1-50 之間');
    }
  }

  if (params.revolvingCreditRepaymentRate !== undefined) {
    if (params.revolvingCreditRepaymentRate < 0 || params.revolvingCreditRepaymentRate > 100) {
      errors.push('循環信用年償還率必須在 0-100% 之間');
    }
  }

  if (params.transactionFeePercentage !== undefined) {
    const min = FINANCIAL_CONSTANTS.TRANSACTION.MIN_FEE_RATE * 100;
    const max = FINANCIAL_CONSTANTS.TRANSACTION.MAX_FEE_RATE * 100;
    if (params.transactionFeePercentage < min || params.transactionFeePercentage > max) {
      errors.push(`交易費用必須在 ${min}%-${max}% 之間`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}