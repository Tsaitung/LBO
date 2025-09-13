/**
 * 融資計劃 Slice
 * 管理債務結構、還款計劃、融資方案優化
 * 遵循 Linus 原則：消除特殊情況，統一處理
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FinancingPlan, FacilityType, RepaymentFrequency, LoanType } from '../../types/financial';

// 融資計劃狀態
interface FinancingPlanState {
  plans: FinancingPlan[];
  selectedPlanIndex: number | null;
  totalDebtCapacity: number;
  optimalStructure: {
    seniorDebt: number;
    mezzanineDebt: number;
    revolverLimit: number;
  };
}

// 初始狀態
const initialState: FinancingPlanState = {
  plans: [],
  selectedPlanIndex: null,
  totalDebtCapacity: 0,
  optimalStructure: {
    seniorDebt: 0,
    mezzanineDebt: 0,
    revolverLimit: 0,
  },
};

/**
 * 創建預設融資計劃
 */
function createDefaultPlan(type: FacilityType): FinancingPlan {
  return {
    id: `financing-${Date.now()}`,
    type: type === 'senior' ? 'equalPayment' : type === 'mezzanine' ? 'bullet' : 'revolving' as LoanType,
    name: `新${type === 'senior' ? '優先' : type === 'mezzanine' ? '夾層' : '循環'}債務`,
    amount: 0,
    interestRate: 0,
    maturity: type === 'revolver' ? 0 : 1,
    entryTiming: 0,
    facilityType: type,
    repaymentMethod: type === 'revolver' ? 'revolving' : 'equalPayment',
    repaymentFrequency: 'annual' as RepaymentFrequency,
    gracePeriod: 0,
    repaymentStructure: {
      type: type === 'revolver' ? 'revolving' : 'equalPayment',
    },
    covenants: [],
  };
}

/**
 * 計算債務容量
 */
function calculateDebtCapacity(ebitda: number, targetCoverage: number = 1.5): number {
  return ebitda * 6 / targetCoverage; // 簡化計算：EBITDA * 倍數 / 覆蓋率
}

/**
 * 優化融資結構
 */
function optimizeFinancingStructure(
  totalDebt: number,
  ebitda: number
): FinancingPlanState['optimalStructure'] {
  // 簡單的優化規則
  const seniorLimit = ebitda * 4; // Senior 最高 4x
  const mezzLimit = ebitda * 2; // Mezz 最高 2x
  
  return {
    seniorDebt: Math.min(totalDebt * 0.6, seniorLimit),
    mezzanineDebt: Math.min(totalDebt * 0.3, mezzLimit),
    revolverLimit: totalDebt * 0.1,
  };
}

/**
 * 融資計劃 Slice
 */
