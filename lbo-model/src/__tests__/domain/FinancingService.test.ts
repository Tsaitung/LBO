/**
 * 融資服務單元測試
 * 測試關鍵業務邏輯
 */

import {
  createFinancingPlan,
  createEquityInjection,
  updateFinancingPlanInList,
  calculateTotalDebt,
  calculateTotalEquity,
  validateFinancingPlan,
  validateEquityInjection,
  sortFinancingPlans
} from '../../domain/financing/FinancingService';
import { FacilityType, FinancingPlan, EquityInjection } from '../../types/financial';

describe('FinancingService', () => {
  describe('createFinancingPlan', () => {
    it('應該創建具有正確預設值的優先債務', () => {
      const plan = createFinancingPlan('senior');
      
      expect(plan.facilityType).toBe('senior');
      expect(plan.interestRate).toBe(3);
      expect(plan.maturity).toBe(5);
      expect(plan.repaymentMethod).toBe('equalPayment');
      expect(plan.id).toBeDefined();
      expect(plan.name).toContain('SENIOR');
    });

    it('應該創建具有正確預設值的夾層債務', () => {
      const plan = createFinancingPlan('mezzanine');
      
      expect(plan.facilityType).toBe('mezzanine');
      expect(plan.interestRate).toBe(8);
      expect(plan.maturity).toBe(7);
      expect(plan.repaymentMethod).toBe('bullet');
    });

    it('應該創建具有正確預設值的循環信貸', () => {
      const plan = createFinancingPlan('revolver');
      
      expect(plan.facilityType).toBe('revolver');
      expect(plan.interestRate).toBe(4);
      expect(plan.maturity).toBe(5);
      expect(plan.repaymentMethod).toBe('revolving');
    });
  });

  describe('createEquityInjection', () => {
    it('應該創建普通股注入', () => {
      const injection = createEquityInjection('common');
      
      expect(injection.type).toBe('common');
      expect(injection.name).toContain('普通股');
      expect(injection.dividendRate).toBeUndefined();
      expect(injection.specialTerms).toBeUndefined();
    });

    it('應該創建優先股注入並包含特殊條款', () => {
      const injection = createEquityInjection('preferred');
      
      expect(injection.type).toBe('preferred');
      expect(injection.name).toContain('優先股');
      expect(injection.dividendRate).toBe(8);
      expect(injection.specialTerms).toBeDefined();
      expect(injection.specialTerms?.dividendDistributionEnabled).toBe(true);
      expect(injection.specialTerms?.liquidationPreference).toBe(1);
    });
  });

  describe('updateFinancingPlanInList', () => {
    it('應該更新列表中的指定計劃', () => {
      const plans: FinancingPlan[] = [
        { id: '1', name: 'Plan 1', amount: 1000 } as FinancingPlan,
        { id: '2', name: 'Plan 2', amount: 2000 } as FinancingPlan,
      ];

      const updated = updateFinancingPlanInList(plans, '1', { amount: 1500 });
      
      expect(updated[0].amount).toBe(1500);
      expect(updated[0].name).toBe('Plan 1'); // 其他屬性不變
      expect(updated[1].amount).toBe(2000); // 其他項目不受影響
    });

    it('應該返回新的陣列實例（不可變性）', () => {
      const plans: FinancingPlan[] = [
        { id: '1', name: 'Plan 1', amount: 1000 } as FinancingPlan,
      ];

      const updated = updateFinancingPlanInList(plans, '1', { amount: 1500 });
      
      expect(updated).not.toBe(plans); // 新陣列
      expect(updated[0]).not.toBe(plans[0]); // 新物件
    });
  });

  describe('calculateTotalDebt', () => {
    it('應該正確計算總債務', () => {
      const plans: FinancingPlan[] = [
        { amount: 1000 } as FinancingPlan,
        { amount: 2000 } as FinancingPlan,
        { amount: 3000 } as FinancingPlan,
      ];

      const total = calculateTotalDebt(plans);
      expect(total).toBe(6000);
    });

    it('應該處理空陣列', () => {
      const total = calculateTotalDebt([]);
      expect(total).toBe(0);
    });

    it('應該忽略無效金額', () => {
      const plans: FinancingPlan[] = [
        { amount: 1000 } as FinancingPlan,
        { amount: undefined } as FinancingPlan,
        { amount: 0 } as FinancingPlan,
        { amount: 2000 } as FinancingPlan,
      ];

      const total = calculateTotalDebt(plans);
      expect(total).toBe(3000);
    });
  });

  describe('validateFinancingPlan', () => {
    it('應該驗證有效的計劃', () => {
      const plan: FinancingPlan = {
        id: '1',
        name: 'Test',
        amount: 1000,
        interestRate: 5,
        maturity: 5,
        repaymentMethod: 'equalPayment',
        type: 'senior',
      } as FinancingPlan;

      const errors = validateFinancingPlan(plan);
      expect(errors).toHaveLength(0);
    });

    it('應該檢測無效金額', () => {
      const plan: FinancingPlan = {
        amount: 0,
        interestRate: 5,
        maturity: 5,
        repaymentMethod: 'equalPayment',
      } as FinancingPlan;

      const errors = validateFinancingPlan(plan);
      expect(errors).toContain('金額必須大於0');
    });

    it('應該檢測缺少利率', () => {
      const plan: FinancingPlan = {
        amount: 1000,
        interestRate: undefined,
        maturity: 5,
        repaymentMethod: 'equalPayment',
      } as FinancingPlan;

      const errors = validateFinancingPlan(plan);
      expect(errors).toContain('利率必須設定且不能為負');
    });

    it('應該檢測缺少還款方式', () => {
      const plan: FinancingPlan = {
        amount: 1000,
        interestRate: 5,
        maturity: 5,
        repaymentMethod: undefined,
      } as FinancingPlan;

      const errors = validateFinancingPlan(plan);
      expect(errors).toContain('必須選擇還款方式');
    });

    it('循環信貸不需要年期', () => {
      const plan: FinancingPlan = {
        amount: 1000,
        interestRate: 5,
        maturity: undefined,
        repaymentMethod: 'revolving',
      } as FinancingPlan;

      const errors = validateFinancingPlan(plan);
      expect(errors).not.toContain('非循環信貸必須設定年期');
    });
  });

  describe('validateEquityInjection', () => {
    it('應該驗證有效的股權注入', () => {
      const injection: EquityInjection = {
        id: '1',
        name: 'Test',
        type: 'common',
        amount: 1000,
        ownershipPercentage: 25,
        entryTiming: 0,
      };

      const errors = validateEquityInjection(injection);
      expect(errors).toHaveLength(0);
    });

    it('應該檢測無效的股權比例', () => {
      const injection: EquityInjection = {
        amount: 1000,
        ownershipPercentage: 150,
      } as EquityInjection;

      const errors = validateEquityInjection(injection);
      expect(errors).toContain('股權比例必須在0-100之間');
    });

    it('優先股必須有股息率', () => {
      const injection: EquityInjection = {
        type: 'preferred',
        amount: 1000,
        ownershipPercentage: 25,
        dividendRate: undefined,
      } as EquityInjection;

      const errors = validateEquityInjection(injection);
      expect(errors).toContain('優先股必須設定股息率');
    });
  });

  describe('sortFinancingPlans', () => {
    it('應該按進入時間排序', () => {
      const plans: FinancingPlan[] = [
        { id: '1', entryTiming: 2 } as FinancingPlan,
        { id: '2', entryTiming: 0 } as FinancingPlan,
        { id: '3', entryTiming: 1 } as FinancingPlan,
      ];

      const sorted = sortFinancingPlans(plans);
      
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });

    it('同一時間應該按類型優先級排序', () => {
      const plans: FinancingPlan[] = [
        { id: '1', entryTiming: 0, facilityType: 'mezzanine' } as FinancingPlan,
        { id: '2', entryTiming: 0, facilityType: 'senior' } as FinancingPlan,
        { id: '3', entryTiming: 0, facilityType: 'revolver' } as FinancingPlan,
      ];

      const sorted = sortFinancingPlans(plans);
      
      expect(sorted[0].facilityType).toBe('senior');
      expect(sorted[1].facilityType).toBe('mezzanine');
      expect(sorted[2].facilityType).toBe('revolver');
    });

    it('應該返回新的陣列（不可變性）', () => {
      const plans: FinancingPlan[] = [
        { id: '1', entryTiming: 1 } as FinancingPlan,
      ];

      const sorted = sortFinancingPlans(plans);
      
      expect(sorted).not.toBe(plans);
    });
  });
});