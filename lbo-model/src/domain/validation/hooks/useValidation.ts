/**
 * useValidation Hook - 統一驗證 Hook
 * Linus 原則：單一入口，無特殊案例
 */

import { useState, useCallback, useMemo } from 'react';
import { ValidationEngine, ValidationResult } from '../ValidationEngine';
import { ValidationRuleRegistry } from '../rules/ValidationRules';

/**
 * 驗證狀態
 */
interface ValidationState {
  errors: Record<string, string>;
  warnings: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
}

/**
 * 統一驗證 Hook
 * 取代所有分散的驗證邏輯
 */
export function useValidation<T = unknown>(domain: string) {
  // 驗證引擎（單例）
  const engine = useMemo(() => {
    const instance = new ValidationEngine();
    const rules = ValidationRuleRegistry.getRules(domain);
    instance.register(domain, rules);
    return instance;
  }, [domain]);

  // 驗證狀態
  const [state, setState] = useState<ValidationState>({
    errors: {},
    warnings: {},
    isValid: true,
    isDirty: false,
  });

  /**
   * 執行驗證
   * 統一流程，無特殊處理
   */
  const validate = useCallback((data: T, context?: Record<string, unknown>): ValidationResult => {
    const result = engine.validate(domain, data, context);
    
    // 轉換為易用的格式
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};
    
    result.errors.forEach(error => {
      errors[error.field] = error.message;
    });
    
    result.warnings.forEach(warning => {
      warnings[warning.field] = warning.message;
    });
    
    setState({
      errors,
      warnings,
      isValid: result.valid,
      isDirty: true,
    });
    
    return result;
  }, [engine, domain]);

  /**
   * 驗證單一欄位
   * 即時回饋，無延遲
   */
  const validateField = useCallback((
    field: string, 
    value: unknown, 
    data?: T
  ): boolean => {
    // 建立臨時驗證引擎
    const fieldEngine = new ValidationEngine();
    const rules = ValidationRuleRegistry.getRules(domain);
    
    // 只註冊該欄位的規則
    const fieldRules = rules.filter(rule => rule.field === field);
    fieldEngine.register(`${domain}-${field}`, fieldRules);
    
    // 執行驗證
    const fieldData = { [field]: value };
    const result = fieldEngine.validate(`${domain}-${field}`, fieldData, data as Record<string, unknown>);
    
    // 更新狀態
    setState(prev => {
      const newErrors = { ...prev.errors };
      const newWarnings = { ...prev.warnings };
      
      // 清除舊的錯誤
      delete newErrors[field];
      delete newWarnings[field];
      
      // 添加新的錯誤
      result.errors.forEach(error => {
        newErrors[error.field] = error.message;
      });
      
      result.warnings.forEach(warning => {
        newWarnings[warning.field] = warning.message;
      });
      
      return {
        ...prev,
        errors: newErrors,
        warnings: newWarnings,
        isValid: Object.keys(newErrors).length === 0,
      };
    });
    
    return result.valid;
  }, [domain]);

  /**
   * 清除錯誤
   */
  const clearErrors = useCallback((field?: string) => {
    setState(prev => {
      if (field) {
        const newErrors = { ...prev.errors };
        const newWarnings = { ...prev.warnings };
        delete newErrors[field];
        delete newWarnings[field];
        
        return {
          ...prev,
          errors: newErrors,
          warnings: newWarnings,
          isValid: Object.keys(newErrors).length === 0,
        };
      }
      
      return {
        errors: {},
        warnings: {},
        isValid: true,
        isDirty: false,
      };
    });
  }, []);

  /**
   * 重置驗證狀態
   */
  const reset = useCallback(() => {
    setState({
      errors: {},
      warnings: {},
      isValid: true,
      isDirty: false,
    });
  }, []);

  /**
   * 取得欄位錯誤訊息
   */
  const getFieldError = useCallback((field: string): string | undefined => {
    return state.errors[field];
  }, [state.errors]);

  /**
   * 取得欄位警告訊息
   */
  const getFieldWarning = useCallback((field: string): string | undefined => {
    return state.warnings[field];
  }, [state.warnings]);

  /**
   * 檢查欄位是否有錯誤
   */
  const hasFieldError = useCallback((field: string): boolean => {
    return !!state.errors[field];
  }, [state.errors]);

  return {
    // 狀態
    errors: state.errors,
    warnings: state.warnings,
    isValid: state.isValid,
    isDirty: state.isDirty,
    
    // 方法
    validate,
    validateField,
    clearErrors,
    reset,
    
    // 輔助方法
    getFieldError,
    getFieldWarning,
    hasFieldError,
  };
}

/**
 * 批量驗證 Hook
 * 用於複雜表單的多域驗證
 */
export function useBatchValidation<T = unknown>(domains: string[]) {
  const engine = useMemo(() => {
    const instance = new ValidationEngine();
    
    // 註冊所有域的規則
    domains.forEach(domain => {
      const rules = ValidationRuleRegistry.getRules(domain);
      instance.register(domain, rules);
    });
    
    return instance;
  }, [domains]);

  const [results, setResults] = useState<Map<string, ValidationResult>>(new Map());

  /**
   * 批量驗證
   */
  const validateAll = useCallback((
    dataMap: Map<string, T>,
    contextMap?: Map<string, Record<string, unknown>>
  ) => {
    const validations = Array.from(dataMap.entries()).map(([domain, data]) => ({
      domain,
      data,
      context: contextMap?.get(domain),
    }));
    
    const batchResults = engine.validateBatch(validations);
    setResults(batchResults);
    
    // 檢查是否全部有效
    const allValid = Array.from(batchResults.values()).every(r => r.valid);
    
    return {
      results: batchResults,
      isValid: allValid,
    };
  }, [engine]);

  /**
   * 取得特定域的結果
   */
  const getResult = useCallback((domain: string): ValidationResult | undefined => {
    return results.get(domain);
  }, [results]);

  /**
   * 清除結果
   */
  const clear = useCallback(() => {
    setResults(new Map());
  }, []);

  return {
    results,
    validateAll,
    getResult,
    clear,
  };
}