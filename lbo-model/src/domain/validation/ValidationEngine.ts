/**
 * ValidationEngine - 統一驗證引擎
 * Linus 原則：無特殊案例，純資料驅動
 * 
 * "Good code has no special cases" - Linus Torvalds
 */

import { Validator, ValidationContext as BaseValidationContext } from '../../types/validation';

/**
 * 驗證規則介面
 * 純函數，無副作用
 */
export interface ValidationRule<T = unknown> {
  field: string;
  validator: Validator<T>;
  message: string | ((value: T) => string);
  severity?: 'error' | 'warning' | 'info';
}

/**
 * 驗證結果
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * 驗證錯誤
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  value?: unknown;
}

/**
 * 驗證上下文
 * 提供額外資訊給驗證器
 */
export interface ValidationContext extends BaseValidationContext {}

/**
 * 統一驗證引擎
 * 無特殊案例，所有驗證使用相同流程
 */
export class ValidationEngine {
  private rules: Map<string, ValidationRule<unknown>[]> = new Map();

  /**
   * 註冊驗證規則
   * 資料驅動，無條件分支
   */
  register<T = unknown>(domain: string, rules: ValidationRule<T>[]): void {
    this.rules.set(domain, rules as ValidationRule<unknown>[]);
  }

  /**
   * 執行驗證
   * 統一流程，無特殊處理
   */
  validate<T = unknown>(
    domain: string,
    data: T,
    context?: ValidationContext
  ): ValidationResult {
    const rules = this.rules.get(domain) || [];
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 統一驗證流程，無特殊案例
    rules.forEach(rule => {
      const value = this.getValue(data, rule.field);
      const isValid = rule.validator(value, context);

      if (!isValid) {
        const message = typeof rule.message === 'function'
          ? rule.message(value)
          : rule.message;

        const error: ValidationError = {
          field: rule.field,
          message,
          severity: rule.severity || 'error',
          value,
        };

        // 根據嚴重性分類，無特殊處理
        if (error.severity === 'warning') {
          warnings.push(error);
        } else {
          errors.push(error);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 批量驗證
   * 無特殊案例，統一處理
   */
  validateBatch<T = unknown>(
    validations: Array<{ domain: string; data: T; context?: ValidationContext }>
  ): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();
    
    // 統一批量處理，無條件分支
    validations.forEach(({ domain, data, context }) => {
      results.set(domain, this.validate(domain, data, context));
    });

    return results;
  }

  /**
   * 取得欄位值
   * 支援巢狀路徑，無特殊處理
   */
  private getValue<T>(data: T, path: string): unknown {
    return path.split('.').reduce((obj: unknown, key: string) => {
      if (obj && typeof obj === 'object' && key in obj) {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, data);
  }

  /**
   * 合併驗證結果
   * 純函數，無副作用
   */
  static mergeResults(...results: ValidationResult[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 統一合併，無特殊案例
    results.forEach(result => {
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 清除規則
   */
  clear(domain?: string): void {
    if (domain) {
      this.rules.delete(domain);
    } else {
      this.rules.clear();
    }
  }

  /**
   * 取得已註冊的 domain
   */
  getDomains(): string[] {
    return Array.from(this.rules.keys());
  }
}