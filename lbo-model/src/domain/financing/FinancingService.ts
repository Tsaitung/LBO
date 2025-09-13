/**
 * 融資業務邏輯服務
 * 集中處理所有融資相關的業務邏輯
 * Linus 原則：單一職責，清晰邊界
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  FinancingPlan, 
  EquityInjection, 
  FacilityType, 
  EquityType,
  MnaDealDesign 
} from '../../types/financial';
import { getLoanDefaults } from './loanConfig';

/**
 * 創建新的融資計劃
 * 統一創建邏輯，避免散布在組件中
 */
export function createFinancingPlan(facilityType: FacilityType): FinancingPlan {
  const defaults = getLoanDefaults(facilityType);
  
  return {
    id: uuidv4(),
    name: `${facilityType.toUpperCase()} 融資`,
    type: facilityType,
    facilityType,
    amount: 0,
    entryTiming: 0,
    entryTimingType: 'beginning',
    repaymentFrequency: 'annual',
    ...defaults
  } as FinancingPlan;
}

/**
 * 創建新的股權注入
 */
export function createEquityInjection(equityType: EquityType): EquityInjection {
  return {
    id: uuidv4(),
    name: `${equityType === 'preferred' ? '優先股' : '普通股'}注入`,
    type: equityType,
    amount: 0,
    entryTiming: 0,
    entryTimingType: 'beginning',
    ownershipPercentage: 0,
    dividendRate: equityType === 'preferred' ? 8 : undefined,
    specialTerms: equityType === 'preferred' ? {
      dividendDistributionEnabled: true,
      participateInCommonDividend: false,
      votingRights: 'none',
      conversionRights: false,
      liquidationPreference: 1
    } : undefined
  };
}

/**
 * 更新融資計劃列表中的項目
 * 純函數，返回新的列表
 */
export function updateFinancingPlanInList(
  plans: FinancingPlan[],
  id: string,
  updates: Partial<FinancingPlan>
): FinancingPlan[] {
  return plans.map(plan =>
    plan.id === id ? { ...plan, ...updates } : plan
  );
}

/**
 * 更新股權注入列表中的項目
 */
export function updateEquityInjectionInList(
  injections: EquityInjection[],
  id: string,
  updates: Partial<EquityInjection>
): EquityInjection[] {
  return injections.map(injection =>
    injection.id === id ? { ...injection, ...updates } : injection
  );
}

/**
 * 計算總債務金額
 */
export function calculateTotalDebt(plans: FinancingPlan[]): number {
  return plans.reduce((sum, plan) => sum + (plan.amount || 0), 0);
}

/**
 * 計算總股權金額
 */
export function calculateTotalEquity(injections: EquityInjection[]): number {
  return injections.reduce((sum, injection) => sum + (injection.amount || 0), 0);
}

/**
 * 驗證融資計劃完整性
 */
export function validateFinancingPlan(plan: FinancingPlan): string[] {
  const errors: string[] = [];
  
  if (!plan.amount || plan.amount <= 0) {
    errors.push('金額必須大於0');
  }
  
  if (plan.interestRate === undefined || plan.interestRate < 0) {
    errors.push('利率必須設定且不能為負');
  }
  
  if (!plan.repaymentMethod) {
    errors.push('必須選擇還款方式');
  }
  
  if (plan.repaymentMethod !== 'revolving' && (!plan.maturity || plan.maturity < 1)) {
    errors.push('非循環信貸必須設定年期');
  }
  
  return errors;
}

/**
 * 驗證股權注入
 */
export function validateEquityInjection(injection: EquityInjection): string[] {
  const errors: string[] = [];
  
  if (!injection.amount || injection.amount <= 0) {
    errors.push('金額必須大於0');
  }
  
  if (injection.ownershipPercentage < 0 || injection.ownershipPercentage > 100) {
    errors.push('股權比例必須在0-100之間');
  }
  
  if (injection.type === 'preferred' && !injection.dividendRate) {
    errors.push('優先股必須設定股息率');
  }
  
  return errors;
}

/**
 * 驗證整個融資結構
 */
export function validateFinancingStructure(dealDesign: MnaDealDesign): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // 驗證每個融資計劃
  dealDesign.financingPlans?.forEach((plan, index) => {
    const planErrors = validateFinancingPlan(plan);
    planErrors.forEach(error => {
      errors.push(`融資計劃 ${index + 1}: ${error}`);
    });
  });
  
  // 驗證每個股權注入
  dealDesign.equityInjections?.forEach((injection, index) => {
    const injectionErrors = validateEquityInjection(injection);
    injectionErrors.forEach(error => {
      errors.push(`股權注入 ${index + 1}: ${error}`);
    });
  });
  
  // 驗證總體結構
  const totalDebt = calculateTotalDebt(dealDesign.financingPlans || []);
  const totalEquity = calculateTotalEquity(dealDesign.equityInjections || []);
  
  if (totalDebt + totalEquity === 0) {
    errors.push('必須至少有一個融資來源');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 排序融資計劃（按進入時間和類型）
 */
export function sortFinancingPlans(plans: FinancingPlan[]): FinancingPlan[] {
  return [...plans].sort((a, b) => {
    // 先按進入時間排序
    if (a.entryTiming !== b.entryTiming) {
      return (a.entryTiming || 0) - (b.entryTiming || 0);
    }
    
    // 同一時間，按類型優先級排序
    const priority: Record<string, number> = {
      senior: 1,
      termLoanA: 2,
      termLoanB: 3,
      mezzanine: 4,
      revolver: 5
    };
    
    return (priority[a.facilityType || a.type] || 6) - 
           (priority[b.facilityType || b.type] || 6);
  });
}