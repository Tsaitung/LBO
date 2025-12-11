/**
 * 情境分析 Slice
 * 管理基準/樂觀/悲觀情境、敏感性分析
 * 遵循 Linus 原則：數據結構清晰，邏輯簡單
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ScenarioAssumptions, FutureAssumptions } from '../../types/financial';
import {
  VALUATION_DEFAULTS,
  GROWTH_DEFAULTS,
  COST_STRUCTURE_DEFAULTS,
  CAPEX_DEFAULTS,
  WORKING_CAPITAL_DEFAULTS,
  TAX_DISCOUNT_DEFAULTS,
  DEBT_DEFAULTS,
  SCENARIO_ADJUSTMENTS,
} from '../../config/master-defaults';

// 情境類型
export type ScenarioType = 'base' | 'upside' | 'downside';

// 情境狀態
interface ScenariosState {
  current: ScenarioType;
  scenarios: {
    base: ScenarioAssumptions;
    upside: ScenarioAssumptions;
    downside: ScenarioAssumptions;
  };
  sensitivityAnalysis: {
    parameter: string;
    values: number[];
    results: Array<{
      value: number;
      irr: number;
      npm: number;
      payback: number;
    }>;
  };
  comparison: {
    enabled: boolean;
    scenarios: ScenarioType[];
  };
}

/**
 * 創建預設情境（包含所有假設欄位）
 * 使用 master-defaults.ts 作為唯一參數來源 (Single Source of Truth)
 */
