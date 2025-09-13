/**
 * 輸入驗證器
 * 確保所有必要參數都已設定，遵循"缺參數就報錯"原則
 */

import { CalculationInput } from '../index';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 驗證業務指標
 */
function validateBusinessMetrics(input: CalculationInput): string[] {
  const errors: string[] = [];
  const { businessMetrics } = input;

  if (!businessMetrics) {
    errors.push('業務指標數據缺失');
    return errors;
  }

  if (!businessMetrics.revenue || businessMetrics.revenue <= 0) {
    errors.push('營收必須大於 0');
  }

  if (!businessMetrics.ebitda || businessMetrics.ebitda <= 0) {
    errors.push('EBITDA 必須大於 0');
  }

  if (businessMetrics.totalAssets < 0) {
    errors.push('總資產不能為負數');
  }

  if (businessMetrics.totalLiabilities < 0) {
    errors.push('總負債不能為負數');
  }

  return errors;
}

/**
 * 驗證假設參數
 */
function validateAssumptions(input: CalculationInput): string[] {
  const errors: string[] = [];
  const { assumptions } = input;

  if (!assumptions) {
    errors.push('假設參數數據缺失');
    return errors;
  }

  // 必填參數檢查
  if (assumptions.depreciationToCapexRatio === undefined || assumptions.depreciationToCapexRatio === null) {
    errors.push('D&A/CapEx 比例未設定');
  }

  if (assumptions.fixedAssetsToCapexMultiple === undefined || assumptions.fixedAssetsToCapexMultiple === null) {
    errors.push('固定資產/CapEx 倍數未設定');
  }

  if (assumptions.revolvingCreditRepaymentRate === undefined || assumptions.revolvingCreditRepaymentRate === null) {
    errors.push('循環信用年償還率未設定');
  }

  // 範圍檢查
  if (assumptions.revenueGrowthRate < -50 || assumptions.revenueGrowthRate > 100) {
    errors.push('營收增長率必須在 -50% 到 100% 之間');
  }

  if (assumptions.ebitdaMargin < 0 || assumptions.ebitdaMargin > 100) {
    errors.push('EBITDA 利潤率必須在 0% 到 100% 之間');
  }

  if (assumptions.taxRate < 0 || assumptions.taxRate > 100) {
    errors.push('稅率必須在 0% 到 100% 之間');
  }

  if (assumptions.depreciationToCapexRatio < 0 || assumptions.depreciationToCapexRatio > 100) {
    errors.push('D&A/CapEx 比例必須在 0% 到 100% 之間');
  }

  if (assumptions.fixedAssetsToCapexMultiple < 1 || assumptions.fixedAssetsToCapexMultiple > 50) {
    errors.push('固定資產/CapEx 倍數必須在 1 到 50 之間');
  }

  if (assumptions.revolvingCreditRepaymentRate < 0 || assumptions.revolvingCreditRepaymentRate > 100) {
    errors.push('循環信用年償還率必須在 0% 到 100% 之間');
  }

  return errors;
}

/**
 * 驗證交易設計
 */
function validateDealDesign(input: CalculationInput): string[] {
  const errors: string[] = [];
  const { dealDesign } = input;

  if (!dealDesign) {
    errors.push('交易設計數據缺失');
    return errors;
  }

  // 交易費用必須設定（不再有預設值）
  if (dealDesign.transactionFeePercentage === undefined || dealDesign.transactionFeePercentage === null) {
    errors.push('交易費用百分比未設定');
  } else if (dealDesign.transactionFeePercentage < 0 || dealDesign.transactionFeePercentage > 10) {
    errors.push('交易費用百分比必須在 0% 到 10% 之間');
  }

  if (dealDesign.planningHorizon < 1 || dealDesign.planningHorizon > 10) {
    errors.push('規劃年期必須在 1 到 10 年之間');
  }

  return errors;
}

/**
 * 驗證融資計劃
 */
