/**
 * 融資操作 Hook
 * 將業務邏輯從組件中抽離
 * Linus 原則：關注點分離，單一職責
 */

import { useCallback, useMemo } from 'react';
import { useAppDispatch } from './typed-hooks';
import { useMnaDeal } from './typed-hooks';
import { updateDealDesign } from '../store/slices/mnaDealDesign.slice';
import {
  createFinancingPlan,
  createEquityInjection,
  updateFinancingPlanInList,
  updateEquityInjectionInList,
  sortFinancingPlans,
  validateFinancingPlan,
  validateEquityInjection
} from '../domain/financing/FinancingService';
import { FacilityType, EquityType, FinancingPlan, EquityInjection } from '../types/financial';

/**
 * 融資計劃操作 Hook
 */
export function useFinancingPlanActions() {
  const dispatch = useAppDispatch();
  const mnaDeal = useMnaDeal();
  const financingPlans = mnaDeal?.financingPlans || [];

  // 添加融資計劃
  const addFinancingPlan = useCallback((facilityType: FacilityType) => {
    const newPlan = createFinancingPlan(facilityType);
    const updatedPlans = sortFinancingPlans([...financingPlans, newPlan]);
    
    dispatch(updateDealDesign({
      financingPlans: updatedPlans
    }));
    
    return newPlan.id;
  }, [dispatch, financingPlans]);

  // 更新融資計劃
  const updateFinancingPlan = useCallback((
    id: string,
    updates: Partial<FinancingPlan>
  ) => {
    const updatedPlans = updateFinancingPlanInList(financingPlans, id, updates);
    
    dispatch(updateDealDesign({
      financingPlans: updatedPlans
    }));
  }, [dispatch, financingPlans]);

  // 刪除融資計劃
  const deleteFinancingPlan = useCallback((id: string) => {
    const filteredPlans = financingPlans.filter(p => p.id !== id);
    
    dispatch(updateDealDesign({
      financingPlans: filteredPlans
    }));
  }, [dispatch, financingPlans]);

  // 重新排序融資計劃
  const reorderFinancingPlans = useCallback((reorderedPlans: FinancingPlan[]) => {
    dispatch(updateDealDesign({
      financingPlans: reorderedPlans
    }));
  }, [dispatch]);

  // 驗證單個計劃
  const validatePlan = useCallback((id: string): string[] => {
    const plan = financingPlans.find(p => p.id === id);
    return plan ? validateFinancingPlan(plan) : [];
  }, [financingPlans]);

  // 批量更新
  const batchUpdatePlans = useCallback((
    updates: Array<{ id: string; changes: Partial<FinancingPlan> }>
  ) => {
    let updatedPlans = [...financingPlans];
    
    updates.forEach(({ id, changes }) => {
      updatedPlans = updateFinancingPlanInList(updatedPlans, id, changes);
    });
    
    dispatch(updateDealDesign({
      financingPlans: sortFinancingPlans(updatedPlans)
    }));
  }, [dispatch, financingPlans]);

  return useMemo(() => ({
    addFinancingPlan,
    updateFinancingPlan,
    deleteFinancingPlan,
    reorderFinancingPlans,
    validatePlan,
    batchUpdatePlans
  }), [
    addFinancingPlan,
    updateFinancingPlan,
    deleteFinancingPlan,
    reorderFinancingPlans,
    validatePlan,
    batchUpdatePlans
  ]);
}

/**
 * 股權注入操作 Hook
 */
export function useEquityInjectionActions() {
  const dispatch = useAppDispatch();
  const mnaDeal = useMnaDeal();
  const equityInjections = mnaDeal?.equityInjections || [];

  // 添加股權注入
  const addEquityInjection = useCallback((equityType: EquityType) => {
    const newInjection = createEquityInjection(equityType);
    const updatedInjections = [...equityInjections, newInjection];
    
    dispatch(updateDealDesign({
      equityInjections: updatedInjections
    }));
    
    return newInjection.id;
  }, [dispatch, equityInjections]);

  // 更新股權注入
  const updateEquityInjection = useCallback((
    id: string,
    updates: Partial<EquityInjection>
  ) => {
    const updatedInjections = updateEquityInjectionInList(
      equityInjections,
      id,
      updates
    );
    
    dispatch(updateDealDesign({
      equityInjections: updatedInjections
    }));
  }, [dispatch, equityInjections]);

  // 刪除股權注入
  const deleteEquityInjection = useCallback((id: string) => {
    const filteredInjections = equityInjections.filter(i => i.id !== id);
    
    dispatch(updateDealDesign({
      equityInjections: filteredInjections
    }));
  }, [dispatch, equityInjections]);

  // 驗證單個注入
  const validateInjection = useCallback((id: string): string[] => {
    const injection = equityInjections.find(i => i.id === id);
    return injection ? validateEquityInjection(injection) : [];
  }, [equityInjections]);

  return useMemo(() => ({
    addEquityInjection,
    updateEquityInjection,
    deleteEquityInjection,
    validateInjection
  }), [
    addEquityInjection,
    updateEquityInjection,
    deleteEquityInjection,
    validateInjection
  ]);
}

/**
 * 融資驗證 Hook
 */
export function useFinancingValidation() {
  const mnaDeal = useMnaDeal();
  
  // 獲取所有無效的融資計劃
  const invalidPlans = useMemo(() => {
    return (mnaDeal?.financingPlans || []).filter(plan => {
      const errors = validateFinancingPlan(plan);
      return errors.length > 0;
    });
  }, [mnaDeal?.financingPlans]);

  // 獲取所有無效的股權注入
  const invalidInjections = useMemo(() => {
    return (mnaDeal?.equityInjections || []).filter(injection => {
      const errors = validateEquityInjection(injection);
      return errors.length > 0;
    });
  }, [mnaDeal?.equityInjections]);

  // 是否有效
  const isValid = useMemo(() => {
    return invalidPlans.length === 0 && invalidInjections.length === 0;
  }, [invalidPlans, invalidInjections]);

  // 錯誤摘要
  const errorSummary = useMemo(() => {
    const errors: string[] = [];
    
    if (invalidPlans.length > 0) {
      errors.push(`${invalidPlans.length} 個融資計劃未完整`);
    }
    
    if (invalidInjections.length > 0) {
      errors.push(`${invalidInjections.length} 個股權注入未完整`);
    }
    
    return errors;
  }, [invalidPlans, invalidInjections]);

  return {
    isValid,
    invalidPlans,
    invalidInjections,
    errorSummary
  };
}