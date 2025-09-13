/**
 * 業務指標驗證 Hook
 * Linus 原則：統一驗證邏輯，無特殊情況
 */

import { useState, useCallback, useMemo } from 'react';
import {
  validateField,
  validateAll,
  revenueValidationRules,
  profitabilityValidationRules,
  assetValidationRules,
  liabilityValidationRules,
} from '../constants/validationRules';

export interface ValidationState {
  errors: Record<string, string>;
  isValid: boolean;
}

/**
 * 使用指標驗證 Hook
 * @param section - 驗證區段
 * @returns 驗證狀態和函數
 */
export function useMetricsValidation(section: 'revenue' | 'profitability' | 'asset' | 'liability' | 'all') {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 根據區段選擇驗證規則
  const validationRules = useMemo(() => {
    switch (section) {
      case 'revenue':
        return revenueValidationRules;
      case 'profitability':
        return profitabilityValidationRules;
      case 'asset':
        return assetValidationRules;
      case 'liability':
        return liabilityValidationRules;
      case 'all':
        return [
          ...revenueValidationRules,
          ...profitabilityValidationRules,
          ...assetValidationRules,
          ...liabilityValidationRules,
        ];
      default:
        return [];
    }
  }, [section]);
  
  // 驗證單個欄位
  const validateSingleField = useCallback((fieldName: string, value: unknown) => {
    const error = validateField(value, validationRules, fieldName);
    
    setErrors(prev => {
      if (error) {
        return { ...prev, [fieldName]: error };
      } else {
        const { [fieldName]: _, ...rest } = prev;
        return rest;
      }
    });
    
    return !error;
  }, [validationRules]);
  
  // 驗證所有欄位
  const validateAllFields = useCallback((data: Record<string, unknown>) => {
    const newErrors = validateAll(data, validationRules);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validationRules]);
  
  // 清除錯誤
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);
  
  // 清除特定欄位錯誤
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const { [fieldName]: _, ...rest } = prev;
      return rest;
    });
  }, []);
  
  // 計算是否有效
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);
  
  return {
    errors,
    isValid,
    validateField: validateSingleField,
    validateAll: validateAllFields,
    clearErrors,
    clearFieldError,
  };
}