function validateFinancingPlans(input: CalculationInput): string[] {
  const errors: string[] = [];
  const { financingPlans } = input;

  if (!financingPlans || financingPlans.length === 0) {
    // 允許沒有債務融資
    return errors;
  }

  financingPlans.forEach((plan, index) => {
    if (!plan.name) {
      errors.push(`融資計劃 ${index + 1} 缺少名稱`);
    }

    if (plan.amount <= 0) {
      errors.push(`融資計劃 "${plan.name}" 的金額必須大於 0`);
    }

    if (plan.interestRate < 0 || plan.interestRate > 50) {
      errors.push(`融資計劃 "${plan.name}" 的利率必須在 0% 到 50% 之間`);
    }

    if (plan.maturity < 1 || plan.maturity > 30) {
      errors.push(`融資計劃 "${plan.name}" 的到期年限必須在 1 到 30 年之間`);
    }

    if (!plan.repaymentStructure || !plan.repaymentStructure.type) {
      errors.push(`融資計劃 "${plan.name}" 缺少還款結構`);
    }
  });

  return errors;
}

/**
 * 驗證股權注入
 */
function validateEquityInjections(input: CalculationInput): string[] {
  const errors: string[] = [];
  const { equityInjections } = input;

  if (!equityInjections || equityInjections.length === 0) {
    errors.push('至少需要一個股權注入');
    return errors;
  }

  let totalOwnership = 0;
  equityInjections.forEach((equity, index) => {
    if (!equity.name) {
      errors.push(`股權注入 ${index + 1} 缺少名稱`);
    }

    if (equity.amount <= 0) {
      errors.push(`股權注入 "${equity.name}" 的金額必須大於 0`);
    }

    if (equity.ownershipPercentage < 0 || equity.ownershipPercentage > 100) {
      errors.push(`股權注入 "${equity.name}" 的股權比例必須在 0% 到 100% 之間`);
    }

    totalOwnership += equity.ownershipPercentage;
  });

  if (totalOwnership > 100) {
    errors.push(`總股權比例 ${totalOwnership}% 超過 100%`);
  }

  return errors;
}

/**
 * 驗證情境假設
 */
function validateScenario(input: CalculationInput): string[] {
  const errors: string[] = [];
  const { scenario } = input;

  if (!scenario) {
    errors.push('情境假設數據缺失');
    return errors;
  }

  if (scenario.entryEvEbitdaMultiple <= 0 || scenario.entryEvEbitdaMultiple > 50) {
    errors.push('入場 EV/EBITDA 倍數必須在 0 到 50 之間');
  }

  if (scenario.exitEvEbitdaMultiple <= 0 || scenario.exitEvEbitdaMultiple > 50) {
    errors.push('出場 EV/EBITDA 倍數必須在 0 到 50 之間');
  }

  return errors;
}

/**
 * 主驗證函數
 * 遵循"缺參數就報錯"原則
 */
export function validateInput(input: CalculationInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 驗證各個部分
  errors.push(...validateBusinessMetrics(input));
  errors.push(...validateAssumptions(input));
  errors.push(...validateDealDesign(input));
  errors.push(...validateFinancingPlans(input));
  errors.push(...validateEquityInjections(input));
  errors.push(...validateScenario(input));

  // 檢查規劃年期
  if (!input.planningHorizon || input.planningHorizon < 1) {
    errors.push('規劃年期必須至少為 1 年');
  }

  // 產生警告
  if (input.assumptions?.ebitdaMargin < 5) {
    warnings.push('EBITDA 利潤率低於 5%，可能不太合理');
  }

  if (input.dealDesign?.transactionFeePercentage > 5) {
    warnings.push('交易費用超過 5%，較為罕見');
  }

  const totalDebt = input.financingPlans?.reduce((sum, plan) => sum + plan.amount, 0) || 0;
  const totalEquity = input.equityInjections?.reduce((sum, eq) => sum + eq.amount, 0) || 0;
  if (totalDebt > 0 && totalEquity > 0) {
    const debtToEquity = totalDebt / totalEquity;
    if (debtToEquity > 10) {
      warnings.push(`債務股權比 ${debtToEquity.toFixed(1)}:1 過高，風險較大`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 驗證計算結果的合理性
 */
export function validateCalculationResult(result: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 檢查是否有 NaN 或 Infinity
  const checkForInvalidNumbers = (obj: Record<string, unknown>, path: string = '') => {
    for (const key in obj) {
      const value = obj[key];
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'number') {
        if (isNaN(value)) {
          errors.push(`${currentPath} 包含 NaN`);
        }
        if (!isFinite(value)) {
          errors.push(`${currentPath} 包含無限值`);
        }
      } else if (typeof value === 'object' && value !== null) {
        checkForInvalidNumbers(value as Record<string, unknown>, currentPath);
      }
    }
  };

  if (typeof result === 'object' && result !== null) {
    checkForInvalidNumbers(result as Record<string, unknown>);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}