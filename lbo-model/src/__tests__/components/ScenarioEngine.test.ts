/**
 * ScenarioEngine 測試
 * Linus 原則：測試行為，不是實現
 */

import { ScenarioEngine, ScenarioType, ScenarioConfig } from '../../components/scenario-manager/ScenarioEngine';

describe('ScenarioEngine', () => {
  const mockBusinessMetrics = {
    revenue: 100000,
    ebitda: 20000,
    netIncome: 10000,
    cogs: 60000,
    operatingExpenses: 20000,
  };

  const mockConfig: ScenarioConfig = {
    entryEvEbitdaMultiple: 8,
    exitEvEbitdaMultiple: 10,
    cogsAsPercentageOfRevenue: 60,
    operatingExpensesAsPercentageOfRevenue: 20,
    netMargin: 10,
  };

  describe('normalizeScenarioType', () => {
    it('應該正確正規化情境類型', () => {
      expect(ScenarioEngine.normalizeScenarioType('base')).toBe('base');
      expect(ScenarioEngine.normalizeScenarioType('upper')).toBe('upside');
      expect(ScenarioEngine.normalizeScenarioType('upside')).toBe('upside');
      expect(ScenarioEngine.normalizeScenarioType('lower')).toBe('downside');
      expect(ScenarioEngine.normalizeScenarioType('downside')).toBe('downside');
      expect(ScenarioEngine.normalizeScenarioType('invalid')).toBe('base');
    });
  });

  describe('calculateEbitdaMargin', () => {
    it('應該正確計算 EBITDA margin', () => {
      const config = {
        cogsAsPercentageOfRevenue: 60,
        operatingExpensesAsPercentageOfRevenue: 25,
      };
      expect(ScenarioEngine.calculateEbitdaMargin(config)).toBe(15);
    });

    it('應該處理空值', () => {
      expect(ScenarioEngine.calculateEbitdaMargin({})).toBe(100);
    });

    it('應該防止負值', () => {
      const config = {
        cogsAsPercentageOfRevenue: 70,
        operatingExpensesAsPercentageOfRevenue: 40,
      };
      expect(ScenarioEngine.calculateEbitdaMargin(config)).toBe(0);
    });
  });

  describe('validateConfig', () => {
    it('應該通過有效配置', () => {
      const errors = ScenarioEngine.validateConfig(mockConfig);
      expect(errors).toHaveLength(0);
    });

    it('應該捕捉無效的倍數', () => {
      const config = { ...mockConfig, entryEvEbitdaMultiple: -1 };
      const errors = ScenarioEngine.validateConfig(config);
      expect(errors).toContain('入場倍數必須在 0 到 50 之間');
    });

    it('應該捕捉超過 100% 的成本', () => {
      const config = {
        ...mockConfig,
        cogsAsPercentageOfRevenue: 60,
        operatingExpensesAsPercentageOfRevenue: 50,
      };
      const errors = ScenarioEngine.validateConfig(config);
      expect(errors).toContain('COGS + 營運費用不能超過 100%');
    });
  });

  describe('runScenario', () => {
    it('應該正確計算情境結果', () => {
      const result = ScenarioEngine.runScenario(
        mockBusinessMetrics,
        mockConfig,
        'base'
      );

      expect(result.scenario).toBe('base');
      expect(result.metrics.ebitdaMargin).toBe(20);
      expect(result.metrics.netMargin).toBe(10);
      expect(result.metrics.entryEV).toBeCloseTo(160000, 0);
      expect(result.metrics.exitEV).toBeCloseTo(200000, 0);
      expect(result.metrics.moic).toBeCloseTo(1.25, 2);
      expect(result.metrics.irr).toBeGreaterThan(0);
    });
  });

  describe('compareScenarios', () => {
    it('應該正確比較情境', () => {
      const scenarios = [
        ScenarioEngine.runScenario(mockBusinessMetrics, mockConfig, 'base'),
        ScenarioEngine.runScenario(
          mockBusinessMetrics,
          { ...mockConfig, exitEvEbitdaMultiple: 12 },
          'upside'
        ),
        ScenarioEngine.runScenario(
          mockBusinessMetrics,
          { ...mockConfig, exitEvEbitdaMultiple: 8 },
          'downside'
        ),
      ];

      const comparison = ScenarioEngine.compareScenarios(scenarios);
      
      expect(comparison.best.scenario).toBe('upside');
      expect(comparison.worst.scenario).toBe('downside');
      expect(comparison.median.scenario).toBe('base');
    });
  });

  describe('runSensitivity', () => {
    it('應該執行敏感度分析', async () => {
      const range = [6, 8, 10];
      const results = await ScenarioEngine.runSensitivity(
        mockBusinessMetrics,
        mockConfig,
        'entryEvEbitdaMultiple',
        range
      );

      expect(results).toHaveLength(3);
      expect(results[0].metrics.entryEV).toBeCloseTo(120000, 0);
      expect(results[1].metrics.entryEV).toBeCloseTo(160000, 0);
      expect(results[2].metrics.entryEV).toBeCloseTo(200000, 0);
    });
  });
});