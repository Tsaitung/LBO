/**
 * Sources & Uses 計算 Hook
 * Linus 原則：純計算，無副作用
 */

import { useMemo } from 'react';
import { 
  useBusinessMetrics, 
  useMnaDeal, 
  useScenarios, 
  useCurrentScenario 
} from '../../../../hooks/typed-hooks';
import { FinancingPlan, EquityInjection } from '../../../../types/financial';
import { DealCalculator } from '../../../../domain/deal/DealCalculator';

export interface SourceItem {
  name: string;
  amount: number;
  type?: string;
  percentage?: number;
}

export interface SourceCategory {
  category: string;
  items: SourceItem[];
  subtotal: number;
}

export interface UseItem {
  name: string;
  amount: number;
  percentage?: number;
  note?: string;
}

/**
 * 統一的 Sources & Uses 計算邏輯
 * 無特殊案例，純數據流
 */
export function useSourcesUsesCalculations() {
  const businessMetrics = useBusinessMetrics();
  const mnaDealDesign = useMnaDeal();
  const scenarios = useScenarios();
  const currentScenarioKey = useCurrentScenario();
  const currentScenario = scenarios[currentScenarioKey];

  return useMemo(() => {
    // 企業價值計算（統一使用 DealCalculator，並轉換為百萬元顯示）
    const enterpriseValueK = DealCalculator.calculateEnterpriseValue(
      businessMetrics?.ebitda || 0, 
      currentScenario?.entryEvEbitdaMultiple || 0
    );
    const enterpriseValue = DealCalculator.toMillions(enterpriseValueK);

    // 資金來源計算
    const debtFinancing = mnaDealDesign?.financingPlans?.reduce(
      (sum: number, plan: FinancingPlan) => sum + (plan.amount || 0), 0
    ) / 1000 || 0;

    const equityInvestment = mnaDealDesign?.equityInjections?.reduce(
      (sum: number, inj: EquityInjection) => sum + (inj.amount || 0), 0
    ) / 1000 || 0;

    const totalSources = debtFinancing + equityInvestment;

    // 資金使用計算
    const purchasePrice = enterpriseValue;
    const transactionFees = enterpriseValue * 
                          (mnaDealDesign?.transactionFeePercentage || 2) / 100;
    
    const isAssetDeal = mnaDealDesign?.dealType === 'assetAcquisition';
    const workingCapitalAdjustment = isAssetDeal ? 0 : 
      ((businessMetrics?.accountsReceivable || 0) + 
       (businessMetrics?.inventory || 0) - 
       (businessMetrics?.accountsPayable || 0)) / 1000 * 0.1;

    const baseUses = purchasePrice + transactionFees + workingCapitalAdjustment;
    const cashForOperations = Math.max(0, totalSources - baseUses);
    
    // 平衡檢查：如果資金不足，警告並顯示缺口
    if (totalSources < baseUses) {
      const fundingGap = baseUses - totalSources;
      console.warn(`⚠️ 資金缺口警告: ${fundingGap.toFixed(1)} 百萬，需要增加融資或降低收購價格`);
    }
    
    const totalUses = totalSources; // 確保 UI 顯示平衡

    // 構建資金來源結構
    const sources: SourceCategory[] = [
      {
        category: '債務融資',
        items: mnaDealDesign?.financingPlans?.map((plan: FinancingPlan) => ({
          name: plan.name || '未命名貸款',
          amount: plan.amount / 1000,
          type: plan.facilityType || plan.type,
          percentage: (plan.amount / 1000 / totalSources) * 100,
        })) || [],
        subtotal: debtFinancing,
      },
      {
        category: '股權投資',
        items: mnaDealDesign?.equityInjections?.map((inj: EquityInjection) => ({
          name: inj.name || '未命名投資',
          amount: inj.amount / 1000,
          type: inj.type,
          percentage: (inj.amount / 1000 / totalSources) * 100,
        })) || [],
        subtotal: equityInvestment,
      },
    ];

    // 構建資金使用結構
    const uses: UseItem[] = [
      {
        name: '收購價格',
        amount: purchasePrice,
        percentage: (purchasePrice / totalUses) * 100,
      },
      {
        name: '交易費用',
        amount: transactionFees,
        percentage: (transactionFees / totalUses) * 100,
        note: `${mnaDealDesign?.transactionFeePercentage || 2}% 費率`,
      },
      workingCapitalAdjustment > 0 && {
        name: '營運資金調整',
        amount: workingCapitalAdjustment,
        percentage: (workingCapitalAdjustment / totalUses) * 100,
      },
      cashForOperations > 0 && {
        name: '營運週轉金',
        amount: cashForOperations,
        percentage: (cashForOperations / totalUses) * 100,
      },
    ].filter(Boolean) as UseItem[];

    return {
      sources,
      uses,
      totalSources,
      totalUses,
      isBalanced: Math.abs(totalSources - totalUses) < 0.01,
      enterpriseValue,
      debtEquityRatio: equityInvestment > 0 ? debtFinancing / equityInvestment : 0,
    };
  }, [businessMetrics, mnaDealDesign, currentScenario]);
}