function createDefaultScenario(type: ScenarioType): ScenarioAssumptions {
  // Base 情境：直接使用 master-defaults 的值
  const baseValues: ScenarioAssumptions = {
    // ========== 情境特有參數 (from VALUATION_DEFAULTS) ==========
    entryEvEbitdaMultiple: VALUATION_DEFAULTS.entryEvEbitdaMultiple,
    exitEvEbitdaMultiple: VALUATION_DEFAULTS.exitEvEbitdaMultiple,
    seniorDebtEbitda: VALUATION_DEFAULTS.seniorDebtEbitda,
    mezzDebtEbitda: VALUATION_DEFAULTS.mezzDebtEbitda,

    // ========== 增長假設 (from GROWTH_DEFAULTS) ==========
    revenueGrowthRate: GROWTH_DEFAULTS.revenueGrowthRate,
    ebitdaMargin: GROWTH_DEFAULTS.ebitdaMargin,
    netMargin: GROWTH_DEFAULTS.netMargin,

    // ========== 成本結構假設 (from COST_STRUCTURE_DEFAULTS) ==========
    cogsAsPercentageOfRevenue: COST_STRUCTURE_DEFAULTS.cogsAsPercentageOfRevenue,
    operatingExpensesAsPercentageOfRevenue: COST_STRUCTURE_DEFAULTS.operatingExpensesAsPercentageOfRevenue,

    // ========== 資本支出假設 (from CAPEX_DEFAULTS) ==========
    capexAsPercentageOfRevenue: CAPEX_DEFAULTS.capexAsPercentageOfRevenue,
    capexGrowthRate: CAPEX_DEFAULTS.capexGrowthRate,

    // ========== 營運資本假設 (from WORKING_CAPITAL_DEFAULTS) ==========
    accountsReceivableDays: WORKING_CAPITAL_DEFAULTS.accountsReceivableDays,
    inventoryDays: WORKING_CAPITAL_DEFAULTS.inventoryDays,
    accountsPayableDays: WORKING_CAPITAL_DEFAULTS.accountsPayableDays,

    // ========== 其他財務假設 (from TAX_DISCOUNT_DEFAULTS) ==========
    taxRate: TAX_DISCOUNT_DEFAULTS.taxRate,
    discountRate: TAX_DISCOUNT_DEFAULTS.discountRate,

    // ========== 計算參數設定 (from CAPEX_DEFAULTS + DEBT_DEFAULTS) ==========
    depreciationToCapexRatio: CAPEX_DEFAULTS.depreciationToCapexRatio,
    fixedAssetsToCapexMultiple: CAPEX_DEFAULTS.fixedAssetsToCapexMultiple,
    revolvingCreditRepaymentRate: DEBT_DEFAULTS.revolvingCreditRepaymentRate,

    // ========== 向後兼容欄位 ==========
    capExPctSales: CAPEX_DEFAULTS.capexAsPercentageOfRevenue,
    nwcPctSales: 15, // 營運資本佔營收比例（導出值）
    corporateTaxRate: TAX_DISCOUNT_DEFAULTS.taxRate,
  };

  // 根據情境類型應用調整 (from SCENARIO_ADJUSTMENTS)
  switch (type) {
    case 'upside': {
      const adj = SCENARIO_ADJUSTMENTS.upside;
      const upsideCapex = CAPEX_DEFAULTS.capexAsPercentageOfRevenue - 0.5; // 樂觀情境資本支出較低
      return {
        ...baseValues,
        // 情境參數調整
        exitEvEbitdaMultiple: VALUATION_DEFAULTS.exitEvEbitdaMultiple + adj.exitEvEbitdaMultiple,
        // 增長假設（樂觀）
        revenueGrowthRate: GROWTH_DEFAULTS.revenueGrowthRate + adj.revenueGrowthRate,
        ebitdaMargin: GROWTH_DEFAULTS.ebitdaMargin + adj.ebitdaMargin,
        netMargin: GROWTH_DEFAULTS.netMargin + 2, // 淨利率同步上調
        // 成本結構（較低）
        cogsAsPercentageOfRevenue: COST_STRUCTURE_DEFAULTS.cogsAsPercentageOfRevenue + adj.cogsAdjustment,
        operatingExpensesAsPercentageOfRevenue: COST_STRUCTURE_DEFAULTS.operatingExpensesAsPercentageOfRevenue + adj.opexAdjustment,
        // 資本支出（較低）
        capexAsPercentageOfRevenue: upsideCapex,
        capExPctSales: upsideCapex,
        // 營運資本（更有效率）
        accountsReceivableDays: WORKING_CAPITAL_DEFAULTS.accountsReceivableDays - 5,
        inventoryDays: WORKING_CAPITAL_DEFAULTS.inventoryDays - 5,
        accountsPayableDays: WORKING_CAPITAL_DEFAULTS.accountsPayableDays + 3,
        nwcPctSales: 14,
      };
    }
    case 'downside': {
      const adj = SCENARIO_ADJUSTMENTS.downside;
      const downsideCapex = CAPEX_DEFAULTS.capexAsPercentageOfRevenue + 0.5; // 保守情境資本支出較高
      return {
        ...baseValues,
        // 情境參數調整
        exitEvEbitdaMultiple: VALUATION_DEFAULTS.exitEvEbitdaMultiple + adj.exitEvEbitdaMultiple,
        // 增長假設（保守）
        revenueGrowthRate: GROWTH_DEFAULTS.revenueGrowthRate + adj.revenueGrowthRate,
        ebitdaMargin: GROWTH_DEFAULTS.ebitdaMargin + adj.ebitdaMargin,
        netMargin: GROWTH_DEFAULTS.netMargin - 2, // 淨利率同步下調
        // 成本結構（較高）
        cogsAsPercentageOfRevenue: COST_STRUCTURE_DEFAULTS.cogsAsPercentageOfRevenue + adj.cogsAdjustment,
        operatingExpensesAsPercentageOfRevenue: COST_STRUCTURE_DEFAULTS.operatingExpensesAsPercentageOfRevenue + adj.opexAdjustment,
        // 資本支出（較高）
        capexAsPercentageOfRevenue: downsideCapex,
        capExPctSales: downsideCapex,
        // 營運資本（較差）
        accountsReceivableDays: WORKING_CAPITAL_DEFAULTS.accountsReceivableDays + 5,
        inventoryDays: WORKING_CAPITAL_DEFAULTS.inventoryDays + 5,
        accountsPayableDays: WORKING_CAPITAL_DEFAULTS.accountsPayableDays - 3,
        nwcPctSales: 16,
      };
    }
    default:
      return baseValues;
  }
}

// 初始狀態
const initialState: ScenariosState = {
  current: 'base',
  scenarios: {
    base: createDefaultScenario('base'),
    upside: createDefaultScenario('upside'),
    downside: createDefaultScenario('downside'),
  },
  sensitivityAnalysis: {
    parameter: 'exitEvEbitdaMultiple',
    values: [],
    results: [],
  },
  comparison: {
    enabled: false,
    scenarios: ['base'],
  },
};

// 兼容舊版持久化形狀，確保 state.scenarios 容器存在
function ensureScenarioContainer(state: ScenariosState & Partial<Record<'base' | 'upside' | 'downside' | 'upper' | 'lower', ScenarioAssumptions>>) {
  if (!state.scenarios) {
    const base = state.base || createDefaultScenario('base');
    const upside = state.upside || state.upper || createDefaultScenario('upside');
    const downside = state.downside || state.lower || createDefaultScenario('downside');
    state.scenarios = { base, upside, downside };
  }
}

