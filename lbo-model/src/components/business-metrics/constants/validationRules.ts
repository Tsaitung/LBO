/**
 * 業務指標驗證規則
 * Linus 原則：數據結構勝於演算法
 * 規則驅動，無特殊情況
 */

export interface ValidationRule {
  field: string;
  validator: (value: unknown) => boolean;
  message: string;
}

// 通用驗證函數
export const validators = {
  required: (value: unknown) => value !== undefined && value !== null && value !== '',
  positive: (value: unknown) => typeof value === 'number' && value >= 0,
  percentage: (value: unknown) => typeof value === 'number' && value >= 0 && value <= 100,
  min: (min: number) => (value: unknown) => typeof value === 'number' && value >= min,
  max: (max: number) => (value: unknown) => typeof value === 'number' && value <= max,
  range: (min: number, max: number) => (value: unknown) => typeof value === 'number' && value >= min && value <= max,
};

// 營收相關驗證規則
export const revenueValidationRules: ValidationRule[] = [
  {
    field: 'revenue',
    validator: validators.positive,
    message: '營業收入必須為正數',
  },
  {
    field: 'cogs',
    validator: validators.positive,
    message: '銷貨成本必須為正數',
  },
  {
    field: 'grossMargin',
    validator: validators.percentage,
    message: '毛利率必須在 0-100% 之間',
  },
];

// 獲利能力驗證規則
export const profitabilityValidationRules: ValidationRule[] = [
  {
    field: 'operatingExpenses',
    validator: validators.positive,
    message: '營業費用必須為正數',
  },
  {
    field: 'ebitda',
    validator: (_value: unknown) => true, // EBITDA 可以為負
    message: '',
  },
  {
    field: 'interestExpense',
    validator: validators.positive,
    message: '利息費用必須為正數',
  },
  {
    field: 'taxExpense',
    validator: validators.positive,
    message: '稅費必須為正數',
  },
];

// 資產驗證規則
export const assetValidationRules: ValidationRule[] = [
  {
    field: 'cashAndCashEquivalents',
    validator: validators.positive,
    message: '現金必須為正數',
  },
  {
    field: 'accountsReceivable',
    validator: validators.positive,
    message: '應收帳款必須為正數',
  },
  {
    field: 'inventory',
    validator: validators.positive,
    message: '存貨必須為正數',
  },
  {
    field: 'propertyPlantEquipment',
    validator: validators.positive,
    message: '固定資產必須為正數',
  },
];

// 負債驗證規則
export const liabilityValidationRules: ValidationRule[] = [
  {
    field: 'accountsPayable',
    validator: validators.positive,
    message: '應付帳款必須為正數',
  },
  {
    field: 'shortTermDebt',
    validator: validators.positive,
    message: '短期債務必須為正數',
  },
  {
    field: 'longTermDebt',
    validator: validators.positive,
    message: '長期債務必須為正數',
  },
];

// 統一驗證函數
export function validateField(value: unknown, rules: ValidationRule[], fieldName: string): string | null {
  const rule = rules.find(r => r.field === fieldName);
  if (!rule) return null;
  
  if (!rule.validator(value)) {
    return rule.message;
  }
  
  return null;
}

// 批量驗證
export function validateAll(data: Record<string, unknown>, rules: ValidationRule[]): Record<string, string> {
  const errors: Record<string, string> = {};
  
  rules.forEach(rule => {
    const value = data[rule.field];
    if (!rule.validator(value)) {
      errors[rule.field] = rule.message;
    }
  });
  
  return errors;
}