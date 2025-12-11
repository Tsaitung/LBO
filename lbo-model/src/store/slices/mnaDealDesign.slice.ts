/**
 * M&A 交易設計 Slice
 * 管理併購交易結構、付款方式、里程碑條件等
 * 遵循 Linus 原則：簡單清晰，職責單一
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  MnaDealDesign, 
  FinancingPlan, 
  EquityInjection,
  DividendPolicy 
} from '../../types/financial';

// 初始狀態
const initialState: MnaDealDesign = {
  // 基本設定
  planningHorizon: 5,
  dealType: 'fullAcquisition',
  
  // 資產選擇
  assetSelections: {
    cashAndCashEquivalents: true,
    accountsReceivable: true,
    inventory: true,
    propertyPlantEquipment: true,
  },
  
  // 資產交易設定
  assetDealSettings: {
    dissolutionOption: 'no_dissolution',
    requireLiquidation: false,
    liquidationPeriod: 0,
    requireDissolution: false,
    milestonePaymentMethod: 'cash',
    specialSharesDetails: {
      dividendRate: 0,
      conversionRights: false,
      votingRights: false,
      redemptionPeriod: 0,
    },
    paymentSchedule: {
      installments: 1,
      schedule: [],
    },
  },
  
  // 付款結構（三期付款：40%/30%/30%）
  paymentStructure: {
    upfrontPayment: 40,
    year1MilestonePayment: 30,
    year2MilestonePayment: 30,
    paymentMethod: 'cash',
  },
  
  // 股權結構
  equityStructure: {
    commonShares: 100,
    preferredShares: 0,
    classAShares: 0,
    classBShares: 0,
  },
  
  // 里程碑條件
  milestones: {
    year1: {
      kpiTarget: '',
      paymentTrigger: '',
    },
    year2: {
      kpiTarget: '',
      paymentTrigger: '',
    },
  },
  
  // 融資結構
  financingStructure: {
    seniorDebtToEbitda: 4,
    mezzanineDebtToEbitda: 2,
    equityContribution: 30,
    revolverLimit: 100000,
  },
  
  // 交易費用
  transactionFeePercentage: 2,
  transactionFeePaymentSchedule: {
    paymentMethod: 'upfront',
    installments: [],
  },
  
  // 融資和股權計劃
  financingPlans: [],
  equityInjections: [],
  dividendPolicies: [],
};

/**
 * M&A 交易設計 Slice
 */
const mnaDealDesignSlice = createSlice({
  name: 'mnaDealDesign',
  initialState,
  reducers: {
    // 更新整體交易設計
    updateDealDesign: (state, action: PayloadAction<Partial<MnaDealDesign>>) => {
      Object.assign(state, action.payload);
    },
    
    // 設定規劃年期
    setPlanningHorizon: (state, action: PayloadAction<number>) => {
      state.planningHorizon = action.payload;
    },
    
    // 設定交易類型
    setDealType: (state, action: PayloadAction<'fullAcquisition' | 'assetAcquisition'>) => {
      state.dealType = action.payload;
    },
    
    // 更新資產選擇
    updateAssetSelections: (state, action: PayloadAction<Partial<MnaDealDesign['assetSelections']>>) => {
      state.assetSelections = { ...state.assetSelections, ...action.payload };
    },
    
    // 更新付款結構
    updatePaymentStructure: (state, action: PayloadAction<Partial<MnaDealDesign['paymentStructure']>>) => {
      state.paymentStructure = { ...state.paymentStructure, ...action.payload };
    },
    
    // 更新股權結構
    updateEquityStructure: (state, action: PayloadAction<Partial<MnaDealDesign['equityStructure']>>) => {
      state.equityStructure = { ...state.equityStructure, ...action.payload };
    },
    
    // 融資計劃管理
    addFinancingPlan: (state, action: PayloadAction<FinancingPlan>) => {
      state.financingPlans.push(action.payload);
    },
    
    updateFinancingPlan: (state, action: PayloadAction<{ index: number; plan: FinancingPlan }>) => {
      const { index, plan } = action.payload;
      if (index >= 0 && index < state.financingPlans.length) {
        state.financingPlans[index] = plan;
      }
    },
    
    removeFinancingPlan: (state, action: PayloadAction<number>) => {
      state.financingPlans.splice(action.payload, 1);
    },
    
    reorderFinancingPlans: (state, action: PayloadAction<{ from: number; to: number }>) => {
      const { from, to } = action.payload;
      const [removed] = state.financingPlans.splice(from, 1);
      state.financingPlans.splice(to, 0, removed);
    },
    
    // 股權注入管理
    addEquityInjection: (state, action: PayloadAction<EquityInjection>) => {
      state.equityInjections.push(action.payload);
    },
    
    updateEquityInjection: (state, action: PayloadAction<{ index: number; injection: EquityInjection }>) => {
      const { index, injection } = action.payload;
      if (index >= 0 && index < state.equityInjections.length) {
        state.equityInjections[index] = injection;
      }
    },
    
    removeEquityInjection: (state, action: PayloadAction<number>) => {
      state.equityInjections.splice(action.payload, 1);
    },
    
    // 股利政策管理
    setDividendPolicies: (state, action: PayloadAction<DividendPolicy[]>) => {
      state.dividendPolicies = action.payload;
    },
    
    // 交易費用設定
    setTransactionFee: (state, action: PayloadAction<number>) => {
      state.transactionFeePercentage = action.payload;
    },
    
    updateTransactionFeeSchedule: (
      state, 
      action: PayloadAction<MnaDealDesign['transactionFeePaymentSchedule']>
    ) => {
      state.transactionFeePaymentSchedule = action.payload;
    },
    
    // 里程碑設定
    updateMilestones: (state, action: PayloadAction<Partial<MnaDealDesign['milestones']>>) => {
      state.milestones = { ...state.milestones, ...action.payload };
    },
    
    // 融資結構設定
    updateFinancingStructure: (
      state, 
      action: PayloadAction<Partial<MnaDealDesign['financingStructure']>>
    ) => {
      state.financingStructure = { ...state.financingStructure, ...action.payload };
    },
    
    // 重置為初始狀態
    resetDealDesign: () => initialState,
  },
});

// 導出 actions
export const {
  updateDealDesign,
  setPlanningHorizon,
  setDealType,
  updateAssetSelections,
  updatePaymentStructure,
  updateEquityStructure,
  addFinancingPlan,
  updateFinancingPlan,
  removeFinancingPlan,
  reorderFinancingPlans,
  addEquityInjection,
  updateEquityInjection,
  removeEquityInjection,
  setDividendPolicies,
  setTransactionFee,
  updateTransactionFeeSchedule,
  updateMilestones,
  updateFinancingStructure,
  resetDealDesign,
} = mnaDealDesignSlice.actions;

// 導出 reducer
export default mnaDealDesignSlice.reducer;

// Selectors
export const selectDealDesign = (state: { mnaDealDesign: MnaDealDesign }) => state.mnaDealDesign;
export const selectFinancingPlans = (state: { mnaDealDesign: MnaDealDesign }) => state.mnaDealDesign.financingPlans;
export const selectEquityInjections = (state: { mnaDealDesign: MnaDealDesign }) => state.mnaDealDesign.equityInjections;
export const selectDividendPolicies = (state: { mnaDealDesign: MnaDealDesign }) => state.mnaDealDesign.dividendPolicies;
export const selectTransactionFee = (state: { mnaDealDesign: MnaDealDesign }) => state.mnaDealDesign.transactionFeePercentage;