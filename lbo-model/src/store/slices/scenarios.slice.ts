/**
 * 情境分析 Slice
 * 管理基準/樂觀/悲觀情境、敏感性分析
 * 遵循 Linus 原則：數據結構清晰，邏輯簡單
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ScenarioAssumptions, FutureAssumptions } from '../../types/financial';

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

// 創建預設情境（包含所有假設欄位）
function createDefaultScenario(type: ScenarioType): ScenarioAssumptions {
  const baseValues: ScenarioAssumptions = {
    // ========== 情境特有參數 ==========
    entryEvEbitdaMultiple: 10,
    exitEvEbitdaMultiple: 12,
    seniorDebtEbitda: 4,
    mezzDebtEbitda: 2,

    // ========== 增長假設 ==========
    revenueGrowthRate: 5,
    ebitdaMargin: 25,
    netMargin: 10,

    // ========== 成本結構假設 ==========
    cogsAsPercentageOfRevenue: 60,
    operatingExpensesAsPercentageOfRevenue: 15,

    // ========== 資本支出假設 ==========
    capexAsPercentageOfRevenue: 4,
    capexGrowthRate: 3,

    // ========== 營運資本假設 ==========
    accountsReceivableDays: 45,
    inventoryDays: 60,
    accountsPayableDays: 35,

    // ========== 其他財務假設 ==========
    taxRate: 20,
    discountRate: 10,

    // ========== 計算參數設定 ==========
    depreciationToCapexRatio: 20,
    fixedAssetsToCapexMultiple: 10,
    revolvingCreditRepaymentRate: 20,

    // ========== 向後兼容欄位 ==========
    capExPctSales: 4,
    nwcPctSales: 15,
    corporateTaxRate: 20,
  };

  // 根據情境類型調整參數
  switch (type) {
    case 'upside':
      return {
        ...baseValues,
        // 情境參數
        exitEvEbitdaMultiple: 14,
        // 增長假設（樂觀）
        revenueGrowthRate: 7,
        ebitdaMargin: 28,
        netMargin: 12,
        // 成本結構（較低）
        cogsAsPercentageOfRevenue: 58,
        operatingExpensesAsPercentageOfRevenue: 14,
        // 資本支出（較低）
        capexAsPercentageOfRevenue: 3.5,
        capExPctSales: 3.5,
        // 營運資本（更有效率）
        accountsReceivableDays: 40,
        inventoryDays: 55,
        accountsPayableDays: 38,
        nwcPctSales: 14,
      };
    case 'downside':
      return {
        ...baseValues,
        // 情境參數
        exitEvEbitdaMultiple: 10,
        // 增長假設（保守）
        revenueGrowthRate: 3,
        ebitdaMargin: 22,
        netMargin: 8,
        // 成本結構（較高）
        cogsAsPercentageOfRevenue: 62,
        operatingExpensesAsPercentageOfRevenue: 16,
        // 資本支出（較高）
        capexAsPercentageOfRevenue: 4.5,
        capExPctSales: 4.5,
        // 營運資本（較差）
        accountsReceivableDays: 50,
        inventoryDays: 65,
        accountsPayableDays: 32,
        nwcPctSales: 16,
      };
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