/**
 * 情境分析 Slice
 */
const scenariosSlice = createSlice({
  name: 'scenarios',
  initialState,
  reducers: {
    // 切換當前情境
    setCurrentScenario: (state, action: PayloadAction<ScenarioType>) => {
      ensureScenarioContainer(state);
      state.current = action.payload;
    },
    
    // 更新情境參數
    updateScenario: (
      state,
      action: PayloadAction<{
        scenario: ScenarioType;
        updates: Partial<ScenarioAssumptions>;
      }>
    ) => {
      ensureScenarioContainer(state as ScenariosState & Partial<Record<'base' | 'upside' | 'downside' | 'upper' | 'lower', ScenarioAssumptions>>);
      const { scenario, updates } = action.payload;
      state.scenarios[scenario] = {
        ...state.scenarios[scenario],
        ...updates,
      };
    },
    
    // 批量更新情境
    setScenario: (
      state,
      action: PayloadAction<{
        scenario: ScenarioType;
        data: ScenarioAssumptions;
      }>
    ) => {
      ensureScenarioContainer(state as ScenariosState & Partial<Record<'base' | 'upside' | 'downside' | 'upper' | 'lower', ScenarioAssumptions>>);
      const { scenario, data } = action.payload;
      state.scenarios[scenario] = data;
    },
    
    // 複製情境
    copyScenario: (
      state,
      action: PayloadAction<{
        from: ScenarioType;
        to: ScenarioType;
      }>
    ) => {
      ensureScenarioContainer(state as ScenariosState & Partial<Record<'base' | 'upside' | 'downside' | 'upper' | 'lower', ScenarioAssumptions>>);
      const { from, to } = action.payload;
      state.scenarios[to] = { ...state.scenarios[from] };
    },
    
    // 重置情境為預設值
    resetScenario: (state, action: PayloadAction<ScenarioType>) => {
      ensureScenarioContainer(state as ScenariosState & Partial<Record<'base' | 'upside' | 'downside' | 'upper' | 'lower', ScenarioAssumptions>>);
      const scenario = action.payload;
      state.scenarios[scenario] = createDefaultScenario(scenario);
    },
    
    // 設定敏感性分析參數
    setSensitivityParameter: (state, action: PayloadAction<string>) => {
      state.sensitivityAnalysis.parameter = action.payload;
      state.sensitivityAnalysis.results = []; // 清空結果
    },
    
    // 設定敏感性分析值範圍
    setSensitivityValues: (state, action: PayloadAction<number[]>) => {
      state.sensitivityAnalysis.values = action.payload;
    },
    
    // 更新敏感性分析結果
    updateSensitivityResults: (
      state,
      action: PayloadAction<Array<{
        value: number;
        irr: number;
        npm: number;
        payback: number;
      }>>
    ) => {
      state.sensitivityAnalysis.results = action.payload;
    },
    
    // 啟用/停用情境比較
    toggleComparison: (state, action: PayloadAction<boolean>) => {
      state.comparison.enabled = action.payload;
    },
    
    // 設定要比較的情境
    setComparisonScenarios: (state, action: PayloadAction<ScenarioType[]>) => {
      state.comparison.scenarios = action.payload;
    },
    
    // 快速調整：增長率提升
    applyGrowthBoost: (state, action: PayloadAction<number>) => {
      const boost = action.payload;
      Object.keys(state.scenarios).forEach(key => {
        const scenario = key as ScenarioType;
        state.scenarios[scenario].revenueGrowthRate += boost;
      });
    },
    
    // 快速調整：利潤率調整
    applyMarginAdjustment: (state, action: PayloadAction<number>) => {
      const adjustment = action.payload;
      Object.keys(state.scenarios).forEach(key => {
        const scenario = key as ScenarioType;
        state.scenarios[scenario].ebitdaMargin += adjustment;
        state.scenarios[scenario].netMargin += adjustment * 0.5; // 淨利率同步調整
      });
    },
    
    // 快速調整：退出倍數調整
    applyExitMultipleAdjustment: (state, action: PayloadAction<number>) => {
      const adjustment = action.payload;
      Object.keys(state.scenarios).forEach(key => {
        const scenario = key as ScenarioType;
        state.scenarios[scenario].exitEvEbitdaMultiple += adjustment;
      });
    },
    
    // 重置所有情境
    resetAllScenarios: (state) => {
      ensureScenarioContainer(state as ScenariosState & Partial<Record<'base' | 'upside' | 'downside' | 'upper' | 'lower', ScenarioAssumptions>>);
      state.scenarios.base = createDefaultScenario('base');
      state.scenarios.upside = createDefaultScenario('upside');
      state.scenarios.downside = createDefaultScenario('downside');
      state.current = 'base';
    },
    
    // 重置整個狀態
    resetScenariosState: () => initialState,

    // ========== 分類更新 Actions（用於 Tab UI） ==========

    // 更新增長假設
    updateGrowthAssumptions: (
      state,
      action: PayloadAction<{
        scenario: ScenarioType;
        updates: Partial<Pick<ScenarioAssumptions,
          'revenueGrowthRate' | 'ebitdaMargin' | 'netMargin'>>;
      }>
    ) => {
      ensureScenarioContainer(state as ScenariosState & Partial<Record<'base' | 'upside' | 'downside' | 'upper' | 'lower', ScenarioAssumptions>>);
      const { scenario, updates } = action.payload;
      Object.assign(state.scenarios[scenario], updates);
    },

    // 更新成本結構假設
    updateCostStructure: (
      state,
      action: PayloadAction<{
        scenario: ScenarioType;
        updates: Partial<Pick<ScenarioAssumptions,
          'cogsAsPercentageOfRevenue' | 'operatingExpensesAsPercentageOfRevenue'>>;
      }>
    ) => {
      ensureScenarioContainer(state as ScenariosState & Partial<Record<'base' | 'upside' | 'downside' | 'upper' | 'lower', ScenarioAssumptions>>);
      const { scenario, updates } = action.payload;
      Object.assign(state.scenarios[scenario], updates);
    },

    // 更新資本支出假設
    updateCapexAssumptions: (
      state,
      action: PayloadAction<{
        scenario: ScenarioType;
        updates: Partial<Pick<ScenarioAssumptions,
          'capexAsPercentageOfRevenue' | 'capexGrowthRate'>>;
      }>
    ) => {
      ensureScenarioContainer(state as ScenariosState & Partial<Record<'base' | 'upside' | 'downside' | 'upper' | 'lower', ScenarioAssumptions>>);
      const { scenario, updates } = action.payload;
      Object.assign(state.scenarios[scenario], updates);
      // 同步向後兼容欄位
      if (updates.capexAsPercentageOfRevenue !== undefined) {
        state.scenarios[scenario].capExPctSales = updates.capexAsPercentageOfRevenue;
      }
    },

    // 更新營運資本假設
    updateWorkingCapitalAssumptions: (
      state,
      action: PayloadAction<{
        scenario: ScenarioType;
        updates: Partial<Pick<ScenarioAssumptions,
          'accountsReceivableDays' | 'inventoryDays' | 'accountsPayableDays'>>;
      }>
    ) => {
      ensureScenarioContainer(state as ScenariosState & Partial<Record<'base' | 'upside' | 'downside' | 'upper' | 'lower', ScenarioAssumptions>>);
      const { scenario, updates } = action.payload;
      Object.assign(state.scenarios[scenario], updates);
    },

    // 更新其他財務假設
    updateOtherAssumptions: (
      state,
      action: PayloadAction<{
        scenario: ScenarioType;
        updates: Partial<Pick<ScenarioAssumptions,
          'taxRate' | 'discountRate'>>;
      }>
    ) => {
      ensureScenarioContainer(state as ScenariosState & Partial<Record<'base' | 'upside' | 'downside' | 'upper' | 'lower', ScenarioAssumptions>>);
      const { scenario, updates } = action.payload;
      Object.assign(state.scenarios[scenario], updates);
      // 同步向後兼容欄位
      if (updates.taxRate !== undefined) {
        state.scenarios[scenario].corporateTaxRate = updates.taxRate;
      }
    },

    // 更新計算參數
    updateCalculationParameters: (
      state,
      action: PayloadAction<{
        scenario: ScenarioType;
        updates: Partial<Pick<ScenarioAssumptions,
          'depreciationToCapexRatio' | 'fixedAssetsToCapexMultiple' | 'revolvingCreditRepaymentRate'>>;
      }>
    ) => {
      ensureScenarioContainer(state as ScenariosState & Partial<Record<'base' | 'upside' | 'downside' | 'upper' | 'lower', ScenarioAssumptions>>);
      const { scenario, updates } = action.payload;
      Object.assign(state.scenarios[scenario], updates);
    },

    // 批量更新所有情境的計算參數（共用參數）
    updateAllCalculationParameters: (
      state,
      action: PayloadAction<Partial<Pick<ScenarioAssumptions,
        'depreciationToCapexRatio' | 'fixedAssetsToCapexMultiple' | 'revolvingCreditRepaymentRate'>>>
    ) => {
      ensureScenarioContainer(state as ScenariosState & Partial<Record<'base' | 'upside' | 'downside' | 'upper' | 'lower', ScenarioAssumptions>>);
      const updates = action.payload;
      (['base', 'upside', 'downside'] as ScenarioType[]).forEach(scenario => {
        Object.assign(state.scenarios[scenario], updates);
      });
    },
  },
});

