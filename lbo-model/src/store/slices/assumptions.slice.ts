/**
 * Assumptions Slice
 * 管理未來預期假設參數
 * 從原本的 lboSlice.ts 拆分出來
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FutureAssumptions } from '../../types/financial';

// 初始狀態
const initialState: FutureAssumptions = {
  // 增長假設
  revenueGrowthRate: 5.0, // 營收增長率 (%)
  ebitdaMargin: 14.5, // EBITDA 利潤率 (%)
  netMargin: 6.35, // 淨利率 (%)

  // 成本結構假設（新增）
  cogsAsPercentageOfRevenue: 60, // COGS 占營收比例 (業界標準 60%)
  operatingExpensesAsPercentageOfRevenue: 15, // 營業費用占營收比例 (業界標準 15%)

  // 資本支出假設
  capexAsPercentageOfRevenue: 4.0, // CapEx/營收比例 (%)
  capexGrowthRate: 3.0, // CapEx 增長率 (%)

  // 營運資本假設
  accountsReceivableDays: 45, // 應收帳款天數
  inventoryDays: 60, // 存貨天數
  accountsPayableDays: 35, // 應付帳款天數

  // 其他假設
  taxRate: 20.0, // 稅率 (%)
  discountRate: 10.0, // 折現率 (%)
  
  // 計算參數
  depreciationToCapexRatio: 20.0, // D&A 佔 CapEx 的比例 (%)
  fixedAssetsToCapexMultiple: 10, // 固定資產為 CapEx 的倍數
  revolvingCreditRepaymentRate: 20.0, // 循環信用年償還率 (%)
};

// 驗證函數
const validateAssumptions = (assumptions: Partial<FutureAssumptions>): string[] => {
  const errors: string[] = [];

  if (assumptions.revenueGrowthRate !== undefined) {
    if (assumptions.revenueGrowthRate < -50 || assumptions.revenueGrowthRate > 100) {
      errors.push('營收增長率必須在 -50% 到 100% 之間');
    }
  }

  if (assumptions.ebitdaMargin !== undefined) {
    if (assumptions.ebitdaMargin < 0 || assumptions.ebitdaMargin > 100) {
      errors.push('EBITDA 利潤率必須在 0% 到 100% 之間');
    }
  }

  if (assumptions.taxRate !== undefined) {
    if (assumptions.taxRate < 0 || assumptions.taxRate > 100) {
      errors.push('稅率必須在 0% 到 100% 之間');
    }
  }

  if (assumptions.depreciationToCapexRatio !== undefined) {
    if (assumptions.depreciationToCapexRatio < 0 || assumptions.depreciationToCapexRatio > 100) {
      errors.push('D&A/CapEx 比例必須在 0% 到 100% 之間');
    }
  }

  if (assumptions.revolvingCreditRepaymentRate !== undefined) {
    if (assumptions.revolvingCreditRepaymentRate < 0 || assumptions.revolvingCreditRepaymentRate > 100) {
      errors.push('循環信用年償還率必須在 0% 到 100% 之間');
    }
  }

  return errors;
};

// Slice 定義
export const assumptionsSlice = createSlice({
  name: 'assumptions',
  initialState,
  reducers: {
    // 更新整個假設
    setAssumptions: (state, action: PayloadAction<FutureAssumptions>) => {
      const errors = validateAssumptions(action.payload);
      if (errors.length > 0) {
        return;
      }
      return action.payload;
    },

    // 更新部分假設
    updateAssumptions: (state, action: PayloadAction<Partial<FutureAssumptions>>) => {
      const errors = validateAssumptions(action.payload);
      if (errors.length > 0) {
        return;
      }
      Object.assign(state, action.payload);
    },

    // 更新增長假設
    updateGrowthAssumptions: (state, action: PayloadAction<{
      revenueGrowthRate?: number;
      ebitdaMargin?: number;
      netMargin?: number;
    }>) => {
      const errors = validateAssumptions(action.payload);
      if (errors.length > 0) {
        return;
      }
      Object.assign(state, action.payload);
    },

    // 更新資本支出假設
    updateCapexAssumptions: (state, action: PayloadAction<{
      capexAsPercentageOfRevenue?: number;
      capexGrowthRate?: number;
    }>) => {
      Object.assign(state, action.payload);
    },

    // 更新營運資本假設
    updateWorkingCapitalAssumptions: (state, action: PayloadAction<{
      accountsReceivableDays?: number;
      inventoryDays?: number;
      accountsPayableDays?: number;
    }>) => {
      Object.assign(state, action.payload);
    },

    // 更新計算參數
    updateCalculationParameters: (state, action: PayloadAction<{
      depreciationToCapexRatio?: number;
      fixedAssetsToCapexMultiple?: number;
      revolvingCreditRepaymentRate?: number;
    }>) => {
      const errors = validateAssumptions(action.payload);
      if (errors.length > 0) {
        return;
      }
      Object.assign(state, action.payload);
    },

    // 重置為初始值
    resetAssumptions: () => initialState,
  },
});

// 導出 actions
export const {
  setAssumptions,
  updateAssumptions,
  updateGrowthAssumptions,
  updateCapexAssumptions,
  updateWorkingCapitalAssumptions,
  updateCalculationParameters,
  resetAssumptions,
} = assumptionsSlice.actions;

// 導出 reducer
export default assumptionsSlice.reducer;

// Selectors
export const selectAssumptions = (state: { assumptions: FutureAssumptions }) => 
  state.assumptions;

export const selectGrowthAssumptions = (state: { assumptions: FutureAssumptions }) => ({
  revenueGrowthRate: state.assumptions.revenueGrowthRate,
  ebitdaMargin: state.assumptions.ebitdaMargin,
  netMargin: state.assumptions.netMargin,
});

export const selectCalculationParameters = (state: { assumptions: FutureAssumptions }) => ({
  depreciationToCapexRatio: state.assumptions.depreciationToCapexRatio,
  fixedAssetsToCapexMultiple: state.assumptions.fixedAssetsToCapexMultiple,
  revolvingCreditRepaymentRate: state.assumptions.revolvingCreditRepaymentRate,
});