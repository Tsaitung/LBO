/**
 * M&A Deal 驗證 Hook
 * Linus 原則：使用統一驗證系統
 */

import { useValidation } from '../../../domain/validation/hooks/useValidation';
import { useCallback } from 'react';
import { useMnaDealDesign } from '../../../hooks/typed-hooks';
import { useMnaDealCalculations } from './useMnaDealCalculations';

/**
 * M&A Deal 驗證邏輯
 * 使用統一驗證引擎
 */
export function useMnaDealValidation() {
  const mnaDealDesign = useMnaDealDesign();
  const { paymentScheduleTotalPercentage } = useMnaDealCalculations();
  
  // 使用統一驗證系統
  const {
    errors,
    warnings,
    isValid,
    validate,
    validateField,
    clearErrors,
  } = useValidation('mna-deal');

  /**
   * 驗證整個交易設計
   */
  const validateAll = useCallback(() => {
    if (!mnaDealDesign) return false;

    // 基本驗證
    const baseValidation = validate(mnaDealDesign);
    
    // 特定業務規則驗證
    let customErrors: Record<string, string> = {};

    // 驗證付款排程總和
    if (mnaDealDesign.dealType === 'assetAcquisition' && 
        paymentScheduleTotalPercentage !== 100 && 
        paymentScheduleTotalPercentage !== 0) {
      customErrors['paymentSchedule'] = `付款比例總和必須為 100%，目前為 ${paymentScheduleTotalPercentage}%`;
    }

    // 驗證交易費用
    if (mnaDealDesign.transactionFeePercentage && 
        (mnaDealDesign.transactionFeePercentage < 0 || 
         mnaDealDesign.transactionFeePercentage > 10)) {
      customErrors['transactionFee'] = '交易費用比例應在 0-10% 之間';
    }

    // 合併錯誤
    const allErrors = { ...errors, ...customErrors };
    
    return Object.keys(allErrors).length === 0 && baseValidation.valid;
  }, [mnaDealDesign, paymentScheduleTotalPercentage, validate, errors]);

  /**
   * 驗證單個欄位
   */
  const validateDealField = useCallback((field: string, value: unknown) => {
    return validateField(field, value);
  }, [validateField]);

  return {
    errors,
    warnings,
    isValid,
    validateAll,
    validateField: validateDealField,
    clearErrors,
  };
}