// 導出 actions
export const {
  setCurrentScenario,
  updateScenario,
  setScenario,
  copyScenario,
  resetScenario,
  setSensitivityParameter,
  setSensitivityValues,
  updateSensitivityResults,
  toggleComparison,
  setComparisonScenarios,
  applyGrowthBoost,
  applyMarginAdjustment,
  applyExitMultipleAdjustment,
  resetAllScenarios,
  resetScenariosState,
  // 分類更新 actions
  updateGrowthAssumptions,
  updateCostStructure,
  updateCapexAssumptions,
  updateWorkingCapitalAssumptions,
  updateOtherAssumptions,
  updateCalculationParameters,
  updateAllCalculationParameters,
} = scenariosSlice.actions;

// 導出 reducer
export default scenariosSlice.reducer;

// Selectors
export const selectCurrentScenario = (state: { scenarios: ScenariosState }) =>
  state.scenarios.current;

export const selectScenarios = (state: { scenarios: ScenariosState }) =>
  state.scenarios.scenarios;

export const selectActiveScenario = (state: { scenarios: ScenariosState }) =>
  state.scenarios.scenarios[state.scenarios.current];

export const selectScenarioByType = (type: ScenarioType) => 
  (state: { scenarios: ScenariosState }) =>
    state.scenarios.scenarios[type];

