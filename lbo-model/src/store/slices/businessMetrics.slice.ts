/**
 * Business Metrics Slice
 * 管理被併購標的的歷史財務數據
 * 從原本的 lboSlice.ts 拆分出來
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import { BusinessMetricsBeforeAcquisition } from '../../types/financial';

// 基礎數值定義（避免硬編碼）
const baseRevenue = 372786; // 營收 (仟元)
const initialCogs = 342000; // COGS 初始值 (仟元)
const initialGrossProfit = baseRevenue - initialCogs; // 毛利 = 營收 - COGS
const grossMarginRatio = initialGrossProfit / baseRevenue; // 毛利率
const operatingExpensesRatio = 0.255; // 營業費用預設比例 (25.5% of revenue)

// 計算初始值
const initialOperatingExpenses = baseRevenue * operatingExpensesRatio;
const initialEbitda = initialGrossProfit - initialOperatingExpenses; // EBITDA 推導計算

// 初始狀態（基礎值，後續會統一運算推導欄位）
const baseInitialState: BusinessMetricsBeforeAcquisition = {
  // 損益表指標
  revenue: baseRevenue, // 營收 (仟元)
  cogs: initialCogs, // 銷貨成本 (動態計算)
  grossProfit: initialGrossProfit, // 毛利 (動態計算)
  grossMargin: grossMarginRatio * 100, // 毛利率 % (動態計算)
  operatingExpenses: initialOperatingExpenses, // 營業費用 (動態計算)
  ebitda: initialEbitda, // EBITDA (推導計算)
  netIncome: 23684, // 淨利 (仟元)

  // 資產負債表指標
  totalAssets: 0, // 總資產 (仟元) - 將自動計算
  totalLiabilities: 0, // 總負債 (仟元) - 將自動計算
  shareholdersEquity: 0, // 股東權益 (仟元) - 自動計算

  // 資產項目 (含交易勾選狀態)
  cashAndCashEquivalents: 25000, // 現金及約當現金 (仟元)
  cashIncludedInTransaction: true, // 預設納入交易
  accountsReceivable: 46800, // 應收帳款 (仟元)
  arIncludedInTransaction: false, // 預設不納入交易
  inventory: 35000, // 存貨 (仟元)
  inventoryIncludedInTransaction: true, // 預設納入交易
  propertyPlantEquipment: 280000, // 不動產廠房及設備 (仟元)
  ppeIncludedInTransaction: true, // 預設納入交易

  // 負債項目 (含交易勾選狀態)
  accountsPayable: 31200, // 應付帳款 (仟元)
  apIncludedInTransaction: false, // 預設不納入交易
  shortTermDebt: 45000, // 短期借款 (仟元)
  stdIncludedInTransaction: false, // 預設不納入交易
  longTermDebt: 180000, // 長期借款 (仟元)
  ltdIncludedInTransaction: false, // 預設不納入交易
  otherCurrentLiabilities: 15000, // 其他流動負債 (仟元)
  oclIncludedInTransaction: false, // 預設不納入交易
  otherLongTermLiabilities: 40000, // 其他長期負債 (仟元)
  oltlIncludedInTransaction: false, // 預設不納入交易

  // 現金流量表指標
  operatingCashFlow: 52073, // 營業現金流量 (仟元)
  investingCashFlow: -28000, // 投資現金流量 (仟元)
  financingCashFlow: 15000, // 融資現金流量 (仟元)

  // 其他關鍵指標
  depreciationAmortization: 28000, // 折舊攤銷 (仟元)
  interestExpense: 18000, // 利息費用 (仟元)
  taxExpense: 12000, // 所得稅費用 (仟元)
  workingCapital: 78000, // 營運資本 (仟元)
};

// 在初始化時即計算一次推導欄位，避免初始渲染為 0
const initialState: BusinessMetricsBeforeAcquisition = { ...baseInitialState };
calculateTotals(initialState, 0);

// 計算輔助函數（含稅率參數）
function calculateTotals(state: BusinessMetricsBeforeAcquisition, taxRate: number = 0) {
  // 計算毛利和毛利率
  state.grossProfit = state.revenue - state.cogs;
  state.grossMargin = state.revenue > 0 ? (state.grossProfit / state.revenue) * 100 : 0;
  
  // 自動計算 EBITDA = Gross Profit - Operating Expenses
  state.ebitda = state.grossProfit - state.operatingExpenses;
  
  // 計算 EBIT = EBITDA - Depreciation & Amortization
  const ebit = state.ebitda - state.depreciationAmortization;
  
  // 自動計算所得稅 = EBIT × 稅率
  state.taxExpense = Math.max(0, Math.round(ebit * (taxRate / 100)));
  
  // 自動計算淨利 = EBIT - 利息費用 - 所得稅
  state.netIncome = ebit - state.interestExpense - state.taxExpense;
  
  // 計算總資產
  state.totalAssets = 
    state.cashAndCashEquivalents +
    state.accountsReceivable +
    state.inventory +
    state.propertyPlantEquipment;

  // 計算總負債
  state.totalLiabilities = 
    state.accountsPayable +
    state.shortTermDebt +
    state.longTermDebt +
    state.otherCurrentLiabilities +
    state.otherLongTermLiabilities;

  // 計算營運資本
  const currentAssets = state.cashAndCashEquivalents + state.accountsReceivable + state.inventory;
  const currentLiabilities = state.accountsPayable + state.shortTermDebt + state.otherCurrentLiabilities;
  state.workingCapital = currentAssets - currentLiabilities;

  // 強制執行會計恆等式 (Linus: "No special cases. Assets = Liabilities + Equity.")
  state.shareholdersEquity = state.totalAssets - state.totalLiabilities;

  // 計算營業現金流量
  state.operatingCashFlow = state.ebitda - state.interestExpense - state.taxExpense + state.depreciationAmortization;
}

// Slice 定義
export const businessMetricsSlice = createSlice({
  name: 'businessMetrics',
  initialState,
  reducers: {
    // 更新整個業務指標（支援稅率參數）
    setBusinessMetrics: (state, action: PayloadAction<{
      data: Partial<BusinessMetricsBeforeAcquisition>;
      taxRate?: number;
    }>) => {
      Object.assign(state, action.payload.data);
      calculateTotals(state, action.payload.taxRate ?? 0);
    },

    // 更新損益表指標（移除 netIncome 和 taxExpense，因為它們是自動計算的）
    updateIncomeMetrics: (state, action: PayloadAction<{
      revenue?: number;
      cogs?: number;
      operatingExpenses?: number;
      depreciationAmortization?: number;
      interestExpense?: number;
      taxRate?: number;
    }>) => {
      const { taxRate, ...metrics } = action.payload;
      Object.assign(state, metrics);
      calculateTotals(state, taxRate ?? 0);
    },

    // 更新資產項目
    updateAssets: (state, action: PayloadAction<{
      cashAndCashEquivalents?: number;
      accountsReceivable?: number;
      inventory?: number;
      propertyPlantEquipment?: number;
    }>) => {
      Object.assign(state, action.payload);
      // 無外部稅率來源時，不注入硬值（視為 0）
      calculateTotals(state, 0);
    },

    // 更新負債項目
    updateLiabilities: (state, action: PayloadAction<{
      accountsPayable?: number;
      shortTermDebt?: number;
      longTermDebt?: number;
      otherCurrentLiabilities?: number;
      otherLongTermLiabilities?: number;
    }>) => {
      Object.assign(state, action.payload);
      // 無外部稅率來源時，不注入硬值（視為 0）
      calculateTotals(state, 0);
    },

    // 更新交易包含狀態
    updateTransactionInclusions: (state, action: PayloadAction<{
      cashIncludedInTransaction?: boolean;
      arIncludedInTransaction?: boolean;
      inventoryIncludedInTransaction?: boolean;
      ppeIncludedInTransaction?: boolean;
      apIncludedInTransaction?: boolean;
      stdIncludedInTransaction?: boolean;
      ltdIncludedInTransaction?: boolean;
      oclIncludedInTransaction?: boolean;
      oltlIncludedInTransaction?: boolean;
    }>) => {
      Object.assign(state, action.payload);
    },

    // 重置為初始值
    resetBusinessMetrics: () => initialState,
  },
  extraReducers: (builder) => {
    // 當持久化數據恢復時，重新計算推導欄位，避免顯示為 0
    builder.addCase(REHYDRATE, (state) => {
      calculateTotals(state, 0);
    });
  }
});

// 導出 actions
export const {
  setBusinessMetrics,
  updateIncomeMetrics,
  updateAssets,
  updateLiabilities,
  updateTransactionInclusions,
  resetBusinessMetrics,
} = businessMetricsSlice.actions;

// 導出 reducer
export default businessMetricsSlice.reducer;

// Selectors
export const selectBusinessMetrics = (state: { businessMetrics: BusinessMetricsBeforeAcquisition }) => 
  state.businessMetrics;

export const selectTotalAssets = (state: { businessMetrics: BusinessMetricsBeforeAcquisition }) => 
  state.businessMetrics.totalAssets;

export const selectTotalLiabilities = (state: { businessMetrics: BusinessMetricsBeforeAcquisition }) => 
  state.businessMetrics.totalLiabilities;

export const selectWorkingCapital = (state: { businessMetrics: BusinessMetricsBeforeAcquisition }) => 
  state.businessMetrics.workingCapital;
