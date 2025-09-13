/**
 * Sources & Uses Data Hook
 * Centralizes all calculations and data preparation for sources & uses analysis
 * Following Linus principle: Data structures over algorithms
 */

import { useBusinessMetrics, useMnaDeal, useScenarios, useCurrentScenario } from '../../../../hooks/typed-hooks';
import { BusinessMetricsBeforeAcquisition, FinancingPlan, EquityInjection } from '../../../../types/financial';
import { DealDesignWithPlans, ScenariosContainer } from '../../../../types/hooks.types';

export interface SourceCategory {
  category: string;
  items: Array<{
    name: string;
    amount: number;
    type?: string;
    timing?: number;
    isSubItem?: boolean;
    highlight?: boolean;
  }>;
  subtotal: number;
}

export interface SourcesUsesData {
  enterpriseValue: number;
  totalDebt: number;
  totalEquity: number;
  totalSources: number;
  purchasePrice: number;
  transactionFees: number;
  workingCapitalAdjustment: number;
  cashForOperations: number;
  totalUses: number;
  specialSharesAmount: number;
  sourcesData: SourceCategory[];
  usesData: SourceCategory[];
  currentScenarioKey: string;
  entryMultiple: number;
  feePaymentTiming: string;
}

export const useSourcesUsesData = (): SourcesUsesData => {
  const businessMetrics = useBusinessMetrics() as BusinessMetricsBeforeAcquisition;
  const mnaDealDesign = useMnaDeal() as DealDesignWithPlans;
  const scenarios = useScenarios() as ScenariosContainer;
  const currentScenarioKey = useCurrentScenario();
  const currentScenarioData = scenarios[currentScenarioKey] || scenarios.base;

  // Calculate enterprise value
  const enterpriseValue = (businessMetrics.ebitda / 1000) * currentScenarioData.entryEvEbitdaMultiple;

  // Calculate funding sources - using actual financing plans
  const totalDebt = mnaDealDesign.financingPlans.reduce((sum: number, plan: FinancingPlan) => sum + plan.amount, 0) / 1000;
  const totalEquity = mnaDealDesign.equityInjections.reduce((sum: number, inj: EquityInjection) => sum + inj.amount, 0) / 1000;
  
  // Special shares are not funding sources but deferred payment
  const paymentSchedule = mnaDealDesign.assetDealSettings?.paymentSchedule?.schedule || [];
  const specialSharesAmount = paymentSchedule
    .filter((s: { paymentMethod?: string }) => s.paymentMethod === 'specialSharesBuyback')
    .reduce((sum: number, s: { percentage?: number }) => sum + (enterpriseValue * (s.percentage || 0) / 100), 0);
  
  const totalSources = totalDebt + totalEquity;
  
  // Calculate uses of funds
  const purchasePrice = enterpriseValue;
  const transactionFees = enterpriseValue * (mnaDealDesign.transactionFeePercentage || 2) / 100;
  
  // Get transaction fee payment timing description
  const getFeePaymentTiming = () => {
    if (mnaDealDesign.transactionFeePaymentSchedule?.paymentMethod === 'installment') {
      const installments = mnaDealDesign.transactionFeePaymentSchedule.installments || [];
      return installments.map((inst: { timingDescription?: string; timing?: string | number; percentage: number }) => 
        `${inst.timingDescription || inst.timing}: ${inst.percentage}%`
      ).join(' / ');
    }
    return '一次付清';
  };
  
  // Working capital adjustment (for asset deals)
  const isAssetDeal = mnaDealDesign.dealType === 'assetAcquisition';
  const workingCapitalAdjustment = isAssetDeal ? 0 : 
    ((businessMetrics.accountsReceivable + businessMetrics.inventory - businessMetrics.accountsPayable) / 1000) * 0.1;
  
  // Calculate base uses
  const baseUses = purchasePrice + transactionFees + workingCapitalAdjustment;
  
  // Calculate cash for operations to balance sources and uses
  const cashForOperations = totalSources - baseUses;
  
  // Total uses always equals total sources
  const totalUses = totalSources;

  // Detailed sources data
  const sourcesData: SourceCategory[] = [
    {
      category: '債務融資 (Debt Financing)',
      items: mnaDealDesign.financingPlans.map((plan: FinancingPlan) => ({
        name: plan.name,
        amount: plan.amount / 1000,
        type: plan.facilityType || plan.type,
        timing: plan.entryTiming || 0,
      })),
      subtotal: totalDebt,
    },
    {
      category: '股權投資 (Equity Investment)',
      items: mnaDealDesign.equityInjections.map((inj: EquityInjection) => ({
        name: inj.name,
        amount: inj.amount / 1000,
        type: inj.type,
        timing: inj.entryTiming || 0,
      })),
      subtotal: totalEquity,
    },
  ];

  // Uses data
  const usesData: SourceCategory[] = [
    {
      category: '收購成本 (Acquisition Cost)',
      items: [
        { name: '企業價值 (Enterprise Value)', amount: purchasePrice },
        ...(specialSharesAmount > 0 ? [{
          name: `- 其中：特別股遞延支付`, 
          amount: specialSharesAmount,
          isSubItem: true 
        }] : []),
        ...(specialSharesAmount > 0 ? [{
          name: `- 其中：現金支付`, 
          amount: purchasePrice - specialSharesAmount,
          isSubItem: true 
        }] : []),
      ],
      subtotal: purchasePrice,
    },
    {
      category: '交易費用 (Transaction Fees)',
      items: [
        { 
          name: `財務顧問、法律、盡職調查 (${getFeePaymentTiming()})`, 
          amount: transactionFees 
        },
      ],
      subtotal: transactionFees,
    },
    ...(workingCapitalAdjustment > 0 ? [{
      category: '營運資金調整 (Working Capital)',
      items: [
        { name: '營運資金需求', amount: workingCapitalAdjustment },
      ],
      subtotal: workingCapitalAdjustment,
    }] : []),
    ...(Math.abs(cashForOperations) > 0.01 ? [{
      category: '現金週轉金 (Cash for Operations)',
      items: [
        { 
          name: cashForOperations > 0 ? '剩餘資金作為現金儲備' : '資金缺口（需額外融資）',
          amount: cashForOperations,
          highlight: true
        },
      ],
      subtotal: cashForOperations,
    }] : []),
  ];

  return {
    enterpriseValue,
    totalDebt,
    totalEquity,
    totalSources,
    purchasePrice,
    transactionFees,
    workingCapitalAdjustment,
    cashForOperations,
    totalUses,
    specialSharesAmount,
    sourcesData,
    usesData,
    currentScenarioKey,
    entryMultiple: currentScenarioData.entryEvEbitdaMultiple,
    feePaymentTiming: getFeePaymentTiming(),
  };
};

// Formatting utilities
export const formatCurrency = (value: number) => {
  return `${value.toFixed(1)}M`;
};

export const formatPercentage = (value: number, total: number) => {
  return total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0.0%';
};

type ChipColor = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'default' | 'error';

export const getChipColor = (type: string): ChipColor => {
  const colorMap: Record<string, ChipColor> = {
    senior: 'primary',
    mezzanine: 'secondary',
    revolver: 'info',
    termLoanA: 'primary',
    termLoanB: 'secondary',
    common: 'success',
    preferred: 'warning',
  };
  return colorMap[type] || 'default';
};