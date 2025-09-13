/**
 * ValidationRules - 統一驗證規則配置
 * Linus 原則：資料驅動，無特殊案例
 * 
 * "Good taste: Eliminate special cases" - Linus Torvalds
 */

import { ValidationRule } from '../ValidationEngine';
import { CommonValidators } from '../validators/CommonValidators';
import { FinancialValidators } from '../validators/FinancialValidators';

/**
 * 營收指標驗證規則
 */
export const RevenueMetricsRules: ValidationRule<unknown>[] = [
  {
    field: 'revenue',
    validator: CommonValidators.positive as (value: unknown, context?: unknown) => boolean,
    message: '營業收入必須為正數',
  },
  {
    field: 'cogs',
    validator: CommonValidators.nonNegative as (value: unknown, context?: unknown) => boolean,
    message: '銷貨成本不能為負數',
  },
  {
    field: 'cogs',
    validator: (value: unknown, context?: unknown) => {
      const ctx = context as { revenue?: number };
      return !ctx?.revenue || Number(value) <= ctx.revenue;
    },
    message: '銷貨成本不能超過營業收入',
    severity: 'warning',
  },
];

/**
 * 獲利能力驗證規則
 */
export const ProfitabilityRules: ValidationRule<unknown>[] = [
  {
    field: 'operatingExpenses',
    validator: CommonValidators.nonNegative as (value: unknown, context?: unknown) => boolean,
    message: '營業費用不能為負數',
  },
  {
    field: 'depreciationAmortization',
    validator: CommonValidators.nonNegative as (value: unknown, context?: unknown) => boolean,
    message: '折舊攤銷不能為負數',
  },
  {
    field: 'interestExpense',
    validator: CommonValidators.nonNegative as (value: unknown, context?: unknown) => boolean,
    message: '利息費用不能為負數',
  },
  {
    field: 'taxExpense',
    validator: CommonValidators.nonNegative as (value: unknown, context?: unknown) => boolean,
    message: '稅費不能為負數',
  },
];

/**
 * 資產驗證規則
 */
export const AssetRules: ValidationRule<unknown>[] = [
  {
    field: 'cashAndCashEquivalents',
    validator: CommonValidators.nonNegative as (value: unknown, context?: unknown) => boolean,
    message: '現金及約當現金不能為負數',
  },
  {
    field: 'accountsReceivable',
    validator: CommonValidators.nonNegative as (value: unknown, context?: unknown) => boolean,
    message: '應收帳款不能為負數',
  },
  {
    field: 'inventory',
    validator: CommonValidators.nonNegative as (value: unknown, context?: unknown) => boolean,
    message: '存貨不能為負數',
  },
  {
    field: 'propertyPlantEquipment',
    validator: CommonValidators.nonNegative as (value: unknown, context?: unknown) => boolean,
    message: '不動產廠房設備不能為負數',
  },
];

/**
 * 負債驗證規則
 */
export const LiabilityRules: ValidationRule<unknown>[] = [
  {
    field: 'accountsPayable',
    validator: CommonValidators.nonNegative as (value: unknown, context?: unknown) => boolean,
    message: '應付帳款不能為負數',
  },
  {
    field: 'shortTermDebt',
    validator: CommonValidators.nonNegative as (value: unknown, context?: unknown) => boolean,
    message: '短期債務不能為負數',
  },
  {
    field: 'longTermDebt',
    validator: CommonValidators.nonNegative as (value: unknown, context?: unknown) => boolean,
    message: '長期債務不能為負數',
  },
];

/**
 * 融資計畫驗證規則
 */
export const FinancingRules: ValidationRule<unknown>[] = [
  {
    field: 'amount',
    validator: CommonValidators.positive as (value: unknown, context?: unknown) => boolean,
    message: '融資金額必須大於 0',
  },
  {
    field: 'interestRate',
    validator: FinancialValidators.interestRate as (value: unknown, context?: unknown) => boolean,
    message: '利率必須在 0% 到 30% 之間',
  },
  {
    field: 'maturity',
    validator: FinancialValidators.loanTerm as (value: unknown, context?: unknown) => boolean,
    message: '貸款期限必須在 1 到 30 年之間',
  },
  {
    field: 'loanType',
    validator: (value: unknown) => {
      const validTypes = ['equalPayment', 'equalPrincipal', 'bullet', 'interestOnly', 'revolving'];
      return validTypes.includes(value as string);
    },
    message: '無效的貸款類型',
  },
];

/**
 * 情境假設驗證規則
 */