const financingPlanSlice = createSlice({
  name: 'financingPlan',
  initialState,
  reducers: {
    // 添加融資計劃
    addPlan: (state, action: PayloadAction<{ type: FacilityType; ebitda?: number }>) => {
      const newPlan = createDefaultPlan(action.payload.type);
      state.plans.push(newPlan);
      state.selectedPlanIndex = state.plans.length - 1;
      
      // 更新債務容量
      if (action.payload.ebitda) {
        state.totalDebtCapacity = calculateDebtCapacity(action.payload.ebitda);
      }
    },
    
    // 更新融資計劃
    updatePlan: (state, action: PayloadAction<{ index: number; updates: Partial<FinancingPlan> }>) => {
      const { index, updates } = action.payload;
      if (index >= 0 && index < state.plans.length) {
        state.plans[index] = { ...state.plans[index], ...updates };
      }
    },
    
    // 刪除融資計劃
    removePlan: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index >= 0 && index < state.plans.length) {
        state.plans.splice(index, 1);
        // 調整選中索引
        if (state.selectedPlanIndex === index) {
          state.selectedPlanIndex = null;
        } else if (state.selectedPlanIndex !== null && state.selectedPlanIndex > index) {
          state.selectedPlanIndex--;
        }
      }
    },
    
    // 重新排序融資計劃
    reorderPlans: (state, action: PayloadAction<{ from: number; to: number }>) => {
      const { from, to } = action.payload;
      const [removed] = state.plans.splice(from, 1);
      state.plans.splice(to, 0, removed);
      
      // 調整選中索引
      if (state.selectedPlanIndex === from) {
        state.selectedPlanIndex = to;
      } else if (state.selectedPlanIndex !== null) {
        if (from < state.selectedPlanIndex && to >= state.selectedPlanIndex) {
          state.selectedPlanIndex--;
        } else if (from > state.selectedPlanIndex && to <= state.selectedPlanIndex) {
          state.selectedPlanIndex++;
        }
      }
    },
    
    // 選擇計劃
    selectPlan: (state, action: PayloadAction<number | null>) => {
      state.selectedPlanIndex = action.payload;
    },
    
    // 批量更新計劃
    setPlans: (state, action: PayloadAction<FinancingPlan[]>) => {
      state.plans = action.payload;
    },
    
    // 優化融資結構
    optimizeStructure: (state, action: PayloadAction<{ totalDebt: number; ebitda: number }>) => {
      const { totalDebt, ebitda } = action.payload;
      state.totalDebtCapacity = calculateDebtCapacity(ebitda);
      state.optimalStructure = optimizeFinancingStructure(totalDebt, ebitda);
    },
    
    // 應用優化結構
    applyOptimalStructure: (state) => {
      const { seniorDebt, mezzanineDebt, revolverLimit } = state.optimalStructure;
      
      // 清空現有計劃
      state.plans = [];
      
      // 創建優化後的計劃
      if (seniorDebt > 0) {
        const seniorPlan = createDefaultPlan('senior');
        seniorPlan.amount = seniorDebt;
        state.plans.push(seniorPlan);
      }
      
      if (mezzanineDebt > 0) {
        const mezzPlan = createDefaultPlan('mezzanine');
        mezzPlan.amount = mezzanineDebt;
        state.plans.push(mezzPlan);
      }
      
      if (revolverLimit > 0) {
        const revolverPlan = createDefaultPlan('revolver');
        revolverPlan.amount = revolverLimit;
        state.plans.push(revolverPlan);
      }
    },
    
    // 清空所有計劃
    clearPlans: (state) => {
      state.plans = [];
      state.selectedPlanIndex = null;
    },
    
    // 重置狀態
    resetFinancingPlans: () => initialState,
  },
});

// 導出 actions
export const {
  addPlan,
  updatePlan,
  removePlan,
  reorderPlans,
  selectPlan,
  setPlans,
  optimizeStructure,
  applyOptimalStructure,
  clearPlans,
  resetFinancingPlans,
} = financingPlanSlice.actions;

// 導出 reducer
export default financingPlanSlice.reducer;

// Selectors
export const selectFinancingPlans = (state: { financingPlan: FinancingPlanState }) => 
  state.financingPlan.plans;

export const selectSelectedPlan = (state: { financingPlan: FinancingPlanState }) => {
  const { plans, selectedPlanIndex } = state.financingPlan;
  return selectedPlanIndex !== null ? plans[selectedPlanIndex] : null;
};

export const selectTotalDebt = (state: { financingPlan: FinancingPlanState }) =>
  state.financingPlan.plans.reduce((sum, plan) => sum + plan.amount, 0);

export const selectDebtByType = (state: { financingPlan: FinancingPlanState }) => {
  const result: Record<FacilityType, number> = {
    senior: 0,
    mezzanine: 0,
    revolver: 0,
    termLoanA: 0,
    termLoanB: 0,
  };
  
  state.financingPlan.plans.forEach(plan => {
    if (plan.facilityType) {
      result[plan.facilityType] += plan.amount;
    }
  });
  
  return result;
};

export const selectDebtCapacity = (state: { financingPlan: FinancingPlanState }) =>
  state.financingPlan.totalDebtCapacity;

export const selectOptimalStructure = (state: { financingPlan: FinancingPlanState }) =>
  state.financingPlan.optimalStructure;
