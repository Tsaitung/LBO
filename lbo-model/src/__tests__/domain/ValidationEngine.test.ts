/**
 * ValidationEngine 測試
 * Linus 原則：測試行為，不是實現
 */

import { ValidationEngine, ValidationRule } from '../../domain/validation/ValidationEngine';
import { CommonValidators } from '../../domain/validation/validators/CommonValidators';
import { FinancialValidators } from '../../domain/validation/validators/FinancialValidators';

describe('ValidationEngine', () => {
  let engine: ValidationEngine;

  beforeEach(() => {
    engine = new ValidationEngine();
  });

  describe('基本驗證', () => {
    it('應該註冊並執行驗證規則', () => {
      const rules: ValidationRule[] = [
        {
          field: 'amount',
          validator: CommonValidators.positive,
          message: '金額必須為正數',
        },
      ];

      engine.register('test', rules);
      
      const result = engine.validate('test', { amount: 100 });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('應該捕捉驗證錯誤', () => {
      const rules: ValidationRule[] = [
        {
          field: 'amount',
          validator: CommonValidators.positive,
          message: '金額必須為正數',
        },
      ];

      engine.register('test', rules);
      
      const result = engine.validate('test', { amount: -100 });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('金額必須為正數');
    });

    it('應該區分錯誤和警告', () => {
      const rules: ValidationRule[] = [
        {
          field: 'amount',
          validator: CommonValidators.positive,
          message: '金額必須為正數',
          severity: 'error',
        },
        {
          field: 'ratio',
          validator: (value) => value <= 0.8,
          message: '比率偏高',
          severity: 'warning',
        },
      ];

      engine.register('test', rules);
      
      const result = engine.validate('test', { amount: -100, ratio: 0.9 });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('巢狀路徑', () => {
    it('應該支援巢狀欄位驗證', () => {
      const rules: ValidationRule[] = [
        {
          field: 'user.age',
          validator: CommonValidators.min(18),
          message: '年齡必須大於 18',
        },
      ];

      engine.register('test', rules);
      
      const result = engine.validate('test', {
        user: { age: 20 }
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('批量驗證', () => {
    it('應該執行批量驗證', () => {
      engine.register('domain1', [
        {
          field: 'value',
          validator: CommonValidators.positive,
          message: '必須為正數',
        },
      ]);

      engine.register('domain2', [
        {
          field: 'text',
          validator: CommonValidators.required,
          message: '必填欄位',
        },
      ]);

      const results = engine.validateBatch([
        { domain: 'domain1', data: { value: 100 } },
        { domain: 'domain2', data: { text: 'test' } },
      ]);

      expect(results.get('domain1')?.valid).toBe(true);
      expect(results.get('domain2')?.valid).toBe(true);
    });
  });

  describe('財務驗證', () => {
    it('應該驗證資產負債表平衡', () => {
      const rules: ValidationRule[] = [
        {
          field: 'balanceSheet',
          validator: (data) => FinancialValidators.balanceSheet(data),
          message: '資產負債表不平衡',
        },
      ];

      engine.register('financial', rules);
      
      const validData = {
        balanceSheet: {
          totalAssets: 1000,
          totalLiabilities: 600,
          shareholdersEquity: 400,
        },
      };

      const result = engine.validate('financial', validData);
      expect(result.valid).toBe(true);
    });

    it('應該驗證債務覆蓋率', () => {
      const rules: ValidationRule[] = [
        {
          field: 'debtService',
          validator: (data) => FinancialValidators.debtServiceCoverage(data),
          message: '債務覆蓋率不足',
        },
      ];

      engine.register('financial', rules);
      
      const validData = {
        debtService: {
          ebitda: 1000,
          interestExpense: 300,
          principalPayment: 200,
        },
      };

      const result = engine.validate('financial', validData);
      expect(result.valid).toBe(true); // DSCR = 1000/500 = 2.0 > 1.2
    });
  });

  describe('組合驗證器', () => {
    it('應該支援 AND 組合', () => {
      const rules: ValidationRule[] = [
        {
          field: 'value',
          validator: CommonValidators.and(
            CommonValidators.positive,
            CommonValidators.max(100)
          ),
          message: '值必須在 0 到 100 之間',
        },
      ];

      engine.register('test', rules);
      
      expect(engine.validate('test', { value: 50 }).valid).toBe(true);
      expect(engine.validate('test', { value: 150 }).valid).toBe(false);
      expect(engine.validate('test', { value: -10 }).valid).toBe(false);
    });

    it('應該支援 OR 組合', () => {
      const rules: ValidationRule[] = [
        {
          field: 'value',
          validator: CommonValidators.or(
            (v) => v === 0,
            CommonValidators.positive
          ),
          message: '值必須為 0 或正數',
        },
      ];

      engine.register('test', rules);
      
      expect(engine.validate('test', { value: 0 }).valid).toBe(true);
      expect(engine.validate('test', { value: 10 }).valid).toBe(true);
      expect(engine.validate('test', { value: -10 }).valid).toBe(false);
    });
  });

  describe('上下文驗證', () => {
    it('應該支援使用上下文的驗證', () => {
      const rules: ValidationRule[] = [
        {
          field: 'endDate',
          validator: (value, context) => {
            const startDate = context?.startDate;
            return !startDate || value > startDate;
          },
          message: '結束日期必須晚於開始日期',
        },
      ];

      engine.register('test', rules);
      
      const context = { startDate: new Date('2024-01-01') };
      const validData = { endDate: new Date('2024-12-31') };
      const invalidData = { endDate: new Date('2023-12-31') };
      
      expect(engine.validate('test', validData, context).valid).toBe(true);
      expect(engine.validate('test', invalidData, context).valid).toBe(false);
    });
  });

  describe('結果合併', () => {
    it('應該正確合併多個驗證結果', () => {
      const result1 = {
        valid: false,
        errors: [
          { field: 'field1', message: 'Error 1', severity: 'error' as const },
        ],
        warnings: [
          { field: 'field2', message: 'Warning 1', severity: 'warning' as const },
        ],
      };

      const result2 = {
        valid: false,
        errors: [
          { field: 'field3', message: 'Error 2', severity: 'error' as const },
        ],
        warnings: [],
      };

      const merged = ValidationEngine.mergeResults(result1, result2);
      
      expect(merged.valid).toBe(false);
      expect(merged.errors).toHaveLength(2);
      expect(merged.warnings).toHaveLength(1);
    });
  });
});