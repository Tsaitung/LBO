/**
 * ScenarioEngine - 統一情境計算引擎
 * Linus 原則：消除特殊案例，統一處理流程
 */

import { ScenarioAssumptions, BusinessMetricsBeforeAcquisition } from '../../types/financial';

// 統一的情境類型
export type ScenarioType = 'base' | 'upside' | 'downside';

// 情境結果
export interface ScenarioResult {
  scenario: ScenarioType;
  metrics: {
    entryEV: number;
    exitEV: number;
    ebitdaMargin: number;
    netMargin: number;
    irr: number;
    moic: number;
  };
  assumptions: ScenarioAssumptions;
}

// 情境配置
export interface ScenarioConfig {
  entryEvEbitdaMultiple: number;
  exitEvEbitdaMultiple: number;
  cogsAsPercentageOfRevenue: number;
  operatingExpensesAsPercentageOfRevenue: number;
  netMargin: number;
}

/**
 * 統一的情境計算引擎
 * 無特殊案例，所有情境使用相同的計算流程
 */
export class ScenarioEngine {
  /**
   * 正規化情境類型（消除 upper/lower 別名）
   */
  static normalizeScenarioType(type: string): ScenarioType {
    const typeMap: Record<string, ScenarioType> = {
      'base': 'base',
      'upper': 'upside',
      'upside': 'upside',
      'lower': 'downside',
      'downside': 'downside',
    };
    return typeMap[type.toLowerCase()] || 'base';
  }

  /**
   * 計算 EBITDA Margin
   * 純函數，無副作用
   */
  static calculateEbitdaMargin(config: Partial<ScenarioConfig>): number {
    const cogs = config.cogsAsPercentageOfRevenue || 0;
    const opex = config.operatingExpensesAsPercentageOfRevenue || 0;
    return Math.max(0, 100 - cogs - opex);
  }

  /**
   * 驗證情境配置
   * 資料驅動的驗證規則
   */
  static validateConfig(config: ScenarioConfig): string[] {
    const errors: string[] = [];
    
    const rules = [
      { field: 'entryEvEbitdaMultiple', min: 0, max: 50, label: '入場倍數' },
      { field: 'exitEvEbitdaMultiple', min: 0, max: 50, label: '出場倍數' },
      { field: 'cogsAsPercentageOfRevenue', min: 0, max: 100, label: 'COGS比例' },
      { field: 'operatingExpensesAsPercentageOfRevenue', min: 0, max: 100, label: '營運費用比例' },
      { field: 'netMargin', min: -100, max: 100, label: '淨利率' },
    ];

    // 統一驗證邏輯，無特殊處理
    rules.forEach(rule => {
      const value = config[rule.field as keyof ScenarioConfig];
      if (value < rule.min || value > rule.max) {
        errors.push(`${rule.label}必須在 ${rule.min} 到 ${rule.max} 之間`);
      }
    });

    // COGS + OPEX 不能超過 100%
    const totalCost = config.cogsAsPercentageOfRevenue + config.operatingExpensesAsPercentageOfRevenue;
    if (totalCost > 100) {
      errors.push('COGS + 營運費用不能超過 100%');
    }

    return errors;
  }

  /**
   * 執行情境計算
   * 統一計算流程，無條件分支
   */
  static runScenario(
    baseMetrics: BusinessMetricsBeforeAcquisition,
    config: ScenarioConfig,
    scenarioType: ScenarioType
  ): ScenarioResult {
    // 計算衍生指標
    const ebitdaMargin = this.calculateEbitdaMargin(config);
    const ebitda = baseMetrics.revenue * (ebitdaMargin / 100);
    
    // 計算企業價值
    const entryEV = ebitda * config.entryEvEbitdaMultiple;
    const exitEV = ebitda * config.exitEvEbitdaMultiple;
    
    // 簡化的 IRR/MOIC 計算（實際應該更複雜）
    const moic = exitEV / entryEV;
    const years = 5; // 假設 5 年投資期
    const irr = (Math.pow(moic, 1 / years) - 1) * 100;

    return {
      scenario: scenarioType,
      metrics: {
        entryEV,
        exitEV,
        ebitdaMargin,
        netMargin: config.netMargin,
        irr,
        moic,
      },
      assumptions: {
        entryEvEbitdaMultiple: config.entryEvEbitdaMultiple,
        exitEvEbitdaMultiple: config.exitEvEbitdaMultiple,
        netMargin: config.netMargin,
        // 補充必要的預設值
        seniorDebtEbitda: 0,
        mezzDebtEbitda: 0,
        cogsAsPercentageOfRevenue: config.cogsAsPercentageOfRevenue,
        operatingExpensesAsPercentageOfRevenue: config.operatingExpensesAsPercentageOfRevenue,
        revenueGrowthRate: 0,
        ebitdaMargin: ebitdaMargin,
        capExPctSales: 0,
        nwcPctSales: 0,
        corporateTaxRate: 20,
      },
    };
  }

  /**
   * 批量執行敏感度分析
   * 無特殊案例，統一處理
   */
  static async runSensitivity(
    baseMetrics: BusinessMetricsBeforeAcquisition,
    baseConfig: ScenarioConfig,
    variable: keyof ScenarioConfig,
    range: number[]
  ): Promise<ScenarioResult[]> {
    return Promise.all(
      range.map(value => {
        const config = { ...baseConfig, [variable]: value };
        return this.runScenario(baseMetrics, config, 'base');
      })
    );
  }

  /**
   * 比較多個情境
   * 統一的比較邏輯
   */
  static compareScenarios(scenarios: ScenarioResult[]): {
    best: ScenarioResult;
    worst: ScenarioResult;
    median: ScenarioResult;
  } {
    // 按 IRR 排序
    const sorted = [...scenarios].sort((a, b) => b.metrics.irr - a.metrics.irr);
    
    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
    };
  }
}