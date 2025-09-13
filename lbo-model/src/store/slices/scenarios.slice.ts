/**
 * 情境分析 Slice
 * 管理基準/樂觀/悲觀情境、敏感性分析
 * 遵循 Linus 原則：數據結構清晰，邏輯簡單
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ScenarioAssumptions } from '../../types/financial';

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

// 創建預設情境
function createDefaultScenario(type: ScenarioType): ScenarioAssumptions {
  const baseValues = {
    entryEvEbitdaMultiple: 10,
    exitEvEbitdaMultiple: 12,
    seniorDebtEbitda: 4,
    mezzDebtEbitda: 2,
    cogsAsPercentageOfRevenue: 60,
    operatingExpensesAsPercentageOfRevenue: 15,
    revenueGrowthRate: 5,
    ebitdaMargin: 25,
    netMargin: 10,
    capExPctSales: 4,
    nwcPctSales: 15,
    corporateTaxRate: 20,
  };
  
  // 根據情境類型調整參數
  switch (type) {
    case 'upside':
      return {
        ...baseValues,
        exitEvEbitdaMultiple: 14,
        cogsAsPercentageOfRevenue: 58,
        operatingExpensesAsPercentageOfRevenue: 14,
        revenueGrowthRate: 7,
        ebitdaMargin: 28,
        netMargin: 12,
        capExPctSales: 3.5,
        nwcPctSales: 14,
      };
    case 'downside':
      return {
        ...baseValues,
        exitEvEbitdaMultiple: 10,
        cogsAsPercentageOfRevenue: 62,
        operatingExpensesAsPercentageOfRevenue: 16,
        revenueGrowthRate: 3,
        ebitdaMargin: 22,
        netMargin: 8,
        capExPctSales: 4.5,
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