export const ScenarioRules: ValidationRule<unknown>[] = [
  {
    field: 'entryEvEbitdaMultiple',
    validator: FinancialValidators.evEbitdaMultiple as (value: unknown, context?: unknown) => boolean,
    message: '入場倍數必須在 0 到 50 之間',
  },
  {
    field: 'exitEvEbitdaMultiple',
    validator: FinancialValidators.evEbitdaMultiple as (value: unknown, context?: unknown) => boolean,
    message: '出場倍數必須在 0 到 50 之間',
  },
  {
    field: 'cogsAsPercentageOfRevenue',
    validator: CommonValidators.percentage as (value: unknown, context?: unknown) => boolean,
    message: 'COGS 比例必須在 0% 到 100% 之間',
  },
  {
    field: 'operatingExpensesAsPercentageOfRevenue',
    validator: CommonValidators.percentage as (value: unknown, context?: unknown) => boolean,
    message: '營業費用比例必須在 0% 到 100% 之間',
  },
  {
    field: 'scenario',
    validator: (value: unknown, context?: unknown) => {
      const ctx = context as { cogsAsPercentageOfRevenue?: number; operatingExpensesAsPercentageOfRevenue?: number };
      const cogs = ctx?.cogsAsPercentageOfRevenue || 0;
      const opex = ctx?.operatingExpensesAsPercentageOfRevenue || 0;
      return (cogs + opex) <= 100;
    },
    message: 'COGS + 營業費用不能超過 100%',
    severity: 'error',
  },
];

/**
 * M&A 交易驗證規則
 */
export const MnaDealRules: ValidationRule<unknown>[] = [
  {
    field: 'planningHorizon',
    validator: CommonValidators.range(1, 10) as (value: unknown, context?: unknown) => boolean,
    message: '規劃年期必須在 1 到 10 年之間',
  },
  {
    field: 'exitYear',
    validator: (value: unknown, context?: unknown) => {
      const numValue = Number(value);
      const ctx = context as { planningHorizon?: number };
      return numValue >= 1 && numValue <= (ctx?.planningHorizon || 10);
    },
    message: '退出年份必須在規劃期間內',
  },
  {
    field: 'managementRollover',
    validator: CommonValidators.range(0, 100) as (value: unknown, context?: unknown) => boolean,
    message: '管理層再投資比例必須在 0% 到 100% 之間',
  },
];

/**
 * 財務報表驗證規則
 */
export const FinancialStatementRules: ValidationRule<unknown>[] = [
  {
    field: 'balanceSheet',
    validator: (value: unknown) => {
      const { totalAssets, totalLiabilities, shareholdersEquity } = value as { totalAssets: number; totalLiabilities: number; shareholdersEquity: number };
      return FinancialValidators.balanceSheet({
        totalAssets,
        totalLiabilities,
        shareholdersEquity,
      });
    },
    message: '資產 ≠ 負債 + 股東權益，資產負債表不平衡',
    severity: 'error',
  },
  {
    field: 'debtServiceCoverage',
    validator: (value: unknown) => {
      return FinancialValidators.debtServiceCoverage(value as { ebitda: number; interestExpense: number; principalPayment: number });
    },
    message: '債務覆蓋率低於 1.2x',
    severity: 'warning',
  },
  {
    field: 'leverageRatio',
    validator: (value: unknown) => {
      return FinancialValidators.leverageRatio(value as { totalDebt: number; ebitda: number });
    },
    message: '槓桿比率超過 7x',
    severity: 'warning',
  },
];

/**
 * 驗證規則註冊表
 * 統一管理所有驗證規則
 */
export class ValidationRuleRegistry {
  private static rules = new Map<string, ValidationRule[]>([
    ['revenue', RevenueMetricsRules],
    ['profitability', ProfitabilityRules],
    ['assets', AssetRules],
    ['liabilities', LiabilityRules],
    ['financing', FinancingRules],
    ['scenario', ScenarioRules],
    ['mna-deal', MnaDealRules],
    ['financial-statements', FinancialStatementRules],
  ]);

  /**
   * 取得規則
   */
  static getRules(domain: string): ValidationRule[] {
    return this.rules.get(domain) || [];
  }

  /**
   * 註冊自定義規則
   */
  static register(domain: string, rules: ValidationRule[]): void {
    this.rules.set(domain, rules);
  }

  /**
   * 取得所有 domain
   */
  static getDomains(): string[] {
    return Array.from(this.rules.keys());
  }
}