/**
 * Validation Domain 導出
 * Linus 原則：單一入口，簡化使用
 */

// 內部導入（用於 ValidationService）
import { ValidationEngine as VEngine, ValidationResult as VResult } from './ValidationEngine';
import { ValidationRuleRegistry as VRuleRegistry } from './rules/ValidationRules';

// 核心引擎
export { ValidationEngine } from './ValidationEngine';
export type { 
  ValidationRule, 
  ValidationResult, 
  ValidationError, 
  ValidationContext 
} from './ValidationEngine';

// 驗證器
export { CommonValidators } from './validators/CommonValidators';
export { FinancialValidators } from './validators/FinancialValidators';

// 規則
export { 
  RevenueMetricsRules,
  ProfitabilityRules,
  AssetRules,
  LiabilityRules,
  FinancingRules,
  ScenarioRules,
  MnaDealRules,
  FinancialStatementRules,
  ValidationRuleRegistry 
} from './rules/ValidationRules';

// Hooks
export { useValidation, useBatchValidation } from './hooks/useValidation';

/**
 * 快速初始化驗證引擎
 * 為常見用例提供便捷方法
 */
export class ValidationService {
  private static engine: VEngine | null = null;

  /**
   * 取得單例引擎
   */
  static getEngine(): VEngine {
    if (!this.engine) {
      this.engine = new VEngine();
      this.registerDefaultRules();
    }
    return this.engine;
  }

  /**
   * 註冊預設規則
   */
  private static registerDefaultRules(): void {
    if (!this.engine) return;

    const registry = VRuleRegistry;
    const domains = registry.getDomains();
    
    domains.forEach(domain => {
      const rules = registry.getRules(domain);
      this.engine!.register(domain, rules);
    });
  }

  /**
   * 快速驗證
   */
  static validate(domain: string, data: unknown, context?: unknown): VResult {
    return this.getEngine().validate(domain, data, context as any);
  }

  /**
   * 重置引擎
   */
  static reset(): void {
    this.engine = null;
  }
}