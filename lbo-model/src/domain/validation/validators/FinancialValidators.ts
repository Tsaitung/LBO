/**
 * FinancialValidators - 財務專用驗證器
 * Linus 原則：領域特定，但無特殊案例
 */

// import { CommonValidators } from './CommonValidators'; // Removed unused import

/**
 * 財務驗證器
 * 所有驗證器都是純函數
 */
export const FinancialValidators = {
  /**
   * EBITDA 倍數驗證
   */
  evEbitdaMultiple: (value: number): boolean => {
    return value > 0 && value <= 50;
  },

  /**
   * 利率驗證
   */
  interestRate: (value: number): boolean => {
    return value >= 0 && value <= 30;
  },

  /**
   * 貸款期限驗證（年）
   */
  loanTerm: (value: number): boolean => {
    return Number.isInteger(value) && value >= 1 && value <= 30;
  },

  /**
   * 負債比率驗證
   */
  debtRatio: (value: number): boolean => {
    return value >= 0 && value <= 10;
  },

  /**
   * IRR 驗證
   */
  irr: (value: number): boolean => {
    return value >= -100 && value <= 1000;
  },

  /**
   * MOIC 驗證
   */
  moic: (value: number): boolean => {
    return value >= 0 && value <= 100;
  },

  /**
   * 營收成長率驗證
   */
  revenueGrowthRate: (value: number): boolean => {
    return value >= -50 && value <= 100;
  },

  /**
   * 資產負債表平衡驗證
   */
  balanceSheet: (data: {
    totalAssets: number;
    totalLiabilities: number;
    shareholdersEquity: number;
  }): boolean => {
    const difference = Math.abs(
      data.totalAssets - (data.totalLiabilities + data.shareholdersEquity)
    );
    return difference < 0.01; // 允許小數點誤差
  },

  /**
   * 現金流驗證
   */
  cashFlow: (data: {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    beginningCash: number;
    endingCash: number;
  }): boolean => {
    const netCashFlow = 
      data.operatingCashFlow + 
      data.investingCashFlow + 
      data.financingCashFlow;
    
    const calculatedEndingCash = data.beginningCash + netCashFlow;
    const difference = Math.abs(calculatedEndingCash - data.endingCash);
    
    return difference < 0.01;
  },

  /**
   * 債務覆蓋率驗證
   */
  debtServiceCoverage: (data: {
    ebitda: number;
    interestExpense: number;
    principalPayment: number;
  }): boolean => {
    const debtService = data.interestExpense + data.principalPayment;
    if (debtService === 0) return true;
    
    const dscr = data.ebitda / debtService;
    return dscr >= 1.2; // 最低 1.2x 覆蓋率
  },

  /**
   * 營運資本驗證
   */
  workingCapital: (data: {
    currentAssets: number;
    currentLiabilities: number;
  }): boolean => {
    return data.currentAssets >= data.currentLiabilities;
  },

  /**
   * 貸款金額驗證
   */
  loanAmount: (value: number, context?: { maxLoanAmount?: number }): boolean => {
    if (value <= 0) return false;
    if (context?.maxLoanAmount) {
      return value <= context.maxLoanAmount;
    }
    return true;
  },

  /**
   * 股息分配驗證
   */
  dividendPayout: (data: {
    netIncome: number;
    dividends: number;
    retainedEarnings: number;
  }): boolean => {
    // 股息不能超過淨利
    if (data.dividends > data.netIncome) return false;
    
    // 驗證會計等式
    const difference = Math.abs(
      data.netIncome - data.dividends - data.retainedEarnings
    );
    return difference < 0.01;
  },

  /**
   * 槓桿比率驗證
   */
  leverageRatio: (data: {
    totalDebt: number;
    ebitda: number;
  }): boolean => {
    if (data.ebitda <= 0) return false;
    const ratio = data.totalDebt / data.ebitda;
    return ratio <= 7; // 最高 7x 槓桿
  },

  /**
   * 利息覆蓋率驗證
   */
  interestCoverage: (data: {
    ebitda: number;
    interestExpense: number;
  }): boolean => {
    if (data.interestExpense === 0) return true;
    const coverage = data.ebitda / data.interestExpense;
    return coverage >= 2; // 最低 2x 覆蓋
  },

  /**
   * 財務比率合理性驗證
   */
  ratioReasonableness: (ratios: {
    grossMargin?: number;
    ebitdaMargin?: number;
    netMargin?: number;
  }): boolean => {
    // 驗證利潤率遞減
    if (ratios.grossMargin !== undefined && ratios.ebitdaMargin !== undefined) {
      if (ratios.ebitdaMargin > ratios.grossMargin) return false;
    }
    
    if (ratios.ebitdaMargin !== undefined && ratios.netMargin !== undefined) {
      if (ratios.netMargin > ratios.ebitdaMargin) return false;
    }
    
    return true;
  },
};

/**
 * 財務驗證規則建構器
 */
export class FinancialRuleBuilder {
  /**
   * 建立貸款驗證規則
   */
  static loanRules() {
    return [
      {
        field: 'amount',
        validator: FinancialValidators.loanAmount,
        message: '貸款金額必須大於 0',
      },
      {
        field: 'interestRate',
        validator: FinancialValidators.interestRate,
        message: '利率必須在 0% 到 30% 之間',
      },
      {
        field: 'term',
        validator: FinancialValidators.loanTerm,
        message: '貸款期限必須在 1 到 30 年之間',
      },
    ];
  }

  /**
   * 建立情境驗證規則
   */
  static scenarioRules() {
    return [
      {
        field: 'entryEvEbitdaMultiple',
        validator: FinancialValidators.evEbitdaMultiple,
        message: '入場倍數必須在 0 到 50 之間',
      },
      {
        field: 'exitEvEbitdaMultiple',
        validator: FinancialValidators.evEbitdaMultiple,
        message: '出場倍數必須在 0 到 50 之間',
      },
      {
        field: 'revenueGrowthRate',
        validator: FinancialValidators.revenueGrowthRate,
        message: '營收成長率必須在 -50% 到 100% 之間',
      },
    ];
  }

  /**
   * 建立財務報表驗證規則
   */
  static financialStatementRules() {
    return [
      {
        field: 'balanceSheet',
        validator: FinancialValidators.balanceSheet,
        message: '資產負債表不平衡',
        severity: 'error' as const,
      },
      {
        field: 'cashFlow',
        validator: FinancialValidators.cashFlow,
        message: '現金流計算有誤',
        severity: 'warning' as const,
      },
      {
        field: 'ratios',
        validator: FinancialValidators.ratioReasonableness,
        message: '財務比率不合理',
        severity: 'warning' as const,
      },
    ];
  }
}