export const selectSensitivityAnalysis = (state: { scenarios: ScenariosState }) =>
  state.scenarios.sensitivityAnalysis;

export const selectComparison = (state: { scenarios: ScenariosState }) =>
  state.scenarios.comparison;

// 計算情境差異
export const selectScenarioDifferences = (state: { scenarios: ScenariosState }) => {
  const base = state.scenarios.scenarios.base;
  const upside = state.scenarios.scenarios.upside;
  const downside = state.scenarios.scenarios.downside;

  return {
    upside: {
      revenueGrowth: upside.revenueGrowthRate - base.revenueGrowthRate,
      ebitdaMargin: upside.ebitdaMargin - base.ebitdaMargin,
      exitMultiple: upside.exitEvEbitdaMultiple - base.exitEvEbitdaMultiple,
    },
    downside: {
      revenueGrowth: downside.revenueGrowthRate - base.revenueGrowthRate,
      ebitdaMargin: downside.ebitdaMargin - base.ebitdaMargin,
      exitMultiple: downside.exitEvEbitdaMultiple - base.exitEvEbitdaMultiple,
    },
  };
};

/**
 * 將當前情境的 ScenarioAssumptions 轉換為 FutureAssumptions 格式
 * 用於計算層兼容（計算函數仍使用 FutureAssumptions 簽名）
 */
export const selectActiveAssumptionsAsFutureAssumptions = (
  state: { scenarios: ScenariosState }
): FutureAssumptions => {
  const scenario = state.scenarios.scenarios[state.scenarios.current];
  return {
    // 增長假設
    revenueGrowthRate: scenario.revenueGrowthRate,
    ebitdaMargin: scenario.ebitdaMargin,
    netMargin: scenario.netMargin,
    // 成本結構
    cogsAsPercentageOfRevenue: scenario.cogsAsPercentageOfRevenue,
    operatingExpensesAsPercentageOfRevenue: scenario.operatingExpensesAsPercentageOfRevenue,
    // 資本支出
    capexAsPercentageOfRevenue: scenario.capexAsPercentageOfRevenue,
    capexGrowthRate: scenario.capexGrowthRate,
    // 營運資本
    accountsReceivableDays: scenario.accountsReceivableDays,
    inventoryDays: scenario.inventoryDays,
    accountsPayableDays: scenario.accountsPayableDays,
    // 其他
    taxRate: scenario.taxRate,
    discountRate: scenario.discountRate,
    // 計算參數
    depreciationToCapexRatio: scenario.depreciationToCapexRatio,
    fixedAssetsToCapexMultiple: scenario.fixedAssetsToCapexMultiple,
    revolvingCreditRepaymentRate: scenario.revolvingCreditRepaymentRate,
  };
};
